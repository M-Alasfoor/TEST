import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyResultV2 } from 'aws-lambda';

const tableName = process.env.TABLE_NAME!;
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (): Promise<APIGatewayProxyResultV2> => {
  const res = await ddb.send(new ScanCommand({ TableName: tableName }));
  const items = res.Items || [];
  return { statusCode: 200, body: JSON.stringify(items) };
};
