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
      return getGatewayAuthorizerResult(
        'unauthorized',
        'Deny',
        event.methodArn
      );
    }
    const credentials = Buffer.from(base64Credentials, 'base64').toString(
      'utf-8'
    );
    const [username, password] = credentials.split(':');
    if (
      username !== process.env.USERNAME ||
      password !== process.env.PASSWORD
    ) {
      return getGatewayAuthorizerResult(
        'unauthorized',
        'Deny',
        event.methodArn
      );
    }
    return getGatewayAuthorizerResult(username, 'Allow', event.methodArn);
  } catch (error) {
    console.error('basicAuthorizer | Status 500 | ', error);
    return getGatewayAuthorizerResult('unauthorized', 'Deny', event.methodArn);
  }
};
