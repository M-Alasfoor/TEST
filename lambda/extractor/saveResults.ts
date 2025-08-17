import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { Handler } from 'aws-lambda';

const tableName = process.env.TABLE_NAME!;
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

interface Event { id: string; fileKey?: string; fields?: Record<string, any>; status?: string; error?: string; }

export const handler: Handler<Event, Event> = async (event) => {
  await ddb.send(new UpdateCommand({
    TableName: tableName,
    Key: { id: event.id },
    UpdateExpression: 'set fields = if_not_exists(fields, :f), #s = :s, error = :e, updatedAt = :u',
    ExpressionAttributeNames: { '#s': 'status' },
    ExpressionAttributeValues: {
      ':f': event.fields || {},
      ':s': event.status || 'extracted',
      ':e': event.error || null,
      ':u': new Date().toISOString()
    }
  }));
  return event;
};
