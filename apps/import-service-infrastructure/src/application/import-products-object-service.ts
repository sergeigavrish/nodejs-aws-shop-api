import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';

export class ImportProductsObjectService {
  constructor(private client: S3Client) {}

  async getReadableObject(
    bucket: string,
    key: string
  ): Promise<Readable | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });
      const result = await this.client.send(command);
      if (!result.Body) {
        return null;
      }
      return result.Body as Readable;
    } catch (error) {
      console.error('ImportProductsObjectService | ', error);
      return null;
    }
  }

  async putReadableObject(
    bucket: string,
    key: string,
    destination: string,
    data: Readable
  ): Promise<boolean> {
    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: `${destination}/${key}`,
        Body: data,
      });
      await this.client.send(command);
      return true;
    } catch (error) {
      console.error('ImportProductsObjectService | ', error);
      return false;
    }
  }

  async deleteReadableObject(bucket: string, key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      });
      await this.client.send(command);
      return true;
    } catch (error) {
      console.error('ImportProductsObjectService | ', error);
      return false;
    }
  }
}
