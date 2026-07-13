import { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
};

export const Responses = {
  success: (data: any = {}): APIGatewayProxyStructuredResultV2 => ({
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(data),
  }),

  created: (data: any = {}): APIGatewayProxyStructuredResultV2 => ({
    statusCode: 201,
    headers: CORS_HEADERS,
    body: JSON.stringify(data),
  }),

  badRequest: (message: string, errors?: any): APIGatewayProxyStructuredResultV2 => ({
    statusCode: 400,
    headers: CORS_HEADERS,
    body: JSON.stringify({ message, errors }),
  }),

  unauthorized: (message: string = 'Unauthorized'): APIGatewayProxyStructuredResultV2 => ({
    statusCode: 401,
    headers: CORS_HEADERS,
    body: JSON.stringify({ message }),
  }),

  forbidden: (message: string = 'Forbidden'): APIGatewayProxyStructuredResultV2 => ({
    statusCode: 403,
    headers: CORS_HEADERS,
    body: JSON.stringify({ message }),
  }),

  notFound: (message: string = 'Not Found'): APIGatewayProxyStructuredResultV2 => ({
    statusCode: 404,
    headers: CORS_HEADERS,
    body: JSON.stringify({ message }),
  }),

  conflict: (message: string): APIGatewayProxyStructuredResultV2 => ({
    statusCode: 409,
    headers: CORS_HEADERS,
    body: JSON.stringify({ message }),
  }),

  internalError: (message: string = 'Internal Server Error'): APIGatewayProxyStructuredResultV2 => ({
    statusCode: 500,
    headers: CORS_HEADERS,
    body: JSON.stringify({ message }),
  }),
};




