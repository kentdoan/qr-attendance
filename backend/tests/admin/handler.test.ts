import { mockClient } from 'aws-sdk-client-mock';
import { CognitoIdentityProviderClient, AdminAddUserToGroupCommand, AdminRemoveUserFromGroupCommand, AdminUpdateUserAttributesCommand, ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider';
import { handler } from '../../src/indexes/adminIndex';
import { createMockEvent } from '../session/eventFactory';

const cognitoMock = mockClient(CognitoIdentityProviderClient);

describe('Admin Lambda Handler', () => {
  beforeEach(() => {
    cognitoMock.reset();
    process.env.USER_POOL_ID = 'pool-123';
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 403 if caller is not ADMIN', async () => {
    const event = createMockEvent({
      method: 'GET',
      path: '/admin/users',
      groups: ['TEACHER'], // Forbidden
    });

    const response = await handler(event);
    expect(response.statusCode).toBe(403);
    expect(JSON.parse(response.body!).message).toBe('Forbidden: Caller is not a ADMIN');
  });

  it('should list users if caller is ADMIN', async () => {
    cognitoMock.on(ListUsersCommand).resolves({
      Users: [
        { Username: 'user1', UserStatus: 'CONFIRMED' }
      ]
    });

    const event = createMockEvent({
      method: 'GET',
      path: '/admin/users',
      groups: ['ADMIN'],
    });

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body!);
    expect(body.users.length).toBe(1);
    expect(body.users[0].username).toBe('user1');
  });

  it('should assign TEACHER role', async () => {
    cognitoMock.on(AdminAddUserToGroupCommand).resolves({});
    cognitoMock.on(AdminUpdateUserAttributesCommand).resolves({});
    cognitoMock.on(AdminRemoveUserFromGroupCommand).resolves({});

    const event = createMockEvent({
      method: 'POST',
      path: '/admin/assign-teacher',
      groups: ['ADMIN'],
      body: JSON.stringify({ username: 'user2' })
    });

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    
    expect(cognitoMock.calls().length).toBe(3); // AddUserToGroup + UpdateUserAttributes + RemoveUserFromGroup
    const input = cognitoMock.calls()[0].args[0].input as any;
    expect(input.GroupName).toBe('TEACHER');
    expect(input.Username).toBe('user2');
  });

  it('should revoke TEACHER role', async () => {
    cognitoMock.on(AdminRemoveUserFromGroupCommand).resolves({});
    cognitoMock.on(AdminUpdateUserAttributesCommand).resolves({});
    cognitoMock.on(AdminAddUserToGroupCommand).resolves({});

    const event = createMockEvent({
      method: 'POST',
      path: '/admin/revoke-teacher',
      groups: ['ADMIN'],
      body: JSON.stringify({ username: 'user3' })
    });

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    
    expect(cognitoMock.calls().length).toBe(3); // RemoveUserFromGroup + UpdateUserAttributes + AddUserToGroup
    const input = cognitoMock.calls()[0].args[0].input as any;
    expect(input.GroupName).toBe('TEACHER');
    expect(input.Username).toBe('user3');
  });
});
