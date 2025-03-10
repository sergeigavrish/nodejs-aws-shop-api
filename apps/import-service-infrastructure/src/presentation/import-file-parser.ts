import { S3Event, S3EventRecord } from 'aws-lambda';
import { S3Client } from '@aws-sdk/client-s3';
import { ImportProductsObjectService } from '../application/import-products-object-service';
import { ImportProductsFileParsesService } from '../application/import-products-file-parses-service';

const s3Client = new S3Client({
  region: process.env.IMPORT_SERVICE_S3_BUCKET_REGION,
});
const importProductsObjectService = new ImportProductsObjectService(s3Client);
const importProductsFileParsesService = new ImportProductsFileParsesService();

export const importFileParser = async (event: S3Event): Promise<void> => {
  try {
    console.log('importFileParser | ', event);
    for (const record of event.Records) {
      await handleRecord(record);
    }
  } catch (err) {
    console.error('importFileParser | ', err);
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
    const products = await importProductsFileParsesService
      .parseFile(readableObject)
      .catch((err) => {
        console.error('ImportProductsFileParsesService | ', err);
        return null;
      });
    if (!products) {
      console.error(
        'importFileParser | Failed to parse object for record | ',
        record
      );
      return;
    }
    console.log('importFileParser | Parsed products ', products);
    const filePath = key.split('/');
    const putFileName = filePath[filePath.length - 1];
    const putResult = await importProductsObjectService.putReadableObject(
      bucket,
      putFileName,
      process.env.IMPORT_SERVICE_S3_BUCKET_REGION!,
      readableObject
    );
    if (!putResult) {
      console.error(
        'importFileParser | Failed to copy parsed object | ',
        record
      );
      return;
    }
    const deleteResult = await importProductsObjectService.deleteReadableObject(
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
    console.error('importFileParser | Failed to handle Record | ', record);
  }
}
