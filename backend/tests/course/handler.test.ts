import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { handleCreateCourse, handleGetListCourses, handleDeleteCourse } from '../../src/handlers/courseHandler';
import { createMockEvent } from '../session/eventFactory';

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('Course Lambda Handlers', () => {
  beforeEach(() => {
    ddbMock.reset();
    process.env.COURSES_TABLE = 'CoursesTable';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleCreateCourse', () => {
    it('should create a course and return 201', async () => {
      // Mock check duplicate courseName
      ddbMock.on(QueryCommand).resolves({ Items: [] });
      
      // Mock PutCommand
      ddbMock.on(PutCommand).resolves({});

      const event = createMockEvent({
        method: 'POST',
        path: '/courses',
        groups: ['TEACHER'],
        body: JSON.stringify({
          courseName: 'Test Course',
          courseCode: 'CS101'
        }),
      });

      const response = await handleCreateCourse(event);
      expect(response.statusCode).toBe(201);
      
      const body = JSON.parse(response.body!);
      expect(body.message).toBe('Course created successfully');
      expect(body.course.courseName).toBe('Test Course');
      expect(body.course.courseCode).toBe('CS101');
    });

    it('should return 400 if payload is missing', async () => {
      const event = createMockEvent({
        method: 'POST',
        path: '/courses',
        groups: ['TEACHER'],
        body: '',
      });

      const response = await handleCreateCourse(event);
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body!).message).toBe('Missing request body');
    });

    it('should return 409 if course name or code already exists', async () => {
      // Mock check duplicate -> returns existing course
      ddbMock.on(QueryCommand).resolves({ 
        Items: [{ courseId: 'exist', courseName: 'Test Course', courseCode: 'CS101' }] 
      });

      const event = createMockEvent({
        method: 'POST',
        path: '/courses',
        groups: ['TEACHER'],
        body: JSON.stringify({
          courseName: 'Test Course',
          courseCode: 'CS101'
        }),
      });

      const response = await handleCreateCourse(event);
      expect(response.statusCode).toBe(409);
      expect(JSON.parse(response.body!).message).toBe("Mã môn học 'CS101' đã tồn tại.");
    });
  });

  describe('handleGetListCourses', () => {
    it('should return list of courses and 200', async () => {
      ddbMock.on(QueryCommand).resolves({
        Items: [
          { courseId: 'c1', courseName: 'C1', courseCode: 'CC1' },
          { courseId: 'c2', courseName: 'C2', courseCode: 'CC2' }
        ]
      });

      const event = createMockEvent({
        method: 'GET',
        path: '/courses',
        groups: ['TEACHER'],
      });

      const response = await handleGetListCourses(event);
      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body!);
      expect(body.total).toBe(2);
      expect(body.courses.length).toBe(2);
    });
  });

  describe('handleDeleteCourse', () => {
    it('should delete course successfully and return 200', async () => {
      // Mock GetCommand (verify ownership)
      ddbMock.on(GetCommand).resolves({
        Item: { courseId: 'c1', teacherId: 'test-teacher-id' }
      });

      // Mock DeleteCommand
      ddbMock.on(DeleteCommand).resolves({});

      const event = createMockEvent({
        method: 'DELETE',
        path: '/courses/c1',
        groups: ['TEACHER'],
        pathParameters: { courseId: 'c1' }
      });

      const response = await handleDeleteCourse(event);
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body!).message).toBe('Course deleted successfully');
    });

    it('should return 403 if teacher does not own course', async () => {
      // Mock GetCommand (different owner)
      ddbMock.on(GetCommand).resolves({
        Item: { courseId: 'c1', teacherId: 'different-teacher-id' }
      });

      const event = createMockEvent({
        method: 'DELETE',
        path: '/courses/c1',
        groups: ['TEACHER'],
        pathParameters: { courseId: 'c1' }
      });

      const response = await handleDeleteCourse(event);
      expect(response.statusCode).toBe(403);
      expect(JSON.parse(response.body!).message).toBe("You don't have permission to delete this course");
    });

    it('should return 404 if course not found', async () => {
      // Mock GetCommand
      ddbMock.on(GetCommand).resolves({});

      const event = createMockEvent({
        method: 'DELETE',
        path: '/courses/c1',
        groups: ['TEACHER'],
        pathParameters: { courseId: 'c1' }
      });

      const response = await handleDeleteCourse(event);
      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body!).message).toBe('Course not found');
    });
  });
});
