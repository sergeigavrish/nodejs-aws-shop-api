import { Readable } from 'stream';
import * as csvParser from 'csv-parser';
import { Product } from '../domain';

export class ImportProductsFileParsesService {
  parseFile(data: Readable): Promise<Product[]> {
    return new Promise((resolve, reject) => {
      const products: Product[] = [];
      data
        .pipe(csvParser())
        .on('data', (row) => products.push(row))
        .on('end', () => resolve(products))
        .on('error', (err) => reject(err));
    });
  }
}
