import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-step-functions';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

const tableName = process.env.TABLE_NAME!;
const bucket = process.env.BUCKET_NAME!;
const stateMachineArn = process.env.STATE_MACHINE_ARN!;
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const sfn = new SFNClient({});

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const body = JSON.parse(event.body || '{}');
  const { uploadId, key, fileName } = body;
  const now = new Date().toISOString();
  const item = { id: uploadId, fileName, fileKey: key, status: 'extracting', createdAt: now, updatedAt: now };
  await ddb.send(new PutCommand({ TableName: tableName, Item: item }));
  await sfn.send(new StartExecutionCommand({ stateMachineArn, input: JSON.stringify({ id: uploadId, fileKey: key, bucket }) }));
  return { statusCode: 200, body: JSON.stringify({ status: 'extracting' }) };
};
