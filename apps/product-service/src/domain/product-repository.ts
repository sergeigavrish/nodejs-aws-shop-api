import { Product } from './models/product';
import { IProductRepository } from './iproduct-repository';
import { IDataSource } from '../data/idata-source';

export class ProductRepository implements IProductRepository {
  constructor(private dataSource: IDataSource) {}

  async getProducts(): Promise<Product[]> {
    return this.dataSource.get();
  }

  async getProductById(productId: string): Promise<Product | null> {
    return this.dataSource.getById(productId);
  }

  async createProduct(product: Product): Promise<Product> {
    return this.dataSource.create(product);
  }
}
