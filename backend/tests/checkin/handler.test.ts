import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { handleCheckin } from '../../src/handlers/checkinHandler';
import { createMockEvent } from '../session/eventFactory';

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('Check-in Lambda Handler', () => {
  beforeEach(() => {
    ddbMock.reset();
    
    // Set required env vars
    process.env.QR_TOKENS_TABLE = 'QrTokensTable';
    process.env.ATTENDANCE_TABLE = 'AttendanceTable';
    process.env.SESSIONS_TABLE = 'SessionsTable';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should process check-in successfully and return 200', async () => {
    // 1. Mock GetCommand for Token (returns valid token)
    ddbMock.on(GetCommand, { TableName: 'QrTokensTable' }).resolves({
      Item: {
        token: 'valid-token-123',
        sessionId: 'session-123',
        expiresAt: 9999999999,
      },
    });

    // 2. Mock GetCommand for Attendance (returns null, meaning not checked in yet)
    ddbMock.on(GetCommand, { TableName: 'AttendanceTable' }).resolves({});

    // 2.5 Mock GetCommand for Session (ACTIVE)
    ddbMock.on(GetCommand, { TableName: 'SessionsTable' }).resolves({
      Item: {
        sessionId: 'session-123',
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 1000000).toISOString(),
      },
    });

    // 3. Mock PutCommand (Save Attendance)
    ddbMock.on(PutCommand).resolves({});

    // 4. Mock DeleteCommand (Delete Token)
    ddbMock.on(DeleteCommand).resolves({});

    const event = createMockEvent({
      method: 'POST',
      path: '/checkin',
      groups: ['STUDENT'], // Must be student
      body: JSON.stringify({
        token: 'valid-token-123',
        sessionId: 'session-123',
        deviceFingerprint: 'device-xyz',
      }),
    });

    const response = await handleCheckin(event);
    
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body!).message).toBe('Check-in successful');
    
    // Verify DDB operations were called
    // (1 Get Token, 1 Get Session, 1 Get Attendance, 1 Put Attendance, 1 Delete Token)
    expect(ddbMock.calls().length).toBe(5);
  });

  it('should return 400 if token is missing or invalid in database', async () => {
    // Mock GetCommand for Token returns nothing (invalid or expired)
    ddbMock.on(GetCommand, { TableName: 'QrTokensTable' }).resolves({});

    const event = createMockEvent({
      method: 'POST',
      path: '/checkin',
      groups: ['STUDENT'],
      body: JSON.stringify({
        token: 'invalid-token',
        sessionId: 'session-123',
        deviceFingerprint: 'device-xyz',
      }),
    });

    const response = await handleCheckin(event);
    
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body!).message).toBe('Invalid or expired QR code');
  });

  it('should return 400 if token sessionId does not match payload sessionId', async () => {
    // Mock GetCommand returns a token for a DIFFERENT session
    ddbMock.on(GetCommand, { TableName: 'QrTokensTable' }).resolves({
      Item: {
        token: 'token-abc',
        sessionId: 'different-session',
        expiresAt: 9999999999,
      },
    });

    const event = createMockEvent({
      method: 'POST',
      path: '/checkin',
      groups: ['STUDENT'],
      body: JSON.stringify({
        token: 'token-abc',
        sessionId: 'session-123', // Mismatch!
        deviceFingerprint: 'device-xyz',
      }),
    });

    const response = await handleCheckin(event);
    
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body!).message).toBe('QR code does not match this session');
  });

  it('should return 409 if student has already checked in', async () => {
    // Valid Token
    ddbMock.on(GetCommand, { TableName: 'QrTokensTable' }).resolves({
      Item: {
        token: 'valid-token',
        sessionId: 'session-123',
        expiresAt: 9999999999,
      },
    });

    // Mock GetCommand for Attendance returns an Item (already checked in!)
    ddbMock.on(GetCommand, { TableName: 'AttendanceTable' }).resolves({
      Item: {
        sessionId: 'session-123',
        studentId: 'test-user-id', // Match event factory sub
      },
    });

    // Mock GetCommand for Session (ACTIVE)
    ddbMock.on(GetCommand, { TableName: 'SessionsTable' }).resolves({
      Item: {
        sessionId: 'session-123',
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 1000000).toISOString(),
      },
    });

    const event = createMockEvent({
      method: 'POST',
      path: '/checkin',
      groups: ['STUDENT'],
      body: JSON.stringify({
        token: 'valid-token',
        sessionId: 'session-123',
        deviceFingerprint: 'device-xyz',
      }),
    });

    const response = await handleCheckin(event);
    
    expect(response.statusCode).toBe(409);
    expect(JSON.parse(response.body!).message).toBe('You have already checked in for this session');
  });

  it('should return 403 if caller is not a STUDENT', async () => {
    const event = createMockEvent({
      method: 'POST',
      path: '/checkin',
      groups: ['TEACHER'], // Forbidden
      body: JSON.stringify({
        token: 'token',
        sessionId: 'session',
        deviceFingerprint: 'device',
      }),
    });

    const response = await handleCheckin(event);
    expect(response.statusCode).toBe(403);
    expect(JSON.parse(response.body!).message).toBe('Forbidden: Caller is not a STUDENT');
  });
});
