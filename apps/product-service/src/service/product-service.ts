import { IProductRepository } from '../domain';
import { CreateProductDto, ProductDto } from '../dtos';
import { v4 as uuid } from 'uuid';
import { NotificationService } from './notification-service';

export class ProductService {
  constructor(
    private productRepository: IProductRepository,
    private notificationService?: NotificationService
  ) {}

  async getProducts(): Promise<ProductDto[]> {
    return this.productRepository.getProducts();
  }

  async getProductById(productId: string): Promise<ProductDto | null> {
    return this.productRepository.getProductById(productId);
  }

  async createProduct(productDto: CreateProductDto): Promise<ProductDto> {
    const productId = uuid();
    const product = await this.productRepository.createProduct({
      ...productDto,
      id: productId,
    });
    await this.notificationService?.notify(
      `Product ${product.title} was created`,
      {
        count: {
          DataType: 'Number',
          StringValue: product.count.toString(),
        },
      }
    );
    return product;
  }
}
