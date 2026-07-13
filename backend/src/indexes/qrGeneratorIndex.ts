import { errorHandler } from '../shared/errors';
import { Responses } from '../shared/response';
import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { handleGenerateQR } from '../handlers/qrGeneratorHandler';

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyStructuredResultV2> => {
  const method = event.requestContext.http.method;
  const path = event.requestContext.http.path; 

  try {
    if (method === 'GET' && path.match(/^\/sessions\/[^/]+\/qr$/)) {
      return await handleGenerateQR(event);
    }

    return Responses.notFound('Route Not Found');
  } catch (error: any) {
    return errorHandler(error);
  }
};
