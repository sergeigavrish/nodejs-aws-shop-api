import {
  CfnOutput,
  CfnParameter,
  Duration,
  Stack,
  StackProps,
} from 'aws-cdk-lib';
import { Cors, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { SubscriptionFilter, Topic } from 'aws-cdk-lib/aws-sns';
import { EmailSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { config } from 'dotenv';

config();

export class ProductServiceStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const productsTable = Table.fromTableName(
      this,
      'ProductServiceProductsTable',
      process.env.PRODUCT_TABLE_NAME!
    );

    const stocksTable = Table.fromTableName(
      this,
      'ProductServiceStocksTable',
      process.env.STOCK_TABLE_NAME!
    );

    const catalogItemsQueue = new Queue(
      this,
      'ProductServiceCatalogItemsQueue',
      {
        visibilityTimeout: Duration.minutes(1),
        retentionPeriod: Duration.days(1),
        receiveMessageWaitTime: Duration.seconds(20),
      }
    );

    const catalogItemsEventSource = new SqsEventSource(catalogItemsQueue, {
      batchSize: 5,
    });

    const createProductTopic = new Topic(this, 'CreateProductTopic ', {});
    createProductTopic.addSubscription(
      new EmailSubscription(process.env.CREATE_PRODUCT_HUGE_STOCK_TOPIC_EMAIL!, {
        filterPolicy: {
          count: SubscriptionFilter.numericFilter({
            greaterThan: 10,
          }),
        },
      })
    );
    createProductTopic.addSubscription(
      new EmailSubscription(process.env.CREATE_PRODUCT_TOPIC_EMAIL!, {
        filterPolicy: {
          count: SubscriptionFilter.numericFilter({
            lessThanOrEqualTo: 10,
          }),
        },
      })
    );

    const environment = {
      PRODUCT_TABLE_NAME: productsTable.tableName,
      STOCK_TABLE_NAME: stocksTable.tableName,
      CREATE_PRODUCT_TOPIC_ARN: createProductTopic.topicArn,
    };

    const getProductsFunction = new NodejsFunction(
      this,
      'ProductServiceGetProducts',
      {
        entry: 'src/presentation/get-products.ts',
        handler: 'getProducts',
        runtime: Runtime.NODEJS_22_X,
        environment,
      }
    );

    const getProductByIdFunction = new NodejsFunction(
      this,
      'ProductServiceGetProductById',
      {
        entry: 'src/presentation/get-product-by-id.ts',
        handler: 'getProductById',
        runtime: Runtime.NODEJS_22_X,
        environment,
      }
    );

    const createProductFunction = new NodejsFunction(
      this,
      'ProductServiceCreateProduct',
      {
        entry: 'src/presentation/create-product.ts',
        handler: 'createProduct',
        runtime: Runtime.NODEJS_22_X,
        environment,
      }
    );

    const catalogBatchProcessFunction = new NodejsFunction(
      this,
      'ProductServiceCatalogBatchProcess',
      {
        entry: 'src/presentation/catalog-batch-process.ts',
        handler: 'catalogBatchProcess',
        runtime: Runtime.NODEJS_22_X,
        environment,
      }
    );

    const productServiceApi = new RestApi(this, 'ProductServiceApi', {
      deployOptions: {
        stageName: 'dev',
      },
      restApiName: 'Product Service API',
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: Cors.DEFAULT_HEADERS,
        allowCredentials: true,
      },
    });

    const productsResource = productServiceApi.root.addResource('products');
    productsResource.addMethod(
      'GET',
      new LambdaIntegration(getProductsFunction)
    );
    productsResource.addMethod(
      'POST',
      new LambdaIntegration(createProductFunction)
    );

    const productByIdResource = productsResource.addResource('{productId}');
    productByIdResource.addMethod(
      'GET',
      new LambdaIntegration(getProductByIdFunction)
    );

    productsTable.grantReadData(getProductsFunction);
    productsTable.grantReadData(getProductByIdFunction);
    productsTable.grantWriteData(createProductFunction);
    productsTable.grantWriteData(catalogBatchProcessFunction);
    stocksTable.grantReadData(getProductsFunction);
    stocksTable.grantReadData(getProductByIdFunction);
    stocksTable.grantWriteData(createProductFunction);
    stocksTable.grantWriteData(catalogBatchProcessFunction);
    catalogBatchProcessFunction.addEventSource(catalogItemsEventSource);
    createProductTopic.grantPublish(catalogBatchProcessFunction);

    new CfnOutput(this, 'ApiGatewayUrl', {
      value: productServiceApi.url,
      description: 'Product Service API Gateway endpoint URL',
    });

    new CfnOutput(this, 'CatalogItemsQueueArn', {
      value: catalogItemsQueue.queueArn,
      description: 'Catalog Items Queue ARN',
      exportName: 'CatalogItemsQueueArn',
    });
  }
}
