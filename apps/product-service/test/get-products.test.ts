import { APIGatewayEvent, Callback, Context } from 'aws-lambda';
import { Product } from '../src/domain/models/product';
import { getProducts } from '../src/presentation/get-products';
import { ProductService } from '../src/service/product-service';

jest.mock('../src/service/product-service');

describe.only('getProducts', () => {
  let event: APIGatewayEvent;
  let context: Context;
  let callback: Callback;

  beforeEach(() => {
    event = {} as APIGatewayEvent;
    context = {} as Context;
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    callback = () => {};
    (ProductService.prototype.getProducts as jest.Mock).mockClear();
  });

  afterEach(() => {
    (ProductService.prototype.getProducts as jest.Mock).mockClear();
  });

  describe('Status 200', () => {
    it('Should return all products', async () => {
      const products: Product[] = [
        {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          title: 'Product 1',
          description: 'Description for Product 1',
          price: 10.99,
          count: 100,
        },
        {
          id: 'c9eb182b-1c3e-4c3b-8c3e-1c3e4c3b8c3e',
          title: 'Product 2',
          description: 'Description for Product 2',
          price: 15.49,
          count: 200,
        },
      ];

      (ProductService.prototype.getProducts as jest.Mock).mockResolvedValueOnce(
        products
      );

      const response = await getProducts(event, context, callback);

      expect(ProductService.prototype.getProducts).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual(products);
    });
  });

  describe('Status 500', () => {
    it('Should return "Internal server error" message', async () => {
      (ProductService.prototype.getProducts as jest.Mock).mockRejectedValueOnce(
        new Error()
      );

      const response = await getProducts(event, context, callback);

      expect(ProductService.prototype.getProducts).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(500);
      expect(response.body).toBe('Internal server error');
    });
  });
});
