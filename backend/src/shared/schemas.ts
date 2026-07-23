import { z } from 'zod';

export const CreateSessionBodySchema = z.object({
  courseId: z.string().min(1, "Vui lòng chọn môn học"),
  className: z.string().optional(), // Tương thích ngược nếu cần
  duration: z.number().int().min(1, "Thời gian phải ít nhất 1 phút").max(180, "Thời gian tối đa là 180 phút"),
});
export type CreateSessionBody = z.infer<typeof CreateSessionBodySchema>;

export const CreateCourseBodySchema = z.object({
  courseName: z.string().min(2, "Tên môn học phải có ít nhất 2 ký tự"),
  courseCode: z.string().min(2, "Mã môn học phải có ít nhất 2 ký tự"),
});
export type CreateCourseBody = z.infer<typeof CreateCourseBodySchema>;

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
