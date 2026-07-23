import { errorHandler } from '../shared/errors';
import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { handleCreateCourse, handleGetListCourses, handleDeleteCourse } from '../handlers/courseHandler';
import { Responses } from '../shared/response';

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const method = event.requestContext.http.method;
    const path = event.requestContext.http.path;

    if (method === 'POST' && path === '/courses') {
      return await handleCreateCourse(event);
    }
    if (method === 'GET' && path === '/courses') {
      return await handleGetListCourses(event);
    }
    if (method === 'DELETE' && path.match(/^\/courses\/[a-zA-Z0-9-]+$/)) {
      return await handleDeleteCourse(event);
    }

    return Responses.notFound('Route Not Found');
  } catch (error) {
    return errorHandler(error);
  }
};
