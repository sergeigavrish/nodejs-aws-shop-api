import { S3Event, S3EventRecord } from 'aws-lambda';
import {
  S3Client,
  GetObjectCommand,
  GetObjectCommandOutput,
} from '@aws-sdk/client-s3';
import * as csvParser from 'csv-parser';
import { Readable } from 'stream';

export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  count: number;
};

const s3Client = new S3Client({
  region: process.env.IMPORT_SERVICE_S3_BUCKET_REGION,
});

export const importFileParser = async (event: S3Event): Promise<void> => {
  try {
    console.log('importFileParser | ', event);
    const objectRequests = event.Records.map((record) =>
      getObjectCommandOutput(record)
    );
    const getObjectResults = await Promise.allSettled(objectRequests);
    const objects = getObjectResults
      .filter((object) => object.status === 'fulfilled')
      .map((object) => object.value);
    const readables = objects.map(getReadable);
    await Promise.allSettled(readables.map(parseFile));
  } catch (err) {
    console.error('importFileParser | ', err);
  }
};

function mapS3EventRecordToGetObjectCommand(
  event: S3EventRecord
): GetObjectCommand {
  const bucket = event.s3.bucket.name;
  const key = decodeURIComponent(event.s3.object.key.replace(/\+/g, ' '));
  return new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
}

async function getObjectCommandOutput(
  event: S3EventRecord
): Promise<GetObjectCommandOutput> {
  const getObjectCommand = mapS3EventRecordToGetObjectCommand(event);
  return s3Client
    .send(getObjectCommand)
    .then((output) => {
      if (!output.Body) {
        throw new Error('Failed to get object');
      }
      return output;
    })
    .catch((err) => {
      console.error('importFileParser | ', err);
      throw err;
    });
}

function getReadable(output: GetObjectCommandOutput): Readable {
  return output.Body as Readable;
}

async function parseFile(data: Readable): Promise<Product[]> {
  return new Promise((resolve, reject) => {
    const products: Product[] = [];
    data
      .pipe(csvParser())
      .on('data', (row) => {
        products.push(row);
      })
      .on('end', () => {
        console.log('importFileParser | ', products);
        resolve(products);
      })
      .on('error', (err) => {
        console.error('importFileParser | ', err);
        reject(err);
      });
  });
}
