import { APIGatewayEvent, Handler } from 'aws-lambda';
import { ProductService } from '../service/product-service';
import { ProductRepository } from '../domain';

const productRepository = new ProductRepository();
const productService = new ProductService(productRepository);

export const getProductById: Handler = async (event: APIGatewayEvent) => {
  try {
    const productId = event.pathParameters?.productId;
    if (!productId) {
      return {
        statusCode: 400,
        body: 'Product Id is not valid',
      };
    }
    const product = await productService.getProductById(productId);

    if (!product) {
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
