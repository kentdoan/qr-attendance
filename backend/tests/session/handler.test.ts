import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { handleCreateSession } from '../../src/functions/session/handlers/create';
import { handleGetSession } from '../../src/functions/session/handlers/get';
import { handleDeleteSession } from '../../src/functions/session/handlers/delete';
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
      
      expect(response.statusCode).toBe(200);
      const responseBody = JSON.parse(response.body!);
      expect(responseBody.session.className).toBe('CS101');
      expect(responseBody.session.duration).toBe(90);
      expect(responseBody.session.status).toBe(SessionStatus.ACTIVE);
      expect(responseBody.session.teacherId).toBe('test-teacher-id');
      expect(responseBody.session.sessionId).toBeDefined();
    });

    it('should return 400 when duration is invalid (Zod validation)', async () => {
      const event = createMockEvent({
        method: 'POST',
        path: '/sessions',
        body: JSON.stringify({ className: 'CS101', duration: 1 }), // duration too small
      });

      const response = await handleCreateSession(event);
      
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body!).message).toBe('Invalid payload');
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

  describe('handleDeleteSession (DELETE /sessions/{sessionId})', () => {
    it('should close the session if the caller is the owner', async () => {
      ddbMock.on(GetCommand).resolves({
        Item: {
          sessionId: 'session-123',
          teacherId: 'test-teacher-id', // Matches the mock event default
          status: SessionStatus.ACTIVE,
        }
      });
      ddbMock.on(DeleteCommand).resolves({});

      const event = createMockEvent({
        method: 'DELETE',
        path: '/sessions/session-123',
        pathParameters: { sessionId: 'session-123' },
      });

      const response = await handleDeleteSession(event);
      
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body!).message).toBe('Session deleted successfully');
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
        method: 'DELETE',
        path: '/sessions/session-123',
        pathParameters: { sessionId: 'session-123' },
      });

      const response = await handleDeleteSession(event);
      
      expect(response.statusCode).toBe(403);
      expect(JSON.parse(response.body!).message).toBe('You do not own this session');
    });
  });
});
