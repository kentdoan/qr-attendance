import { Logger } from '../../shared/logger';
import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import * as repo from './repository';
import { CheckinSchema, AttendanceItem } from './types';

import { getStudentId } from '../../shared/permissions';
import { Responses } from '../../shared/response';

export const handleCheckin = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  try {
    const studentId = getStudentId(event);
    
    if (!event.body) {
      return Responses.badRequest("Missing request body");
    }

    const payload = JSON.parse(event.body);
    const parsed = CheckinSchema.safeParse(payload);
    
    if (!parsed.success) {
      return Responses.badRequest("Invalid payload", parsed.error.errors);
    }

    const { token, sessionId, deviceFingerprint } = parsed.data;

    // 1. Verify Token exists (and is not expired, DynamoDB TTL handles expiration passively, 
    // but we can also check expiresAt if needed. For now, existence is enough).
    const qrToken = await repo.getQrToken(token);
    if (!qrToken) {
      return Responses.badRequest("Invalid or expired QR code");
    }

    // 2. Verify token matches the session
    if (qrToken.sessionId !== sessionId) {
      return Responses.badRequest("QR code does not match this session");
    }

    // 3. Check Idempotency (has student already checked in?)
    const alreadyCheckedIn = await repo.checkAttendanceExist(sessionId, studentId);
    if (alreadyCheckedIn) {
      return Responses.conflict("You have already checked in for this session");
    }

    // 4. Save Attendance
    const attendance: AttendanceItem = {
      sessionId,
      studentId,
      checkinTime: Date.now(),
      deviceFingerprint,
    };
    await repo.saveAttendance(attendance);

    // 5. Delete Token immediately to prevent reuse (Single-use QR mechanism)
    await repo.deleteQrToken(token);

    return Responses.success({
      message: "Check-in successful",
      attendance,
    });

  } catch (error: any) {
    // Để nguyên để checkin/index.ts handle catch bằng errorHandler
    throw error;
  }
};
