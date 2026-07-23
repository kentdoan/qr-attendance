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

  return claims.sub as string;
};

export const getTeacherId = (event: APIGatewayProxyEventV2WithJWTAuthorizer): string => {
  return requireGroup(event, 'TEACHER');
};

export const getTeacherInfo = (event: APIGatewayProxyEventV2WithJWTAuthorizer): { id: string, name: string, school: string, faculty: string } => {
  const id = requireGroup(event, 'TEACHER');
  const claims = getClaims(event);
  const name = claims.name as string || claims.email as string || 'Unknown';
  const school = claims['custom:school'] as string || '';
  const faculty = claims['custom:faculty'] as string || '';
  return { id, name, school, faculty };
};

export const getStudentId = (event: APIGatewayProxyEventV2WithJWTAuthorizer): string => {
  return requireGroup(event, 'STUDENT');
};

export const getStudentInfo = (event: APIGatewayProxyEventV2WithJWTAuthorizer): { id: string, name: string, school: string, faculty: string, major: string } => {
  const id = requireGroup(event, 'STUDENT');
  const claims = getClaims(event);
  const name = claims.name as string || 'Unknown';
  const school = claims['custom:school'] as string || '';
  const faculty = claims['custom:faculty'] as string || '';
  const major = claims['custom:major'] as string || '';
  return { id, name, school, faculty, major };
};

export const requireAdmin = (event: APIGatewayProxyEventV2WithJWTAuthorizer): string => {
  return requireGroup(event, 'ADMIN');
};
