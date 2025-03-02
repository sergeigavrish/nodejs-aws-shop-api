import { BatchGetCommandInput, DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
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
    const request: BatchGetCommandInput = {
      RequestItems: {
        [PRODUCT_TABLE_NAME]: { Keys: [{ id: productId }] },
        [STOCK_TABLE_NAME]: { Keys: [{ product_id: productId }] },
      },
    };
    const result = await this.dynamoDb.batchGet(request);
    if (!result.Responses || !result.Responses[PRODUCT_TABLE_NAME]?.length) {
      return null;
    }
    const productItems = result.Responses[PRODUCT_TABLE_NAME] || [];
    const stockItems = result.Responses[STOCK_TABLE_NAME] || [];
    const product = productItems[0] as ProductEntity;
    const stock = stockItems[0] as StockEntity;
    return {
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      count: stock?.count ?? 0,
    };
  }

  async create(product: Product): Promise<Product> {
    await this.dynamoDb.batchWrite({
      RequestItems: {
        [PRODUCT_TABLE_NAME]: [
          {
            PutRequest: {
              Item: {
                id: product.id,
                title: product.title,
                description: product.description,
                price: product.price,
              },
            },
          },
        ],
        [STOCK_TABLE_NAME]: [
          {
            PutRequest: {
              Item: {
                product_id: product.id,
                count: product.count,
              },
            },
          },
        ],
      },
    });
    return product;
  }
}
