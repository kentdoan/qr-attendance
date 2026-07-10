import { CognitoIdentityProviderClient, AdminAddUserToGroupCommand, AdminUpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider';
import { Logger } from '../shared/logger';

const cognitoClient = new CognitoIdentityProviderClient({});

export const assignDefaultStudentRole = async (userPoolId: string, userName: string): Promise<void> => {
    // Automatically add new users to STUDENT group
    const command = new AdminAddUserToGroupCommand({
      UserPoolId: userPoolId,
      Username: userName,
      GroupName: 'STUDENT',
    });

    await cognitoClient.send(command);

    const updateAttrCommand = new AdminUpdateUserAttributesCommand({
      UserPoolId: userPoolId,
      Username: userName,
      UserAttributes: [
        {
          Name: 'custom:role',
          Value: 'STUDENT',
        },
      ],
    });

    await cognitoClient.send(updateAttrCommand);
    Logger.info(`Successfully added user ${userName} to STUDENT group and updated role attribute`);
};
