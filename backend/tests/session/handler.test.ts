import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { handleCreateSession, handleGetListSessions, handleGetSession, handleDeleteSession } from '../../src/handlers/sessionHandler';
import { createMockEvent } from './eventFactory';
import { SessionStatus } from '../../src/shared/models';

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('Session Lambda Handler', () => {
  beforeEach(() => {
    ddbMock.reset();
    process.env.SESSIONS_TABLE = 'SessionsTable';
  });

  describe('handleGetListSessions (GET /sessions)', () => {
    it('should return 200 when payload is valid', async () => {
      ddbMock.on(QueryCommand).resolves({
        Items: [
          {
            sessionId: "session-1",
            teacherId: "god-Nguyen-Hua-Phung",
            className: "CO3335_CC01",
            status: SessionStatus.ACTIVE,
            createdAt: "2026-07-21T10:50:00Z",
            expiresAt: "2026-07-21T11:00:00Z",
            duration: 10,
          },
          {
            sessionId: "session-2",
            teacherId: "god-Nguyen-Hua-Phung",
            className: "CO3335_CC02",
            status: SessionStatus.CLOSED,
            createdAt: "2026-07-02T10:59:00Z",
            expiresAt: "2026-07-02T11:00:00Z",
            duration: 1,
          },
        ],
      });
      
      const event = createMockEvent({
        method: 'GET',
        path: '/sessions',
      }); 

      const response = await handleGetListSessions(event); 

      expect(response.statusCode).toBe(200); 

      const body = JSON.parse(response.body!);
      expect(body.total).toBe(2);
      expect(body.sessions).toHaveLength(2);
      expect(body.sessions[0].className).toBe("CO3335_CC01");
      expect(body.sessions[1].className).toBe("CO3335_CC02");
      expect(body.sessions[0].teacherId).toBe("god-Nguyen-Hua-Phung");
      expect(body.sessions[1].teacherId).toBe("god-Nguyen-Hua-Phung"); 

    });

    it("should return an empty list when teacher has no sessions", async () => {
      ddbMock.on(QueryCommand).resolves({
        Items: [],
      });
   
      const event = createMockEvent({
        method: "GET",
        path: "/sessions",
      });
   
      const response = await handleGetListSessions(event);
   
      expect(response.statusCode).toBe(200);
   
      const body = JSON.parse(response.body!);
      expect(body.total).toBe(0);
      expect(body.sessions).toEqual([]);
    }); 

    it("should return 403 when caller is not a teacher", async () => {
        const event = createMockEvent({
            method: "GET",
            path: "/sessions",
            groups: ["STUDENT"],
        });
        
        const response = await handleGetListSessions(event);
        
        expect(response.statusCode).toBe(403);
        expect(JSON.parse(response.body!).message).toBe("Forbidden: Caller is not a TEACHER");
    });
  });

  describe('handleCreateSession (POST /sessions)', () => {
    it('should create a session and return 201 when payload is valid', async () => {
      ddbMock.on(GetCommand).resolves({
        Item: {
          courseId: 'course-123',
          teacherId: 'test-teacher-id',
          courseName: 'CS101',
          courseCode: 'CS101'
        }
      });
      ddbMock.on(PutCommand).resolves({});

      const event = createMockEvent({
        method: 'POST',
        path: '/sessions',
        body: JSON.stringify({ courseId: 'course-123', className: 'CS101', duration: 90 }),
      });

      const response = await handleCreateSession(event);
      
      expect(response.statusCode).toBe(201);
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
        body: JSON.stringify({ courseId: 'course-123', className: 'CS101', duration: 0 }), // duration too small
      });

      const response = await handleCreateSession(event);
      
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body!).message).toBe('Invalid payload');
    });

    it('should return 403 if user is not in TEACHER group', async () => {
      const event = createMockEvent({
        method: 'POST',
        path: '/sessions',
        body: JSON.stringify({ courseId: 'course-123', className: 'CS101', duration: 90 }),
        groups: ['STUDENT'], // Not a teacher
      });

      const response = await handleCreateSession(event);
      expect(response.statusCode).toBe(403);
      expect(JSON.parse(response.body!).message).toBe('Forbidden: Caller is not a TEACHER');
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

  describe('handleCloseSession (POST /sessions/{sessionId}/close)', () => {
    it('should return 400 if session is already closed', async () => {
      ddbMock.on(GetCommand).resolves({
        Item: {
          sessionId: 'session-123',
          teacherId: 'test-teacher-id',
          status: SessionStatus.CLOSED, // Already closed
        }
      });

      const { handleCloseSession } = require('../../src/handlers/sessionHandler');
      
      const event = createMockEvent({
        method: 'POST',
        path: '/sessions/session-123/close',
        pathParameters: { sessionId: 'session-123' },
      });

      const response = await handleCloseSession(event);
      
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body!).message).toBe('Session is already closed');
    });
  });
});
