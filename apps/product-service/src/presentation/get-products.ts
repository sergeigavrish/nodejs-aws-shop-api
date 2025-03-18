import { APIGatewayEvent, Handler } from 'aws-lambda';
import { ProductService } from '../service/product-service';
import { ProductRepository } from '../domain';
import { dynamoDbClient } from '../data/cleints/dynamo-db-client';
import { DynamoDBDataSource } from '../data/dynamodb-data-source';

const dataSource = new DynamoDBDataSource(dynamoDbClient);
const productRepository = new ProductRepository(dataSource);
const productService = new ProductService(productRepository);

export const getProducts: Handler = async (event: APIGatewayEvent) => {
  try {
    console.log('getProducts | ', event);
    const products = await productService.getProducts();
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify(products),
    };
  } catch (error) {
    console.log('getProducts | ', error);
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
