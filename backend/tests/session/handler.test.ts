import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { handleCreateSession, handleCloseSession, handleGetSession } from '../../src/functions/session/handler';
import { createMockEvent } from './eventFactory';
import { SessionStatus } from '../../src/functions/session/types';

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('Session Lambda Handler', () => {
  beforeEach(() => {
    ddbMock.reset();
    process.env.SESSIONS_TABLE = 'SessionsTable';
  });

  describe('handleCreateSession (POST /sessions)', () => {
    it('should create a session and return 201 when payload is valid', async () => {
      ddbMock.on(PutCommand).resolves({});

      const event = createMockEvent({
        method: 'POST',
        path: '/sessions',
        body: JSON.stringify({ className: 'CS101', duration: 90 }),
      });

      const response = await handleCreateSession(event);
      
      expect(response.statusCode).toBe(201);
      const responseBody = JSON.parse(response.body);
      expect(responseBody.className).toBe('CS101');
      expect(responseBody.duration).toBe(90);
      expect(responseBody.status).toBe(SessionStatus.ACTIVE);
      expect(responseBody.teacherId).toBe('test-teacher-id');
      expect(responseBody.sessionId).toBeDefined();
    });

    it('should return 400 when duration is invalid (Zod validation)', async () => {
      const event = createMockEvent({
        method: 'POST',
        path: '/sessions',
        body: JSON.stringify({ className: 'CS101', duration: 1 }), // duration too small
      });

      const response = await handleCreateSession(event);
      
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).message).toBe('Validation Error');
    });

    it('should throw an error if user is not in TEACHER group', async () => {
      const event = createMockEvent({
        method: 'POST',
        path: '/sessions',
        body: JSON.stringify({ className: 'CS101', duration: 90 }),
        groups: ['STUDENT'], // Not a teacher
      });

      await expect(handleCreateSession(event)).rejects.toThrow('Forbidden: Caller is not a TEACHER');
    });
  });

  describe('handleCloseSession (PATCH /sessions/{sessionId}/close)', () => {
    it('should close the session if the caller is the owner', async () => {
      ddbMock.on(GetCommand).resolves({
        Item: {
          sessionId: 'session-123',
          teacherId: 'test-teacher-id', // Matches the mock event default
          status: SessionStatus.ACTIVE,
        }
      });
      ddbMock.on(UpdateCommand).resolves({});

      const event = createMockEvent({
        method: 'PATCH',
        path: '/sessions/session-123/close',
        pathParameters: { sessionId: 'session-123' },
      });

      const response = await handleCloseSession(event);
      
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body).message).toBe('Session closed successfully');
    });

    it('should return 403 Forbidden if a different teacher tries to close it', async () => {
      ddbMock.on(GetCommand).resolves({
        Item: {
          sessionId: 'session-123',
          teacherId: 'another-teacher-id', // Different owner
          status: SessionStatus.ACTIVE,
        }
      });

      const event = createMockEvent({
        method: 'PATCH',
        path: '/sessions/session-123/close',
        pathParameters: { sessionId: 'session-123' },
      });

      const response = await handleCloseSession(event);
      
      expect(response.statusCode).toBe(403);
      expect(JSON.parse(response.body).message).toBe('Forbidden: You are not the owner of this session');
    });
  });
});
