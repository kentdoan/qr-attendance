import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { AttendanceRecord } from '../shared/models';

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const getEnvVars = () => {
  const attendanceTable = process.env.ATTENDANCE_TABLE;
  const sessionsTable = process.env.SESSIONS_TABLE;

  if (!attendanceTable || !sessionsTable) {
    throw new Error('Missing environment variables ATTENDANCE_TABLE or SESSIONS_TABLE');
  }

  return { attendanceTable, sessionsTable };
};

export const getSessionOwner = async (sessionId: string): Promise<string | null> => {
  const { sessionsTable } = getEnvVars();

  const response = await docClient.send(
    new GetCommand({
      TableName: sessionsTable,
      Key: { sessionId },
    })
  );

  return response.Item ? response.Item.teacherId : null;
};

export const getAttendanceReport = async (sessionId: string): Promise<AttendanceRecord[]> => {
  const { attendanceTable } = getEnvVars();

  const response = await docClient.send(
    new QueryCommand({
      TableName: attendanceTable,
      KeyConditionExpression: 'sessionId = :sid',
      ExpressionAttributeValues: {
        ':sid': sessionId,
      },
    })
  );

  return (response.Items || []) as AttendanceRecord[];
};
