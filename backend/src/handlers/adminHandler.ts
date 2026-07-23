import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { requireAdmin } from '../shared/permissions';
import { Responses } from '../shared/response';
import { errorHandler } from '../shared/errors';
import { RoleAssignmentSchema } from '../shared/schemas';
import * as adminService from '../services/adminService';

export const handleAssignTeacher = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  try {
    requireAdmin(event);
    if (!event.body) return Responses.badRequest("Missing body");

    const parsed = RoleAssignmentSchema.safeParse(JSON.parse(event.body));
    if (!parsed.success) return Responses.badRequest("Invalid payload", parsed.error.errors);

    await adminService.assignTeacher(parsed.data.username);
    return Responses.success({ message: `Successfully assigned TEACHER role to ${parsed.data.username}` });
  } catch (error: any) {
    return errorHandler(error);
  }
};

export const handleRevokeTeacher = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  try {
    requireAdmin(event);
    if (!event.body) return Responses.badRequest("Missing body");

    const parsed = RoleAssignmentSchema.safeParse(JSON.parse(event.body));
    if (!parsed.success) return Responses.badRequest("Invalid payload", parsed.error.errors);

    await adminService.revokeTeacher(parsed.data.username);
    return Responses.success({ message: `Successfully revoked TEACHER role from ${parsed.data.username}` });
  } catch (error: any) {
    return errorHandler(error);
  }
};

export const handleListUsers = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  try {
    requireAdmin(event);
    const paginationToken = event.queryStringParameters?.nextToken;
    const result = await adminService.listUsers(paginationToken);
    return Responses.success(result);
  } catch (error: any) {
    return errorHandler(error);
  }
};

export const handleDeleteUser = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  try {
    requireAdmin(event);
    const username = event.pathParameters?.username;
    if (!username) return Responses.badRequest("Missing username in path parameters");

    await adminService.deleteUser(username);
    return Responses.success({ message: `Successfully deleted user ${username}` });
  } catch (error: any) {
    return errorHandler(error);
  }
};
