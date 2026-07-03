import { errorHandler } from '../../shared/errors';
import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { handleAssignTeacher } from './handlers/assignTeacher';
import { handleRevokeTeacher } from './handlers/revokeTeacher';
import { handleListUsers } from './handlers/listUsers';
import { Responses } from '../../shared/response';

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const method = event.requestContext.http.method;
    const path = event.requestContext.http.path; 

    if (method === 'GET' && path === '/admin/users') {
      return await handleListUsers(event);
    }

    if (method === 'POST' && path === '/admin/assign-teacher') {
      return await handleAssignTeacher(event);
    }

    if (method === 'POST' && path === '/admin/revoke-teacher') {
      return await handleRevokeTeacher(event);
    }

    return Responses.notFound('Route Not Found');
  } catch (error) {
    return errorHandler(error);
  }
};
