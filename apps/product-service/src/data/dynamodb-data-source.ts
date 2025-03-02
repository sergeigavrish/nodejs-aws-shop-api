import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { IDataSource } from './idata-source';
import { ProductEntity } from './entities/product';
import { StockEntity } from './entities/stock';
import { Product } from '../domain/models/product';

const PRODUCT_TABLE_NAME: string = process.env.PRODUCT_TABLE_NAME!;
const STOCK_TABLE_NAME: string = process.env.STOCK_TABLE_NAME!;

export class DynamoDBDataSource implements IDataSource {
  constructor(private dynamoDb: DynamoDBDocument) {}
  async get(): Promise<Product[]> {
    const productsResult = await this.dynamoDb.scan({
      TableName: PRODUCT_TABLE_NAME,
    });

    if (!productsResult.Items || !productsResult.Items.length) {
      return [];
    }

    const stockResult = await this.dynamoDb.scan({
      TableName: STOCK_TABLE_NAME,
      ScanFilter: {
        product_id: {
          AttributeValueList: productsResult.Items.map((product) => product.id),
          ComparisonOperator: 'IN',
        },
      },
    });

    const stockMap: Record<string, number> = {};
    stockResult.Items?.forEach(
      (stock) => (stockMap[stock.product_id] = stock.count)
    );

    return productsResult.Items.map(
      (product): Product => ({
        id: product.id,
        title: product.title,
        description: product.description,
        price: product.price,
        count: stockMap[product.id] || 0,
      })
    );
  }

  async getById(productId: string): Promise<Product | null> {
    const result = await this.dynamoDb.transactGet({
      TransactItems: [
        { Get: { TableName: PRODUCT_TABLE_NAME, Key: { id: productId } } },
        {
          Get: { TableName: STOCK_TABLE_NAME, Key: { product_id: productId } },
        },
      ],
    });
    if (!result.Responses || !result.Responses.length) {
      return null;
    }
    const product = result.Responses[0].Item as ProductEntity;
    const stock = result.Responses[1].Item as StockEntity;
    return {
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      count: stock.count,
    };
  }

  async create(product: Product): Promise<Product> {
    await this.dynamoDb.transactWrite({
      TransactItems: [
        {
          Put: {
            TableName: PRODUCT_TABLE_NAME,
            Item: {
              id: product.id,
              title: product.title,
              description: product.description,
              price: product.price,
            },
          },
        },
        {
          Put: {
            TableName: STOCK_TABLE_NAME,
            Item: {
              product_id: product.id,
              count: product.count,
            },
          },
        },
      ],
    });
    return product;
  }
}
