import { Logger } from '../../shared/logger';
import { CognitoIdentityProviderClient, AdminAddUserToGroupCommand } from '@aws-sdk/client-cognito-identity-provider';
import { PostConfirmationEvent } from './types';

const cognitoClient = new CognitoIdentityProviderClient({});

export const handlePostConfirmation = async (event: PostConfirmationEvent): Promise<PostConfirmationEvent> => {
  try {
    const userPoolId = event.userPoolId;
    const userName = event.userName;

    // Automatically add new users to STUDENT group
    const command = new AdminAddUserToGroupCommand({
      UserPoolId: userPoolId,
      Username: userName,
      GroupName: 'STUDENT',
    });

    await cognitoClient.send(command);
    Logger.info(`Successfully added user ${userName} to STUDENT group`);

  } catch (error) {
    Logger.error('Error adding user to group:', error);
    // Even if it fails, we should return the event so the signup process doesn't completely block
    // although in a real scenario we might want to trigger an alert.
  }

  // Return the event to Cognito to allow the workflow to proceed
  return event;
};
