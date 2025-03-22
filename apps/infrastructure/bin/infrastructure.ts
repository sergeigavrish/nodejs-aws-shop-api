#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { AuthorizationServiceStack } from '../lib/authorization-service-stack';

const app = new App();
new AuthorizationServiceStack(app, 'AuthorizationServiceStack');
