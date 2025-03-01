import { DynamoDB, Put } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { ProductEntity } from '../data/entities/product';
import { StockEntity } from '../data/entities/stock';
// import {dotenv} from ('dotenv');

if (process.env.NODE_ENV !== 'local') {
  // dotenv.config();
}

const PRODUCT_TABLE_NAME = 'products' as const;
const STOCK_TABLE_NAME = 'stocks' as const;
const REGION = 'eu-west-1' as const;
const dynamoDb = new DynamoDB({
  region: REGION,
});

const products: Omit<ProductEntity, 'id'>[] = [
  {
    title: 'Ковер из шерсти по мотивам чувашских орнаментов',
    description:
      'Ковер из шерсти по мотивам чувашских орнаментов из коллекции Cultural Heritage позволит окунуться в мир традиций и станет ярким акцентом интерьера, притягивающим восхищенные взгляды. Каждая нить этого текстильного изделия хранит тайны старинных техник ручного ткачества, а колоритные узоры раскрывают богатство культурного наследия.',
    price: 250,
  },
  {
    title: 'Ковер из хлопка по мотивам эвенских орнаментов',
    description:
      'Ковер из хлопка по мотивам эвенских орнаментов из коллекции Cultural Heritage позволит окунуться в мир традиций и станет ярким акцентом интерьера, притягивающим восхищенные взгляды. Каждая нить этого текстильного изделия хранит тайны старинных техник ручного ткачества, а колоритные узоры раскрывают богатство культурного наследия.',
    price: 125,
  },
  {
    title: 'Ковер из шерсти по мотивам башкирских орнаментов',
    description:
      'Ковер из шерсти по мотивам чувашских орнаментов из коллекции Cultural Heritage позволит окунуться в мир традиций и станет ярким акцентом интерьера, притягивающим восхищенные взгляды. Каждая нить этого текстильного изделия хранит тайны старинных техник ручного ткачества, а колоритные узоры раскрывают богатство культурного наследия.',
    price: 165,
  },
  {
    title: 'Ковер из хлопка по мотивам нанайских орнаментов',
    description:
      'Ковер из хлопка по мотивам нанайских орнаментов из коллекции Cultural Heritage позволит окунуться в мир традиций и станет ярким акцентом интерьера, притягивающим восхищенные взгляды. Каждая нить этого текстильного изделия хранит тайны старинных техник ручного ткачества, а колоритные узоры раскрывают богатство культурного наследия.',
    price: 134,
  },
];

export async function seed() {
  const putItems: Put[] = products.reduce((acc: Put[], product) => {
    const id = uuidv4();
    const productPut: Put = {
      TableName: PRODUCT_TABLE_NAME,
      Item: {
        id: { S: id },
        title: { S: product.title },
        description: { S: product.description },
        price: { N: product.price.toString() },
      },
    };
    const stock: StockEntity = {
      product_id: id,
      count: Math.floor(Math.random() * 6) + 1,
    };
    const stockPut: Put = {
      TableName: STOCK_TABLE_NAME,
      Item: {
        product_id: { S: stock.product_id },
        count: { N: stock.count.toString() },
      },
    };
    acc.push(productPut);
    acc.push(stockPut);
    return acc;
  }, []);

  return dynamoDb.transactWriteItems({
    TransactItems: putItems.map((item) => ({ Put: item })),
  });
}

seed()
  .then((result) => {
    console.log('Seed operation result:', JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error in seed operation:', error);
    process.exit(1);
  });
