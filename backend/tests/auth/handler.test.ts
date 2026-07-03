import { mockClient } from 'aws-sdk-client-mock';
import { CognitoIdentityProviderClient, AdminAddUserToGroupCommand } from '@aws-sdk/client-cognito-identity-provider';
import { handlePostConfirmation } from '../../src/functions/auth/handler';
import { PostConfirmationEvent } from '../../src/functions/auth/types';

const cognitoMock = mockClient(CognitoIdentityProviderClient);

describe('Auth PostConfirmation Lambda', () => {
  beforeEach(() => {
    cognitoMock.reset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should add new user to STUDENT group and return event', async () => {
    cognitoMock.on(AdminAddUserToGroupCommand).resolves({});

    const mockEvent: PostConfirmationEvent = {
      version: '1',
      region: 'ap-southeast-1',
      userPoolId: 'pool-123',
      userName: 'new-user',
      callerContext: { awsSdkVersion: 'aws-sdk-js-2.1213.0', clientId: 'client-123' },
      request: { userAttributes: { email: 'test@example.com' } },
      response: {}
    };

    const response = await handlePostConfirmation(mockEvent);

    expect(cognitoMock.calls().length).toBe(1);
    const command = cognitoMock.calls()[0].args[0].input as any;
    expect(command.UserPoolId).toBe('pool-123');
    expect(command.Username).toBe('new-user');
    expect(command.GroupName).toBe('STUDENT');

    expect(response).toEqual(mockEvent); // Must return the original event
  });
});
