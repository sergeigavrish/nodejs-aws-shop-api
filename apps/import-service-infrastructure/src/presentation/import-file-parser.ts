import { S3Event, S3EventRecord } from 'aws-lambda';
import { S3Client } from '@aws-sdk/client-s3';
import { ImportProductsObjectService } from '../application/import-products-object-service';
import { ImportProductsFileParsesService } from '../application/import-products-file-parses-service';
import { SQSClient } from '@aws-sdk/client-sqs';

const s3Client = new S3Client({
  region: process.env.IMPORT_SERVICE_S3_BUCKET_REGION,
});
const sqsClient = new SQSClient({
  region: process.env.IMPORT_SERVICE_S3_BUCKET_REGION,
});
const importProductsObjectService = new ImportProductsObjectService(s3Client);
const importProductsFileParsesService = new ImportProductsFileParsesService(
  sqsClient
);

export const importFileParser = async (event: S3Event): Promise<void> => {
  try {
    console.log('importFileParser | ', event);
    for (const record of event.Records) {
      await handleRecord(record);
    }
  } catch (err) {
    console.error('importFileParser | Something went wrong', err);
  }
};

async function handleRecord(record: S3EventRecord): Promise<void> {
  try {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    const readableObject = await importProductsObjectService.getReadableObject(
      bucket,
      key
    );
    if (!readableObject) {
      console.error(
        'importFileParser | Failed to get object for record ',
        record
      );
      return;
    }
    const parseResult = await importProductsFileParsesService
      .parseFile(readableObject)
      .catch((err) => {
        console.error('ImportProductsFileParsesService | ', err);
        return false;
      });
    if (!parseResult) {
      console.error(
        'importFileParser | Failed to parse object for record | ',
        record
      );
      return;
    }
    const putResult = await importProductsObjectService.copyObject(
      bucket,
      key,
      process.env.IMPORT_SERVICE_S3_BUCKET_UPLOAD_FOLDER!,
      process.env.IMPORT_SERVICE_S3_BUCKET_COPY_FOLDER!
    );
    if (!putResult) {
      console.error(
        'importFileParser | Failed to copy parsed object | ',
        record
      );
      return;
    }
    const deleteResult = await importProductsObjectService.deleteObject(
      bucket,
      key
    );
    if (!deleteResult) {
      console.error(
        'importFileParser | Failed to delete copied object | ',
        record
      );
      return;
    }
  } catch (error) {
    console.error(
      'importFileParser | Failed to handle Record | ',
      error,
      record
    );
  }
}
