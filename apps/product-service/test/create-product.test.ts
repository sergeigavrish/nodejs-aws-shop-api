import { APIGatewayEvent, Callback, Context } from 'aws-lambda';
import { Product } from '../src/domain/models/product';
import { ProductService } from '../src/service/product-service';
import { createProduct } from '../src/presentation/create-product';
import { CreateProductDto } from '../src/dtos';

jest.mock('../src/service/product-service');

describe.only('createProduct', () => {
  let event: APIGatewayEvent;
  let context: Context;
  let callback: Callback;

  beforeEach(() => {
    event = {} as APIGatewayEvent;
    context = {} as Context;
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    callback = () => {};
    (ProductService.prototype.createProduct as jest.Mock).mockClear();
  });

  afterEach(() => {
    (ProductService.prototype.createProduct as jest.Mock).mockClear();
  });

  describe('Status 200', () => {
    it('Should create product', async () => {
      const product: CreateProductDto = {
        title: 'Product 1',
        description: 'Description for Product 1',
        price: 10.99,
        count: 100,
      };

      event.body = JSON.stringify(product);
      (
        ProductService.prototype.createProduct as jest.Mock
      ).mockResolvedValueOnce({
        ...product,
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });

      const response = await createProduct(event, context, callback);

      expect(ProductService.prototype.createProduct).toHaveBeenCalledTimes(1);
      expect(ProductService.prototype.createProduct).toHaveBeenCalledWith(
        product
      );
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        ...product,
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });
    });
  });

  describe('Status 400', () => {
    it('Should return validation error message', async () => {
      const data: CreateProductDto[] = [
        {
          title: '',
          description: 'Description for Product 1',
          price: 10.99,
          count: 100,
        },
        {
          title: null,
          description: 'Description for Product 1',
          price: 10.99,
          count: 100,
        },
        {
          title: true,
          description: 'Description for Product 1',
          price: 10.99,
          count: 100,
        },
        {
          title: 'Product 1',
          description: null,
          price: 10.99,
          count: 100,
        },
        {
          title: 'Product 1',
          description: true,
          price: 10.99,
          count: 100,
        },
        {
          title: 'Product 1',
          description: 'Description for Product 1',
          price: -1,
          count: 100,
        },
        {
          title: 'Product 1',
          description: 'Description for Product 1',
          price: null,
          count: 100,
        },
        {
          title: 'Product 1',
          description: 'Description for Product 1',
          price: '10',
          count: 100,
        },
        {
          title: 'Product 1',
          description: 'Description for Product 1',
          price: true,
          count: 100,
        },
        {
          title: 'Product 1',
          description: 'Description for Product 1',
          price: 10.99,
          count: -1,
        },
        {
          title: 'Product 1',
          description: 'Description for Product 1',
          price: 10.99,
          count: null,
        },
        {
          title: 'Product 1',
          description: 'Description for Product 1',
          price: 10.99,
          count: '100',
        },
        {
          title: 'Product 1',
          description: 'Description for Product 1',
          price: 10.99,
          count: true,
        },
      ] as CreateProductDto[];

      data.forEach(async (product) => {
        event.body = JSON.stringify(product);

        const response = await createProduct(event, context, callback);

        expect(ProductService.prototype.createProduct).not.toHaveBeenCalled();
        expect(response.statusCode).toBe(400);
        expect(response.body).toBe('Product is not valid');
      });
    });
  });

  describe('Status 500', () => {
    it('Should return "Internal server error" message', async () => {
      const product: CreateProductDto = {
        title: 'Product 1',
        description: 'Description for Product 1',
        price: 10.99,
        count: 100,
      };

      (
        ProductService.prototype.createProduct as jest.Mock
      ).mockRejectedValueOnce(new Error());

      event.body = JSON.stringify(product);

      const response = await createProduct(event, context, callback);

      expect(ProductService.prototype.createProduct).toHaveBeenCalledTimes(1);
      expect(ProductService.prototype.createProduct).toHaveBeenCalledWith(
        product
      );
      expect(response.statusCode).toBe(500);
      expect(response.body).toBe('Internal server error');
    });
  });
});
