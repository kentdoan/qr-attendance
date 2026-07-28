import { Responses } from './response';
import { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { Logger } from './logger';

export class AppError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Not Found') {
    super(message, 404);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request') {
    super(message, 400);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, 409);
  }
}

export const errorHandler = (error: any): APIGatewayProxyStructuredResultV2 => {
  Logger.error('API Error:', error);

  if (error instanceof AppError) {
    return Responses[error.statusCode === 401 ? 'unauthorized' :
      error.statusCode === 403 ? 'forbidden' :
      error.statusCode === 404 ? 'notFound' :
      error.statusCode === 409 ? 'conflict' : 'badRequest'](error.message);
  }

  return Responses.internalError(`Internal Server Error: ${error.message} - Stack: ${error.stack}`);
};
