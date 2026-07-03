import { z } from 'zod';

export const CheckinSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  sessionId: z.string().min(1, 'Session ID is required'),
  deviceFingerprint: z.string().min(1, 'Device Fingerprint is required'),
});

export type CheckinPayload = z.infer<typeof CheckinSchema>;

export interface AttendanceItem {
  sessionId: string;
  studentId: string;
  checkinTime: number; // Unix timestamp
  deviceFingerprint: string;
}

// Re-using minimal QrTokenItem properties
export interface QrTokenItem {
  token: string;
  sessionId: string;
  expiresAt: number;
}
