import * as repo from '../repositories/checkinRepository';
import { Logger } from '../shared/logger';
import { BadRequestError, ConflictError } from '../shared/errors';
import { AttendanceItem } from '../shared/models';

export const processCheckin = async (studentId: string, token: string, sessionId: string, deviceFingerprint: string): Promise<AttendanceItem> => {
    // 1. Verify Token exists
    const qrToken = await repo.getQrToken(token);
    if (!qrToken) {
        throw new BadRequestError("Invalid or expired QR code");
    }

    // 2. Verify token matches the session
    if (qrToken.sessionId !== sessionId) {
        throw new BadRequestError("QR code does not match this session");
    }

    // 3. Check Idempotency (has student already checked in?)
    const alreadyCheckedIn = await repo.checkAttendanceExist(sessionId, studentId);
    if (alreadyCheckedIn) {
        throw new ConflictError("You have already checked in for this session");
    }

    // 4. Save Attendance
    const attendance: AttendanceItem = {
        sessionId,
        studentId,
        checkinTime: Date.now(),
        deviceFingerprint,
    };
    await repo.saveAttendance(attendance);

    // 5. Delete Token immediately to prevent reuse
    await repo.deleteQrToken(token);

    return attendance;
};
