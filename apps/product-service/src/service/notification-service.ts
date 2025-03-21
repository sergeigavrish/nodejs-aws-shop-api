import {
  MessageAttributeValue,
  PublishCommand,
  PublishCommandOutput,
  SNSClient,
} from '@aws-sdk/client-sns';

const CREATE_PRODUCT_TOPIC_ARN = process.env.CREATE_PRODUCT_TOPIC_ARN;

export class NotificationService {
  constructor(private snsClient: SNSClient) {}

  async notify(
    message: string,
    filter?: Record<string, MessageAttributeValue>
  ): Promise<PublishCommandOutput> {
    const command = new PublishCommand({
      TopicArn: CREATE_PRODUCT_TOPIC_ARN,
      Message: message,
      MessageAttributes: filter,
    });
    return await this.snsClient.send(command);
  }
}
