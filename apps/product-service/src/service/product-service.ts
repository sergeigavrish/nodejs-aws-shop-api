import { IProductRepository } from '../domain';
import { CreateProductDto, ProductDto } from '../dtos';
import { v4 as uuid } from 'uuid';

export class ProductService {
  constructor(private productRepository: IProductRepository) {}

  async getProducts(): Promise<ProductDto[]> {
    return this.productRepository.getProducts();
  }

  async getProductById(productId: string): Promise<ProductDto | null> {
    return this.productRepository.getProductById(productId);
  }

  async createProduct(product: CreateProductDto): Promise<ProductDto> {
    const productId = uuid();
    return this.productRepository.createProduct({
      ...product,
      id: productId,
    });
  }
}
