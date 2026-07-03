import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { SessionItem, SessionStatus } from './types';

// Initialize the DynamoDB Document Client
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const getTableName = () => {
  const name = process.env.SESSIONS_TABLE;
  if (!name) throw new Error("SESSIONS_TABLE env variable is not set");
  return name;
};

export const createSession = async (session: SessionItem): Promise<void> => {
  const tableName = getTableName();
  
  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: session,
    })
  );
};

export const getSession = async (sessionId: string): Promise<SessionItem | null> => {
  const tableName = getTableName();

  const response = await docClient.send(
    new GetCommand({
      TableName: tableName,
      Key: { sessionId },
    })
  );

  return (response.Item as SessionItem) || null;
};

export const updateSessionStatus = async (
  sessionId: string,
  status: SessionStatus
): Promise<void> => {
  const tableName = getTableName();

  await docClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { sessionId },
      UpdateExpression: 'set #s = :status',
      ExpressionAttributeNames: {
        '#s': 'status',
      },
      ExpressionAttributeValues: {
        ':status': status,
      },
    })
  );
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  const tableName = getTableName();

  await docClient.send(
    new DeleteCommand({
      TableName: tableName,
      Key: { sessionId },
    })
  );
};
