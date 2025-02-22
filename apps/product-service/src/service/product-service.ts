import { IProductRepository } from '../domain';
import { Product } from '../models/product';

export class ProductService {
  constructor(private productRepository: IProductRepository) {}

  async getProducts(): Promise<Product[]> {
    return this.productRepository.getProducts();
  }

  async getProductById(productId: string): Promise<Product | null> {
    return this.productRepository.getProductById(productId);
  }
}
