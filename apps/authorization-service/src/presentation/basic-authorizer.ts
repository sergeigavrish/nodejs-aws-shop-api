import {
  APIGatewayAuthorizerResult,
  APIGatewayTokenAuthorizerEvent,
  APIGatewayTokenAuthorizerHandler,
} from 'aws-lambda';
import { getGatewayAuthorizerResult } from '../utils/get-gateway-authorizer-result';

export const basicAuthorizer: APIGatewayTokenAuthorizerHandler = async (
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  try {
    console.log('basicAuthorizer | ', event);
    const [authType, base64Credentials] = event.authorizationToken.split(' ');
    if (authType !== 'Basic' || !base64Credentials) {
      throw new Error('Unauthorized: Invalid Authorization header');
    }
    const credentials = Buffer.from(base64Credentials, 'base64').toString(
      'utf-8'
    );
    const [username, password] = credentials.split(':');
    if (!process.env[username] || password !== process.env[username]) {
      return getGatewayAuthorizerResult(username, 'Deny', event.methodArn);
    }
    return getGatewayAuthorizerResult(username, 'Allow', event.methodArn);
  } catch (error) {
    console.error('basicAuthorizer | ', error);
    throw new Error(error?.message);
  }
};
