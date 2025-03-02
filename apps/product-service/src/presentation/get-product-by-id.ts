import { APIGatewayEvent, Handler } from 'aws-lambda';
import { ProductService } from '../service/product-service';
import { ProductRepository } from '../domain';
import { validate } from 'uuid';
import { DynamoDBDataSource } from '../data/dynamodb-data-source';
import { client } from '../data/db/dynamo-db-service';

const dataSource = new DynamoDBDataSource(client);
const productRepository = new ProductRepository(dataSource);
const productService = new ProductService(productRepository);

export const getProductById: Handler = async (event: APIGatewayEvent) => {
  try {
    console.log('getProductById | ', event);
    const productId = event.pathParameters?.productId;
    if (!productId || !validate(productId)) {
      console.log('getProductById | Status 400');
      return {
        statusCode: 400,
        body: 'Product Id is not valid',
      };
    }
    const product = await productService.getProductById(productId);

    if (!product) {
      console.log('getProductById | Status 404');
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: 'Product not found',
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify(product),
    };
  } catch (error) {
    console.log('getProductById | Status 500 | ', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: 'Internal server error',
    };
  }
};
