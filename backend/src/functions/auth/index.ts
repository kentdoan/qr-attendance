import { PostConfirmationEvent } from './types';
import { handlePostConfirmation } from './handler';

export const handler = async (event: PostConfirmationEvent): Promise<PostConfirmationEvent> => {
  return await handlePostConfirmation(event);
};
