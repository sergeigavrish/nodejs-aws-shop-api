import { Readable } from 'stream';
import csvParser from 'csv-parser';
import { Product } from '../domain';
import {
  SendMessageCommand,
  SendMessageCommandOutput,
  SQSClient,
} from '@aws-sdk/client-sqs';

export class ImportProductsFileParsesService {
  constructor(private sqsClient: SQSClient) {}

  parseFile(data: Readable): Promise<boolean> {
    return new Promise((resolve, reject) => {
      data
        .pipe(csvParser())
        .on('data', async (product: Product) => {
          data.pause();
          await this.sendMessage(product);
          data.resume();
        })
        .on('end', () => resolve(true))
        .on('error', (err) => reject(err));
    });
  }

  private async sendMessage(
    product: Product
  ): Promise<SendMessageCommandOutput | void> {
    try {
      console.log(
        'ImportProductsFileParsesService | ',
        process.env.SQS_QUEUE_URL,
        product
      );
      const command = new SendMessageCommand({
        QueueUrl: process.env.SQS_QUEUE_URL,
        MessageBody: JSON.stringify(product),
      });
      return await this.sqsClient.send(command);
    } catch (error) {
      console.error('ImportProductsFileParsesService | ', error, product);
    }
  }
}
