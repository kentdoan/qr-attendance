import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { AttendanceItem, QrTokenItem } from './types';

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const getEnvVars = () => {
  const attendanceTable = process.env.ATTENDANCE_TABLE;
  const qrTokensTable = process.env.QR_TOKENS_TABLE;

  if (!attendanceTable || !qrTokensTable) {
    throw new Error('Missing environment variables ATTENDANCE_TABLE or QR_TOKENS_TABLE');
  }

  return { attendanceTable, qrTokensTable };
};

export const getQrToken = async (token: string): Promise<QrTokenItem | null> => {
  const { qrTokensTable } = getEnvVars();

  const response = await docClient.send(
    new GetCommand({
      TableName: qrTokensTable,
      Key: { token },
    })
  );

  return (response.Item as QrTokenItem) || null;
};

export const deleteQrToken = async (token: string): Promise<void> => {
  const { qrTokensTable } = getEnvVars();

  await docClient.send(
    new DeleteCommand({
      TableName: qrTokensTable,
      Key: { token },
    })
  );
};

export const checkAttendanceExist = async (sessionId: string, studentId: string): Promise<boolean> => {
  const { attendanceTable } = getEnvVars();

  const response = await docClient.send(
    new GetCommand({
      TableName: attendanceTable,
      Key: { sessionId, studentId },
    })
  );

  return !!response.Item;
};

export const saveAttendance = async (attendance: AttendanceItem): Promise<void> => {
  const { attendanceTable } = getEnvVars();

  await docClient.send(
    new PutCommand({
      TableName: attendanceTable,
      Item: attendance,
    })
  );
};
