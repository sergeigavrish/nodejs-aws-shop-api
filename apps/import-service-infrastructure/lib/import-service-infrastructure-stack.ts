import { Stack, StackProps, RemovalPolicy, Fn } from 'aws-cdk-lib';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import {
  BlockPublicAccess,
  Bucket,
  EventType,
  HttpMethods,
} from 'aws-cdk-lib/aws-s3';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';

import { config } from 'dotenv';

config();

export class ImportServiceInfrastructureStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const cloudFront = Fn.importValue(
      process.env.IMPORT_SERVICE_EXPORTED_DISTRIBUTION_DOMAIN_NAME!
    );

    const allowedOrigins: string[] = [`https://${cloudFront}`];

    if (process.env.IMPORT_SERVICE_ALLOWED_ORIGIN) {
      allowedOrigins.push(process.env.IMPORT_SERVICE_ALLOWED_ORIGIN);
    }

    const bucket = new Bucket(this, 'ImportServiceS3Bucket', {
      bucketName: process.env.IMPORT_SERVICE_S3_BUCKET_NAME,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedMethods: [HttpMethods.PUT],
          allowedOrigins: allowedOrigins,
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
    });

    const environment = {
      IMPORT_SERVICE_S3_BUCKET_NAME: bucket.bucketName,
      IMPORT_SERVICE_S3_BUCKET_UPLOAD_FOLDER:
        process.env.IMPORT_SERVICE_S3_BUCKET_UPLOAD_FOLDER!,
      IMPORT_SERVICE_SIGNED_URL_EXPIRES_IN:
        process.env.IMPORT_SERVICE_SIGNED_URL_EXPIRES_IN!,
      IMPORT_SERVICE_S3_BUCKET_REGION:
        process.env.IMPORT_SERVICE_S3_BUCKET_REGION!,
      IMPORT_SERVICE_S3_BUCKET_ALLOWED_ORIGINS: allowedOrigins.join(','),
      IMPORT_SERVICE_S3_BUCKET_COPY_FOLDER:
        process.env.IMPORT_SERVICE_S3_BUCKET_COPY_FOLDER!,
    };

    const importProductsFileFunction = new NodejsFunction(
      this,
      'ImportServiceImportProductsFile',
      {
        entry: 'src/presentation/import-products-file.ts',
        handler: 'importProductsFile',
        runtime: Runtime.NODEJS_22_X,
        environment,
      }
    );

    const importFileParserFunction = new NodejsFunction(
      this,
      'ImportServiceImportFileParser',
      {
        entry: 'src/presentation/import-file-parser.ts',
        handler: 'importFileParser',
        runtime: Runtime.NODEJS_22_X,
        environment,
      }
    );

    bucket.grantPut(importProductsFileFunction);
    bucket.grantRead(importFileParserFunction);
    bucket.addEventNotification(
      EventType.OBJECT_CREATED,
      new LambdaDestination(importFileParserFunction),
      { prefix: process.env.IMPORT_SERVICE_S3_BUCKET_UPLOAD_FOLDER! }
    );

    const importServiceRestApi = new RestApi(this, 'ImportServiceRestApi', {
      deployOptions: {
        stageName: 'dev',
      },
      restApiName: 'Import Service Rest Api',
    });

    const importResource = importServiceRestApi.root.addResource('import');
    importResource.addMethod(
      'GET',
      new LambdaIntegration(importProductsFileFunction)
    );
  }
}
