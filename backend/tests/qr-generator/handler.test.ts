import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { handleGenerateQR } from '../../src/functions/qr-generator/handler';
import { createMockEvent } from '../session/eventFactory';
import { SessionStatus } from '../../src/functions/session/types';

const ddbMock = mockClient(DynamoDBDocumentClient);
const secretsMock = mockClient(SecretsManagerClient);

describe('QR Generator Lambda Handler', () => {
  beforeEach(() => {
    ddbMock.reset();
    secretsMock.reset();
    
    // Set required env vars
    process.env.SESSIONS_TABLE = 'SessionsTable';
    process.env.QR_TOKENS_TABLE = 'QrTokensTable';
    process.env.HMAC_SECRET_ARN = 'arn:aws:secretsmanager:mock';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should generate a QR token and return 200 for a valid session and owner', async () => {
    // Mock Database returning ACTIVE session owned by the caller
    ddbMock.on(GetCommand).resolves({
      Item: {
        sessionId: 'session-123',
        teacherId: 'test-teacher-id',
        status: SessionStatus.ACTIVE,
      },
    });

    // Mock Database PutCommand
    ddbMock.on(PutCommand).resolves({});

    // Mock Secrets Manager returning a secret
    secretsMock.on(GetSecretValueCommand).resolves({
      SecretString: 'my-super-secret-key-that-is-very-long',
    });

    const event = createMockEvent({
      method: 'GET',
      path: '/sessions/session-123/qr',
      pathParameters: { sessionId: 'session-123' },
      teacherId: 'test-teacher-id', // Match the database mock
    });

    const response = await handleGenerateQR(event);
    
    expect(response.statusCode).toBe(200);
    
    const body = JSON.parse(response.body!);
    
    // Validate expiration
    expect(body.expiresIn).toBe(60);
    
    // Validate token format: Should be a hex string of length 64 (SHA-256)
    expect(body.token).toBeDefined();
    expect(typeof body.token).toBe('string');
    expect(body.token).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should return 404 if the session does not exist', async () => {
    ddbMock.on(GetCommand).resolves({}); // Returns no Item

    const event = createMockEvent({
      method: 'GET',
      path: '/sessions/session-123/qr',
      pathParameters: { sessionId: 'session-123' },
    });

    const response = await handleGenerateQR(event);
    
    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body!).message).toBe('Session not found');
  });

  it('should return 403 if caller is not the owner of the session', async () => {
    ddbMock.on(GetCommand).resolves({
      Item: {
        sessionId: 'session-123',
        teacherId: 'another-teacher-id', // Different owner
        status: SessionStatus.ACTIVE,
      },
    });

    const event = createMockEvent({
      method: 'GET',
      path: '/sessions/session-123/qr',
      pathParameters: { sessionId: 'session-123' },
      teacherId: 'test-teacher-id', // Calling as different teacher
    });

    const response = await handleGenerateQR(event);
    
    expect(response.statusCode).toBe(403);
    expect(JSON.parse(response.body!).message).toBe('Forbidden: You are not the owner of this session');
  });

  it('should return 400 if the session is closed', async () => {
    ddbMock.on(GetCommand).resolves({
      Item: {
        sessionId: 'session-123',
        teacherId: 'test-teacher-id',
        status: SessionStatus.CLOSED, // Session is inactive
      },
    });

    const event = createMockEvent({
      method: 'GET',
      path: '/sessions/session-123/qr',
      pathParameters: { sessionId: 'session-123' },
      teacherId: 'test-teacher-id',
    });

    const response = await handleGenerateQR(event);
    
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body!).message).toBe('Session is not active');
  });

  it('should throw an error if the user is not in TEACHER group', async () => {
    const event = createMockEvent({
      method: 'GET',
      path: '/sessions/session-123/qr',
      pathParameters: { sessionId: 'session-123' },
      groups: ['STUDENT'], // Calling as student
    });

    await expect(handleGenerateQR(event)).rejects.toThrow('Forbidden: Caller is not a TEACHER');
  });
});
