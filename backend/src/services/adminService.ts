import { CognitoIdentityProviderClient, AdminAddUserToGroupCommand, AdminUpdateUserAttributesCommand, AdminRemoveUserFromGroupCommand, ListUsersCommand, AdminDeleteUserCommand, AdminListGroupsForUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { BadRequestError, ForbiddenError, NotFoundError } from '../shared/errors';
import { Logger } from '../shared/logger';

const cognitoClient = new CognitoIdentityProviderClient({});

const getPoolId = () => {
  const poolId = process.env.USER_POOL_ID;
  if (!poolId) {
    Logger.error('USER_POOL_ID environment variable is missing');
    throw new BadRequestError('USER_POOL_ID environment variable is missing');
  }
  return poolId;
};

export const assignTeacher = async (username: string): Promise<void> => {
  const poolId = getPoolId();
  await cognitoClient.send(new AdminAddUserToGroupCommand({
    UserPoolId: poolId,
    Username: username,
    GroupName: 'TEACHER',
  }));

  try {
    await cognitoClient.send(new AdminRemoveUserFromGroupCommand({
      UserPoolId: poolId,
      Username: username,
      GroupName: 'STUDENT',
    }));
  } catch (err: any) {
    // Ignore if user was not in STUDENT group
    if (err.name !== 'UserNotFoundException' && err.name !== 'InvalidParameterException') {
      Logger.warn(`Failed to remove user from STUDENT group: ${err.message}`);
    }
  }

  await cognitoClient.send(new AdminUpdateUserAttributesCommand({
    UserPoolId: poolId,
    Username: username,
    UserAttributes: [{ Name: 'custom:role', Value: 'TEACHER' }],
  }));
};

export const revokeTeacher = async (username: string): Promise<void> => {
  const poolId = getPoolId();
  await cognitoClient.send(new AdminRemoveUserFromGroupCommand({
    UserPoolId: poolId,
    Username: username,
    GroupName: 'TEACHER',
  }));

  await cognitoClient.send(new AdminAddUserToGroupCommand({
    UserPoolId: poolId,
    Username: username,
    GroupName: 'STUDENT',
  }));

  await cognitoClient.send(new AdminUpdateUserAttributesCommand({
    UserPoolId: poolId,
    Username: username,
    UserAttributes: [{ Name: 'custom:role', Value: 'STUDENT' }],
  }));
};

export const listUsers = async (paginationToken?: string): Promise<{ users: any[], nextToken?: string }> => {
  const poolId = getPoolId();
  const response = await cognitoClient.send(new ListUsersCommand({
    UserPoolId: poolId,
    Limit: 50,
    ...(paginationToken && { PaginationToken: paginationToken }),
  }));
  
  const users = (response.Users || []).map(user => {
    return {
      username: user.Username,
      status: user.UserStatus,
      attributes: user.Attributes?.reduce((acc, attr) => ({ ...acc, [attr.Name as string]: attr.Value }), {}),
      created: user.UserCreateDate,
    };
  });

  return { users, nextToken: response.PaginationToken };
};

export const deleteUser = async (username: string): Promise<void> => {
  const poolId = getPoolId();
  
  // Kiểm tra xem user có phải là ADMIN không
  const groupsResponse = await cognitoClient.send(new AdminListGroupsForUserCommand({
    UserPoolId: poolId,
    Username: username,
  }));
  
  const groups = groupsResponse.Groups?.map(g => g.GroupName) || [];
  if (groups.includes('ADMIN')) {
    throw new ForbiddenError('Cannot delete another admin');
  }

  // Xóa user
  try {
    await cognitoClient.send(new AdminDeleteUserCommand({
      UserPoolId: poolId,
      Username: username,
    }));
  } catch (err: any) {
    if (err.name === 'UserNotFoundException') {
      throw new NotFoundError('User not found');
    }
    throw err;
  }
};
