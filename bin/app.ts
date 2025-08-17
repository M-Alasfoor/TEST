import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { EconxStack } from '../lib/econx-stack.js';

const app = new App();
new EconxStack(app, 'EconxStack', {});
