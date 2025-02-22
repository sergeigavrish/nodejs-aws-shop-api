import { Handler } from 'aws-lambda';
import { ProductService } from '../service/product-service';
import { ProductRepository } from '../domain';

const productRepository = new ProductRepository();
const productService = new ProductService(productRepository);

export const getProducts: Handler = async () => {
  try {
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
