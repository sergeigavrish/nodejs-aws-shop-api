import { SQSEvent, SQSHandler } from 'aws-lambda';
import { DynamoDBDataSource, dynamoDbClient } from '../data';
import { ProductRepository } from '../domain';
import { ProductService } from '../service/product-service';
import { createProductDtoValidator } from '../validators/create-product-dto.validator';
import { CreateProductDto } from '../dtos';
import { NotificationService } from '../service/notification-service';
import { snsClient } from '../data/cleints/sns-client';

const dataSource = new DynamoDBDataSource(dynamoDbClient);
const productRepository = new ProductRepository(dataSource);
const notificationService = new NotificationService(snsClient);
const productService = new ProductService(
  productRepository,
  notificationService
);
export const catalogBatchProcess: SQSHandler = async (event: SQSEvent) => {
  try {
    console.log('catalogBatchProcess | ', event);
    for (const record of event.Records) {
      try {
        const productDto: Record<keyof CreateProductDto, string | number> =
          JSON.parse(record.body);
        if (typeof productDto?.price === 'string') {
          productDto.price = parseFloat(productDto.price);
        }
        if (typeof productDto?.count === 'string') {
          productDto.count = parseFloat(productDto.count);
        }
        if (!createProductDtoValidator(productDto)) {
          console.log('createProduct | Product is not valid | ', productDto);
          continue;
        }
        const createdProduct = await productService.createProduct(productDto);
        console.log('createProduct | Product was created | ', createdProduct);
      } catch {
        console.error('createProduct | Failed to process Record | ', record);
      }
    }
  } catch (error) {
    console.error('catalogBatchProcess | ', error);
  }
};
