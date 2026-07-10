import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { getTeacherId } from '../shared/permissions';
import { Responses } from '../shared/response';
import { errorHandler } from '../shared/errors';
import * as reportService from '../services/reportService';

export const handleGetReport = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  try {
    const teacherId = getTeacherId(event);
    const sessionId = event.pathParameters?.sessionId;

    if (!sessionId) {
      return Responses.badRequest('Missing sessionId parameter');
    }

    const report = await reportService.getReport(sessionId, teacherId);
    return Responses.success(report);
  } catch (error: any) {
    return errorHandler(error);
  }
};
