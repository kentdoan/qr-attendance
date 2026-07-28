import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { CourseItem } from '../shared/models';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const COURSES_TABLE = process.env.COURSES_TABLE!;

export const saveCourse = async (course: CourseItem): Promise<void> => {
  await docClient.send(new PutCommand({
    TableName: COURSES_TABLE,
    Item: course,
  }));
};

export const getCourse = async (courseId: string): Promise<CourseItem | null> => {
  const result = await docClient.send(new GetCommand({
    TableName: COURSES_TABLE,
    Key: { courseId },
  }));
  return (result?.Item as CourseItem) || null;
};

export const listCoursesByTeacher = async (teacherId: string): Promise<CourseItem[]> => {
  const result = await docClient.send(new QueryCommand({
    TableName: COURSES_TABLE,
    IndexName: 'TeacherIdIndex',
    KeyConditionExpression: 'teacherId = :tId',
    ExpressionAttributeValues: {
      ':tId': teacherId,
    },
  }));
  return (result.Items as CourseItem[]) || [];
};

export const deleteCourse = async (courseId: string): Promise<void> => {
  await docClient.send(new DeleteCommand({
    TableName: COURSES_TABLE,
    Key: { courseId },
  }));
};
