import { Product } from '../domain';

export type IDataSource = {
  get(): Promise<Product[]>;
  getById(productId: string): Promise<Product | null>;
  create(product: Product): Promise<Product>;
};
