import { errorHandler } from '../shared/errors';
import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { handleCreateSession, handleGetListSessions, handleGetSession, handleDeleteSession, handleCloseSession } from '../handlers/sessionHandler';
import { Responses } from '../shared/response';

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const method = event.requestContext.http.method;
    const path = event.requestContext.http.path;

    if (method === 'POST' && path === '/sessions') {
      return await handleCreateSession(event);
    }
    if (method === 'GET' && path === '/sessions') {
      return await handleGetListSessions(event);
    }
    if (method === 'GET' && path.match(/^\/sessions\/[a-zA-Z0-9-]+$/)) {
      return await handleGetSession(event);
    }
    if (method === 'DELETE' && path.match(/^\/sessions\/[a-zA-Z0-9-]+$/)) {
      return await handleDeleteSession(event);
    }
    if (method === 'PATCH' && path.match(/^\/sessions\/[a-zA-Z0-9-]+\/close$/)) {
      return await handleCloseSession(event);
    }

    return Responses.notFound('Route Not Found');
  } catch (error) {
    return errorHandler(error);
  }
};
