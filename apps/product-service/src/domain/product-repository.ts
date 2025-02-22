import { products } from '../data/mock-data';
import { Product } from '../models/product';
import { IProductRepository } from './iproduct-repository';

export class ProductRepository implements IProductRepository {
  async getProducts(): Promise<Product[]> {
    return products;
  }

  async getProductById(productId: string): Promise<Product | null> {
    return products.find((product) => product.id === productId) ?? null;
  }
}
