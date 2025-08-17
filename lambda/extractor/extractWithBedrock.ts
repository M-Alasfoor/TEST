import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { Handler } from 'aws-lambda';

const client = new BedrockRuntimeClient({ region: process.env.REGION });

interface Event { id: string; fileKey: string; }
interface Result extends Event { fields: Record<string, any>; }

export const handler: Handler<Event, Result> = async (event) => {
  // For demo, we mock Bedrock response. In production, send PDF text to model and parse.
  const fields = {
    fileName: event.fileKey.split('/').pop(),
    status: 'extracted'
  };
  return { ...event, fields };
};
