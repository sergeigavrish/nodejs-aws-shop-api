import { APIGatewayEvent, Handler } from 'aws-lambda';
import { S3Client } from '@aws-sdk/client-s3';
import { ImportProductsService } from '../application/import-products-service';

const client = new S3Client({
  region: process.env.IMPORT_SERVICE_S3_BUCKET_REGION,
});
const importProductService = new ImportProductsService(client);

export const importProductsFile: Handler = async (event: APIGatewayEvent) => {
  try {
    console.log('importProductFile | ', event);
    const fileName: string | undefined = event.queryStringParameters?.name;
    if (!fileName) {
      console.log('importProductFile | Status 400');
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: 'File name is required',
      };
    }
    const signedUrl = await importProductService.getSignedUrl(fileName);
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: signedUrl,
    };
  } catch (error) {
    console.error('importProductFile | ', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: 'Internal server error',
    };
  }
};
