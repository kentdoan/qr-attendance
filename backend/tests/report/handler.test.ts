import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { handleGetReport } from '../../src/handlers/reportHandler';
import { createMockEvent } from '../session/eventFactory';

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('Report Lambda Handler', () => {
  beforeEach(() => {
    ddbMock.reset();
    process.env.SESSIONS_TABLE = 'SessionsTable';
    process.env.ATTENDANCE_TABLE = 'AttendanceTable';
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if sessionId is missing', async () => {
    const event = createMockEvent({
      method: 'GET',
      path: '/sessions//report',
      groups: ['TEACHER'],
    });
    // Override pathParameters which eventFactory might not set perfectly for missing cases
    event.pathParameters = {};

    const response = await handleGetReport(event);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body!).message).toBe('Missing sessionId parameter');
  });

  it('should return 404 if session does not exist', async () => {
    ddbMock.on(GetCommand).resolves({});

    const event = createMockEvent({
      method: 'GET',
      path: '/sessions/non-existent/report',
      groups: ['TEACHER'],
    });
    event.pathParameters = { sessionId: 'non-existent' };

    const response = await handleGetReport(event);
    expect(response.statusCode).toBe(404);
  });

  it('should return 403 if caller is not a TEACHER', async () => {
    const event = createMockEvent({
      method: 'GET',
      path: '/sessions/123/report',
      groups: ['STUDENT'], // Not a teacher
    });

    const response = await handleGetReport(event);
    expect(response.statusCode).toBe(403);
    expect(JSON.parse(response.body!).message).toBe('Forbidden: Caller is not a TEACHER');
  });

  it('should return 403 if teacher does not own the session', async () => {
    // Session exists but owned by someone else
    ddbMock.on(GetCommand).resolves({
      Item: {
        sessionId: 'session-123',
        teacherId: 'other-teacher-id',
      },
    });

    const event = createMockEvent({
      method: 'GET',
      path: '/sessions/session-123/report',
      groups: ['TEACHER'],
      // Event factory sub is 'test-user-id'
    });
    event.pathParameters = { sessionId: 'session-123' };

    const response = await handleGetReport(event);
    expect(response.statusCode).toBe(403);
    expect(JSON.parse(response.body!).message).toBe('You do not own this session');
  });

  it('should return attendance report successfully', async () => {
    // Owns the session
    ddbMock.on(GetCommand).resolves({
      Item: {
        sessionId: 'session-123',
        teacherId: 'test-teacher-id', // matches eventFactory's default sub
      },
    });

    // Query returns 2 students
    ddbMock.on(QueryCommand).resolves({
      Items: [
        { studentId: 'student-A', checkinTime: 1000 },
        { studentId: 'student-B', checkinTime: 2000 },
      ],
    });

    const event = createMockEvent({
      method: 'GET',
      path: '/sessions/session-123/report',
      groups: ['TEACHER'],
    });
    event.pathParameters = { sessionId: 'session-123' };

    const response = await handleGetReport(event);
    expect(response.statusCode).toBe(200);
    
    const body = JSON.parse(response.body!);
    expect(body.sessionId).toBe('session-123');
    expect(body.totalAttendees).toBe(2);
    expect(body.attendees.length).toBe(2);
    expect(body.attendees[0].studentId).toBe('student-A');
  });
});
