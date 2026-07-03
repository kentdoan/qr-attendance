import { z } from 'zod';

export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

export interface SessionItem {
  sessionId: string;
  teacherId: string;
  className: string;
  createdAt: string; // ISO 8601
  expiresAt: string; // ISO 8601
  duration: number; // minutes
  status: SessionStatus;
}

// Validation schemas using Zod
export const CreateSessionBodySchema = z.object({
  className: z.string().min(2, "Tên lớp phải có ít nhất 2 ký tự"),
  duration: z.number().int().min(5, "Thời gian phải ít nhất 5 phút").max(180, "Thời gian tối đa là 180 phút"),
});

export type CreateSessionBody = z.infer<typeof CreateSessionBodySchema>;
