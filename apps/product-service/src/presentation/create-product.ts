import { APIGatewayEvent, Handler } from 'aws-lambda';
import { ProductService } from '../service/product-service';
import { ProductRepository } from '../domain';
import { DynamoDBDataSource } from '../data/dynamodb-data-source';
import { client } from '../data/db/dynamo-db-service';
import { createProductDtoValidator } from '../validators/create-product-dto.validator';

const dataSource = new DynamoDBDataSource(client);
const productRepository = new ProductRepository(dataSource);
const productService = new ProductService(productRepository);

export const createProduct: Handler = async (event: APIGatewayEvent) => {
  try {
    console.log('createProduct | ', event);
    const productDto = JSON.parse(event.body!);
    if (!createProductDtoValidator(productDto)) {
      console.log('createProduct | Status 400');
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: 'Product is not valid',
      };
    }
    const createdProduct = await productService.createProduct(productDto);
    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify(createdProduct),
    };
  } catch (error) {
    console.log('createProduct | Status 500 | ', error);
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
