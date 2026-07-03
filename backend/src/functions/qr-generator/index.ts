import { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { handleGenerateQR } from './handler';

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer
): Promise<APIGatewayProxyStructuredResultV2> => {
  const method = event.requestContext.http.method;
  const path = event.requestContext.http.path; 

  try {
    if (method === 'GET' && path.match(/^\/sessions\/[^\/]+\/qr$/)) {
      return await handleGenerateQR(event);
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ message: 'Route Not Found' }),
    };
  } catch (error: any) {
    console.error('Error in QrGeneratorFunction:', error);
    
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
