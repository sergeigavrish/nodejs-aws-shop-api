import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Cors, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
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

    const environment = {
      PRODUCT_TABLE_NAME: productsTable.tableName,
      STOCK_TABLE_NAME: stocksTable.tableName,
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
    stocksTable.grantReadData(getProductsFunction);
    stocksTable.grantReadData(getProductByIdFunction);
    stocksTable.grantWriteData(createProductFunction);

    new CfnOutput(this, 'ApiGatewayUrl', {
      value: productServiceApi.url,
      description: 'Product Service API Gateway endpoint URL',
    });
  }
}
