import { errorHandler } from '../../shared/errors';
import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import * as repo from './repository';
import { ReportResponse } from './types';
import { getTeacherId, } from '../../shared/permissions';
import { Responses } from '../../shared/response';

export const handleGetReport = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  try {
    const teacherId = getTeacherId(event);
    const sessionId = event.pathParameters?.sessionId;

    if (!sessionId) {
      return Responses.badRequest('Missing sessionId parameter');
    }

    const sessionOwner = await repo.getSessionOwner(sessionId);
    if (!sessionOwner) {
      return Responses.notFound('Session not found');
    }

    if (sessionOwner !== teacherId) {
      return Responses.forbidden('You do not own this session');
    }

    const attendanceRecords = await repo.getAttendanceReport(sessionId);

    const report: ReportResponse = {
      sessionId,
      totalAttendees: attendanceRecords.length,
      attendees: attendanceRecords.map(record => ({
        studentId: record.studentId,
        checkinTime: record.checkinTime,
      })),
    };

    return Responses.success(report);
  } catch (error) {
    return errorHandler(error);
  }
};
