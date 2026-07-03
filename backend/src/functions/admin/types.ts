import { z } from 'zod';

export const RoleAssignmentSchema = z.object({
  username: z.string().min(1, 'Username is required'),
});

export type RoleAssignmentPayload = z.infer<typeof RoleAssignmentSchema>;
