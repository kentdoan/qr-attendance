import { z } from 'zod';

export const CreateSessionBodySchema = z.object({
  className: z.string().min(2, "Tên lớp phải có ít nhất 2 ký tự"),
  duration: z.number().int().min(5, "Thời gian phải ít nhất 5 phút").max(180, "Thời gian tối đa là 180 phút"),
});
export type CreateSessionBody = z.infer<typeof CreateSessionBodySchema>;

export const CheckinSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  sessionId: z.string().min(1, 'Session ID is required'),
  deviceFingerprint: z.string().min(1, 'Device Fingerprint is required'),
});
export type CheckinPayload = z.infer<typeof CheckinSchema>;

export const RoleAssignmentSchema = z.object({
  username: z.string().min(1, 'Username is required'),
});
export type RoleAssignmentPayload = z.infer<typeof RoleAssignmentSchema>;
