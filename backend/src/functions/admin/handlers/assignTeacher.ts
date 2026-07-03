import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { CognitoIdentityProviderClient, AdminAddUserToGroupCommand } from '@aws-sdk/client-cognito-identity-provider';
import { requireAdmin } from '../../../shared/permissions';
import { Responses } from '../../../shared/response';
import { RoleAssignmentSchema } from '../types';

const cognitoClient = new CognitoIdentityProviderClient({});

export const handleAssignTeacher = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  requireAdmin(event);

  if (!event.body) return Responses.badRequest("Missing body");

  const parsed = RoleAssignmentSchema.safeParse(JSON.parse(event.body));
  if (!parsed.success) return Responses.badRequest("Invalid payload", parsed.error.errors);

  const poolId = process.env.USER_POOL_ID;
  if (!poolId) throw new Error('USER_POOL_ID environment variable is missing');

  const command = new AdminAddUserToGroupCommand({
    UserPoolId: poolId,
    Username: parsed.data.username,
    GroupName: 'TEACHER',
  });

  await cognitoClient.send(command);
  return Responses.success({ message: `Successfully assigned TEACHER role to ${parsed.data.username}` });
};
