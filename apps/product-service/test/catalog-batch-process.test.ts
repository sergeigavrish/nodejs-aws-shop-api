import { SQSEvent } from 'aws-lambda';
import { catalogBatchProcess } from '../src/presentation/catalog-batch-process';
import { ProductService } from '../src/service/product-service';
import { createProductDtoValidator } from '../src/validators/create-product-dto.validator';

jest.mock('../src/service/product-service');
jest.mock('../src/validators/create-product-dto.validator', () => ({
  createProductDtoValidator: jest.fn(),
}));

function createMockSQSRecord(body: string): SQSEvent['Records'][0] {
  return {
    body,
  } as SQSEvent['Records'][0];
}

describe('catalogBatchProcess', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('Successful product creation', () => {
    it('Should create product from valid SQS record', async () => {
      const validProduct = {
        title: 'Test Product',
        description: 'Test Description',
        price: '10.99',
        count: '100',
      };

      const mappedProduct = {
        ...validProduct,
        price: 10.99,
        count: 100,
      };

      const sqsEvent: SQSEvent = {
        Records: [createMockSQSRecord(JSON.stringify(validProduct))],
      };

      jest.mocked(createProductDtoValidator).mockReturnValue(true);

      (
        ProductService.prototype.createProduct as jest.Mock
      ).mockResolvedValueOnce({
        ...mappedProduct,
        id: 'test-id',
      });

      await catalogBatchProcess(sqsEvent, {} as any, {} as any);

      expect(createProductDtoValidator).toHaveBeenCalledWith(mappedProduct);
      expect(ProductService.prototype.createProduct).toHaveBeenCalledWith(
        mappedProduct
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'createProduct | Product was created | ',
        expect.objectContaining(mappedProduct)
      );
    });
  });

  describe('Invalid product data', () => {
    it('Should skip invalid product data', async () => {
      const invalidProduct = {
        title: '',
        description: 'Test Description',
        price: '-1',
        count: '100',
      };

      const mappedProduct = {
        ...invalidProduct,
        price: -1,
        count: 100,
      };

      const sqsEvent: SQSEvent = {
        Records: [createMockSQSRecord(JSON.stringify(invalidProduct))],
      };

      jest.mocked(createProductDtoValidator).mockReturnValue(false);

      await catalogBatchProcess(sqsEvent, {} as any, {} as any);

      expect(createProductDtoValidator).toHaveBeenCalledWith(mappedProduct);
      expect(ProductService.prototype.createProduct).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'createProduct | Product is not valid | ',
        mappedProduct
      );
    });

    it('Should handle unparseable JSON', async () => {
      const sqsEvent: SQSEvent = {
        Records: [createMockSQSRecord('invalid json')],
      };

      await catalogBatchProcess(sqsEvent, {} as any, {} as any);

      expect(createProductDtoValidator).not.toHaveBeenCalled();
      expect(ProductService.prototype.createProduct).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'createProduct | Failed to process Record | ',
        expect.objectContaining({ body: 'invalid json' })
      );
    });
  });

  describe('Error handling', () => {
    it('Should handle errors during product creation', async () => {
      const validProduct = {
        title: 'Test Product',
        description: 'Test Description',
        price: '10.99',
        count: '100',
      };

      const sqsEvent: SQSEvent = {
        Records: [createMockSQSRecord(JSON.stringify(validProduct))],
      };

      jest.mocked(createProductDtoValidator).mockReturnValue(true);

      (
        ProductService.prototype.createProduct as jest.Mock
      ).mockRejectedValueOnce(new Error('Test error'));

      await expect(
        catalogBatchProcess(sqsEvent, {} as any, {} as any)
      ).resolves.not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'createProduct | Failed to process Record | ',
        expect.objectContaining({
          body: JSON.stringify(validProduct),
        })
      );
    });
  });
});
