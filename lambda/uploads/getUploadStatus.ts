import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

const tableName = process.env.TABLE_NAME!;
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const id = event.pathParameters?.id!;
  const res = await ddb.send(new GetCommand({ TableName: tableName, Key: { id } }));
  if (!res.Item) return { statusCode: 404, body: JSON.stringify({ message: 'Not found' }) };
  const { status, fileKey, error } = res.Item as any;
  return { statusCode: 200, body: JSON.stringify({ status, fileKey, error }) };
};
