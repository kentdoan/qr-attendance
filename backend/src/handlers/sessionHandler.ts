import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { getTeacherId, getTeacherInfo } from '../shared/permissions';
import { Responses } from '../shared/response';
import { errorHandler } from '../shared/errors';
import { CreateSessionBodySchema } from '../shared/schemas';
import * as sessionService from '../services/sessionService';

export const handleCreateSession = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  try {
    const { id: teacherId, name: teacherName, school: teacherSchool, faculty: teacherFaculty } = getTeacherInfo(event);
    if (!event.body) return Responses.badRequest("Missing request body");

    const payload = JSON.parse(event.body);
    const parsed = CreateSessionBodySchema.safeParse(payload);
    
    if (!parsed.success) return Responses.badRequest("Invalid payload", parsed.error.errors);

    const session = await sessionService.createSession(
      teacherId, 
      teacherName, 
      teacherSchool, 
      teacherFaculty,
      parsed.data.courseId,
      parsed.data.className || "Phiên điểm danh", 
      parsed.data.duration
    );
    return Responses.created({ message: "Session created successfully", session });
  } catch (error: any) {
    return errorHandler(error);
  }
};

export const handleGetListSessions = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  try {
    const teacherId = getTeacherId(event);
    const sessions = await sessionService.getListSessions(teacherId);
    return Responses.success({
      total: sessions.length,
      sessions,
    });
  } catch (error: any) {
    return errorHandler(error);
  }
};

export const handleGetSession = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  try {
    const teacherId = getTeacherId(event);
    const sessionId = event.pathParameters?.sessionId;
    if (!sessionId) return Responses.badRequest("Missing sessionId parameter");

    const session = await sessionService.getSession(sessionId, teacherId);
    return Responses.success({ session });
  } catch (error: any) {
    return errorHandler(error);
  }
};

export const handleDeleteSession = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  try {
    const teacherId = getTeacherId(event);
    const sessionId = event.pathParameters?.sessionId;
    if (!sessionId) return Responses.badRequest("Missing sessionId parameter");

    await sessionService.deleteSession(sessionId, teacherId);
    return Responses.success({ message: "Session deleted successfully" });
  } catch (error: any) {
    return errorHandler(error);
  }
};

export const handleCloseSession = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  try {
    const teacherId = getTeacherId(event);
    const sessionId = event.pathParameters?.sessionId;
    if (!sessionId) return Responses.badRequest("Missing sessionId");

    await sessionService.closeSession(sessionId, teacherId);
    return Responses.success({ message: 'Session closed successfully' });
  } catch (error: any) {
    return errorHandler(error);
  }
};
