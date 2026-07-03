import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { getTeacherId } from '../../../shared/permissions';
import { Responses } from '../../../shared/response';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handleCloseSession = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  const teacherId = getTeacherId(event);
  const sessionId = event.pathParameters?.sessionId;

  if (!sessionId) {
    return Responses.badRequest('Missing sessionId');
  }

  try {
    await docClient.send(new UpdateCommand({
      TableName: process.env.SESSIONS_TABLE,
      Key: { sessionId },
      UpdateExpression: 'SET #status = :status',
      ConditionExpression: 'teacherId = :teacherId',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'CLOSED',
        ':teacherId': teacherId,
      },
    }));

    return Responses.success({ message: 'Session closed successfully' });
  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      return Responses.forbidden('You do not own this session or session does not exist');
    }
    throw error;
  }
};
