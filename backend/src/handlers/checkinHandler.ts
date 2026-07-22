
import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { CheckinSchema } from '../shared/schemas';
import { getStudentInfo } from '../shared/permissions';
import { Responses } from '../shared/response';
import { errorHandler } from '../shared/errors';
import * as checkinService from '../services/checkinService';

export const handleCheckin = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  try {
    const { id: studentId, name: studentName } = getStudentInfo(event);
    
    if (!event.body) {
      return Responses.badRequest("Missing request body");
    }

    const payload = JSON.parse(event.body);
    const parsed = CheckinSchema.safeParse(payload);
    
    if (!parsed.success) {
      return Responses.badRequest("Invalid payload", parsed.error.errors);
    }

    const { token, sessionId, deviceFingerprint } = parsed.data;

    const attendance = await checkinService.processCheckin(studentId, studentName, token, sessionId, deviceFingerprint);
    return Responses.success({
        message: "Check-in successful",
        attendance,
    });
  } catch (error: any) {
    return errorHandler(error);
  }
};

export const handleGetMyAttendance = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  try {
    const { id: studentId } = getStudentInfo(event);
    const history = await checkinService.getStudentHistory(studentId);
    return Responses.success({ attendance: history });
  } catch (error: any) {
    return errorHandler(error);
  }
};
