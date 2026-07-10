import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { getTeacherId } from '../shared/permissions';
import { Responses } from '../shared/response';
import { errorHandler } from '../shared/errors';
import * as qrGeneratorService from '../services/qrGeneratorService';

export const handleGenerateQR = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  try {
    const teacherId = getTeacherId(event);
    const sessionId = event.pathParameters?.sessionId;

    if (!sessionId) {
      return Responses.badRequest("Missing sessionId");
    }

    const result = await qrGeneratorService.generateQrToken(sessionId, teacherId);
    return Responses.success(result);
  } catch (error: any) {
    return errorHandler(error);
  }
};
