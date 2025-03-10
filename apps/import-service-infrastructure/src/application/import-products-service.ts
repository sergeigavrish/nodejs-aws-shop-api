import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

export class ImportProductsService {
  constructor(private client: S3Client) {}

  async getSignedUrl(fileName: string): Promise<string> {
    const key = `${
      process.env.IMPORT_SERVICE_S3_BUCKET_UPLOAD_FOLDER
    }/${randomUUID()}-${fileName}`;
    const command = new PutObjectCommand({
      Bucket: process.env.IMPORT_SERVICE_S3_BUCKET_NAME,
      Key: key,
      ContentType: 'text/csv',
    });
    return await getSignedUrl(this.client, command, {
      expiresIn: parseInt(
        process.env.IMPORT_SERVICE_SIGNED_URL_EXPIRES_IN!,
        10
      ),
      signableHeaders: new Set(['content-type']),
    });
  }
}
