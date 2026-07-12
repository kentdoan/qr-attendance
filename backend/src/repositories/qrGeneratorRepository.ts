import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { QrTokenItem, SessionItem } from '../shared/models';

// Initialize Clients
const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);
const secretsClient = new SecretsManagerClient({});

// In-memory cache for the secret key (Cold Start optimization)
let cachedSecret: string | null = null;

const getEnvVars = () => {
  const sessionsTable = process.env.SESSIONS_TABLE;
  const qrTokensTable = process.env.QR_TOKENS_TABLE;
  const secretArn = process.env.HMAC_SECRET_ARN;

  if (!sessionsTable || !qrTokensTable || !secretArn) {
    throw new Error('Missing environment variables SESSIONS_TABLE, QR_TOKENS_TABLE, or HMAC_SECRET_ARN');
  }

  return { sessionsTable, qrTokensTable, secretArn };
};

export const getSession = async (sessionId: string): Promise<SessionItem | null> => {
  const { sessionsTable } = getEnvVars();

  const response = await docClient.send(
    new GetCommand({
      TableName: sessionsTable,
      Key: { sessionId },
      ProjectionExpression: 'sessionId, teacherId, #status',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
    })
  );

  return (response.Item as SessionItem) || null;
};

export const saveQrToken = async (qrToken: QrTokenItem): Promise<void> => {
  const { qrTokensTable } = getEnvVars();

  await docClient.send(
    new PutCommand({
      TableName: qrTokensTable,
      Item: qrToken,
    })
  );
};

export const getHmacSecret = async (): Promise<string> => {
  // Return from RAM if already fetched
  if (cachedSecret) {
    return cachedSecret;
  }

  const { secretArn } = getEnvVars();

  const response = await secretsClient.send(
    new GetSecretValueCommand({
      SecretId: secretArn,
    })
  );

  if (!response.SecretString) {
    throw new Error('HMAC Secret is empty in Secrets Manager');
  }

  // Cache for future invocations
  cachedSecret = response.SecretString;
  
  return cachedSecret;
};
