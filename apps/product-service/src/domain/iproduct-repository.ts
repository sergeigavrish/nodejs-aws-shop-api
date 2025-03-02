import { Product } from './models/product';

export type IProductRepository = {
  getProducts(): Promise<Product[]>;
  getProductById(productId: string): Promise<Product | null>;
  createProduct(product: Product): Promise<Product>;
};
