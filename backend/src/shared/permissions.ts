import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { UnauthorizedError, ForbiddenError } from './errors';

export const getClaims = (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  const authorizer = event.requestContext?.authorizer;
  if (!authorizer || !authorizer.jwt || !authorizer.jwt.claims) {
    throw new UnauthorizedError('Unauthorized: Missing JWT claims');
  }
  return authorizer.jwt.claims;
};

export const requireGroup = (event: APIGatewayProxyEventV2WithJWTAuthorizer, groupName: string): string => {
  const claims = getClaims(event);
  const groups = claims['cognito:groups'] as string[] | undefined;
  
  if (!groups || !groups.includes(groupName)) {
    throw new ForbiddenError(`Forbidden: Caller is not a ${groupName}`);
  }

  return claims.sub as string; // Return userId
};

export const getTeacherId = (event: APIGatewayProxyEventV2WithJWTAuthorizer): string => {
  return requireGroup(event, 'TEACHER');
};

export const getStudentId = (event: APIGatewayProxyEventV2WithJWTAuthorizer): string => {
  return requireGroup(event, 'STUDENT');
};

export const requireAdmin = (event: APIGatewayProxyEventV2WithJWTAuthorizer): string => {
  return requireGroup(event, 'ADMIN');
};
