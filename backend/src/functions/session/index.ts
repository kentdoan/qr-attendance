import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import {
  handleCreateSession,
  handleGetSession,
  handleCloseSession,
  handleDeleteSession,
} from './handler';

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyStructuredResultV2> => {
  const method = event.requestContext.http.method;
  const path = event.requestContext.http.path; // e.g. /sessions, /sessions/123/close

  try {
    if (method === 'POST' && path === '/sessions') {
      return await handleCreateSession(event);
    } 
    
    if (method === 'GET' && path.startsWith('/sessions/')) {
      return await handleGetSession(event);
    } 
    
    if (method === 'PATCH' && path.match(/^\/sessions\/[^\/]+\/close$/)) {
      return await handleCloseSession(event);
    } 
    
    if (method === 'DELETE' && path.match(/^\/sessions\/[^\/]+$/)) {
      return await handleDeleteSession(event);
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ message: 'Route Not Found' }),
    };
  } catch (error: any) {
    console.error('Error in SessionFunction:', error);
    
    if (error.message.startsWith('Unauthorized') || error.message.startsWith('Forbidden')) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: error.message }),
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
