import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

import { config } from 'dotenv';

config();

export class AuthorizationServiceStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const basicAuthorizer = new NodejsFunction(this, 'BasicAuthorizer', {
      entry: '../authorization-service/src/presentation/basic-authorizer.ts',
      handler: 'basicAuthorizer',
      runtime: Runtime.NODEJS_22_X,
      environment: {
        [process.env.USERNAME!]: process.env.PASSWORD!,
      },
    });

    new CfnOutput(this, 'BasicAuthorizerArn', {
      value: basicAuthorizer.functionArn,
      description: 'BasicAuthorizer Lambda ARN',
      exportName: 'AuthorizationServiceBasicAuthorizerArn',
    });
  }
}
