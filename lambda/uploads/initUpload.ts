import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { v4 as uuid } from 'uuid';

const bucket = process.env.BUCKET_NAME!;
const s3 = new S3Client({});

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const sub = event.requestContext.authorizer?.jwt.claims.sub as string;
  const id = uuid();
  const key = `uploads/${sub}/${id}.pdf`;
  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: 'application/pdf' });
  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
  return { statusCode: 200, body: JSON.stringify({ uploadId: id, url, method: 'PUT', key }) };
};
