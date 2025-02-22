import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Cors, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export class ProductServiceStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const getProductsFunction = new NodejsFunction(
      this,
      'ProductServiceGetProducts',
      {
        entry: 'src/presentation/get-products.ts',
        handler: 'getProducts',
        runtime: Runtime.NODEJS_22_X,
      }
    );

    const getProductByIdFunction = new NodejsFunction(
      this,
      'ProductServiceGetProductById',
      {
        entry: 'src/presentation/get-product-by-id.ts',
        handler: 'getProductById',
        runtime: Runtime.NODEJS_22_X,
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

    const productByIdResource = productsResource.addResource('{productId}');
    productByIdResource.addMethod(
      'GET',
      new LambdaIntegration(getProductByIdFunction)
    );

    new CfnOutput(this, 'ApiGatewayUrl', {
      value: productServiceApi.url,
      description: 'Product Service API Gateway endpoint URL',
    });
  }
}
