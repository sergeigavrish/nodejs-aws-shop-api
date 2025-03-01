import { APIGatewayEvent, Callback, Context } from 'aws-lambda';
import { Product } from '../src/models/product';
import { ProductService } from '../src/service/product-service';
import { getProductById } from '../src/presentation/get-product-by-id';

jest.mock('../src/service/product-service');

describe.only('getProductById', () => {
  let event: APIGatewayEvent;
  let context: Context;
  let callback: Callback;

  beforeEach(() => {
    event = {} as APIGatewayEvent;
    context = {} as Context;
    callback = () => {};
    (ProductService.prototype.getProductById as jest.Mock).mockClear();
  });

  afterEach(() => {
    (ProductService.prototype.getProductById as jest.Mock).mockClear();
  });

  describe('Status 200', () => {
    it('Should return all products', async () => {
      const product: Product = {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        title: 'Product 1',
        description: 'Description for Product 1',
        price: 10.99,
        count: 100,
      };

      event.pathParameters = {
        productId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      };

      (
        ProductService.prototype.getProductById as jest.Mock
      ).mockResolvedValueOnce(product);

      const response = await getProductById(event, context, callback);

      expect(ProductService.prototype.getProductById).toHaveBeenCalledTimes(1);
      expect(ProductService.prototype.getProductById).toHaveBeenCalledWith(
        event.pathParameters.productId
      );
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual(product);
    });
  });

  describe('Status 400', () => {
    it('Should return "Product Id is not valid" message', async () => {
      const response = await getProductById(event, context, callback);

      expect(ProductService.prototype.getProductById).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(400);
      expect(response.body).toBe('Product Id is not valid');
    });
  });

  describe('Status 404', () => {
    it('Should return "Product not found" message', async () => {
      (
        ProductService.prototype.getProductById as jest.Mock
      ).mockResolvedValueOnce(null);

      event.pathParameters = {
        productId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      };

      const response = await getProductById(event, context, callback);

      expect(ProductService.prototype.getProductById).toHaveBeenCalledTimes(1);
      expect(ProductService.prototype.getProductById).toHaveBeenCalledWith(
        event.pathParameters.productId
      );
      expect(response.statusCode).toBe(404);
      expect(response.body).toBe('Product not found');
    });
  });

  describe('Status 500', () => {
    it('Should return "Internal server error" message', async () => {
      (
        ProductService.prototype.getProductById as jest.Mock
      ).mockRejectedValueOnce(new Error());

      event.pathParameters = {
        productId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      };

      const response = await getProductById(event, context, callback);

      expect(ProductService.prototype.getProductById).toHaveBeenCalledTimes(1);
      expect(ProductService.prototype.getProductById).toHaveBeenCalledWith(
        event.pathParameters.productId
      );
      expect(response.statusCode).toBe(500);
      expect(response.body).toBe('Internal server error');
    });
  });
});
