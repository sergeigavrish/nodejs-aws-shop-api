import { APIGatewayAuthorizerResult, StatementEffect } from 'aws-lambda';

export function getGatewayAuthorizerResult(
  principalId: string,
  effect: StatementEffect,
  resource: string
): APIGatewayAuthorizerResult {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: effect,
          Action: ['execute-api:Invoke'],
          Resource: [resource],
        },
      ],
    },
  };
}
