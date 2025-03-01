import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ProductServiceStack } from '../lib/product-service-stack';

describe('ProductServiceStack', () => {
  let template: Template;

  beforeEach(() => {
    const app = new App();
    const stack = new ProductServiceStack(app, 'ProductServiceTestStack');
    template = Template.fromStack(stack);
  });

  test('Should create two Lambda functions', () => {
    template.resourceCountIs('AWS::Lambda::Function', 2);
  });

  test('Should create API Gateway REST API', () => {
    template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
  });

  test('Should create API Gateway resources', () => {
    template.resourceCountIs('AWS::ApiGateway::Resource', 2);
  });

  test('Should create API Gateway methods', () => {
    template.resourceCountIs('AWS::ApiGateway::Method', 5);
  });

  test('API Gateway should have deployment and stage', () => {
    template.resourceCountIs('AWS::ApiGateway::Deployment', 1);
    template.resourceCountIs('AWS::ApiGateway::Stage', 1);
  });

  test('Should have correct resource path for product by ID', () => {
    template.hasResourceProperties('AWS::ApiGateway::Resource', {
      PathPart: '{productId}',
    });
  });

  test('Should have correct resource path for products list', () => {
    template.hasResourceProperties('AWS::ApiGateway::Resource', {
      PathPart: 'products',
    });
  });
});
