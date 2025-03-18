import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

export const dynamoDb = new DynamoDB();
export const dynamoDbClient = DynamoDBDocument.from(dynamoDb);
