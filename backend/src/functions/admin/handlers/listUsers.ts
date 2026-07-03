import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { CognitoIdentityProviderClient, ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider';
import { requireAdmin } from '../../../shared/permissions';
import { Responses } from '../../../shared/response';

const cognitoClient = new CognitoIdentityProviderClient({});

export const handleListUsers = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  requireAdmin(event);

  const poolId = process.env.USER_POOL_ID;
  if (!poolId) throw new Error('USER_POOL_ID environment variable is missing');

  const command = new ListUsersCommand({
    UserPoolId: poolId,
    Limit: 50,
  });

  const response = await cognitoClient.send(command);
  const users = (response.Users || []).map(user => {
    return {
      username: user.Username,
      status: user.UserStatus,
      attributes: user.Attributes?.reduce((acc, attr) => ({ ...acc, [attr.Name as string]: attr.Value }), {}),
      created: user.UserCreateDate,
    };
  });

  return Responses.success({ users });
};
