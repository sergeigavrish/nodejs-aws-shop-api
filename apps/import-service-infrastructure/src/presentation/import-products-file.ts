import { APIGatewayEvent, Handler } from 'aws-lambda';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

export const importProductsFile: Handler = async (event: APIGatewayEvent) => {
  try {
    console.log('importProductFile | ', event);
    console.log('importProductFile | ', process.env.IMPORT_SERVICE_S3_BUCKET_ALLOWED_ORIGINS);
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
    const key = `${
      process.env.IMPORT_SERVICE_S3_BUCKET_UPLOAD_FOLDER
    }/${randomUUID()}-${fileName}`;
    const client = new S3Client({
      region: process.env.IMPORT_SERVICE_S3_BUCKET_REGION,
    });
    const command = new PutObjectCommand({
      Bucket: process.env.IMPORT_SERVICE_S3_BUCKET_NAME,
      Key: key,
      ContentType: 'text/csv',
    });
    const signedUrl = await getSignedUrl(client, command, {
      expiresIn: parseInt(
        process.env.IMPORT_SERVICE_SIGNED_URL_EXPIRES_IN!,
        10
      ),
      signableHeaders: new Set(['content-type']),
    });
    console.log('importProductFile | ', signedUrl);
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: signedUrl,
    };
  } catch (error) {
    console.log('importProductFile | ', error);
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
