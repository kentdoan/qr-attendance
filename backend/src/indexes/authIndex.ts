import { PostConfirmationEvent } from '../shared/models';
import { handlePostConfirmation } from '../handlers/authHandler';

export const handler = async (event: PostConfirmationEvent): Promise<PostConfirmationEvent> => {
  return await handlePostConfirmation(event);
};
