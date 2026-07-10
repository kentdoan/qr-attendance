import { Logger } from '../shared/logger';
import { PostConfirmationEvent } from '../shared/models';
import * as authService from '../services/authService';

export const handlePostConfirmation = async (event: PostConfirmationEvent): Promise<PostConfirmationEvent> => {
  try {
    const userPoolId = event.userPoolId;
    const userName = event.userName;

    await authService.assignDefaultStudentRole(userPoolId, userName);

  } catch (error) {
    Logger.error('Error adding user to group:', error);
    // Even if it fails, we should return the event so the signup process doesn't completely block
  }

  // Return the event to Cognito to allow the workflow to proceed
  return event;
};
