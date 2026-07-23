import * as repo from '../repositories/checkinRepository';
import * as sessionRepo from '../repositories/sessionRepository';
import { BadRequestError, ConflictError, NotFoundError } from '../shared/errors';
import { AttendanceItem, SessionStatus } from '../shared/models';

export const processCheckin = async (
    studentId: string, 
    studentName: string, 
    studentSchool: string,
    studentFaculty: string,
    studentMajor: string,
    token: string, 
    sessionId: string, 
    deviceFingerprint: string
): Promise<AttendanceItem> => {
    // 1. Check Idempotency (has student already checked in?)
    const alreadyCheckedIn = await repo.checkAttendanceExist(sessionId, studentId);
    if (alreadyCheckedIn) {
        throw new ConflictError("You have already checked in for this session");
    }

    // 2. Verify Token exists
    const qrToken = await repo.getQrToken(token);
    if (!qrToken) {
        throw new BadRequestError("Invalid or expired QR code");
    }

    // 3. Verify token matches the session
    if (qrToken.sessionId !== sessionId) {
        throw new BadRequestError("QR code does not match this session");
    }

    // 4. Verify session is still ACTIVE and not expired (UC-F04)
    const session = await sessionRepo.getSession(sessionId);
    if (!session) {
        throw new NotFoundError("Session not found");
    }
    const isExpired = new Date() > new Date(session.expiresAt);
    if (session.status === SessionStatus.CLOSED || isExpired) {
        throw new BadRequestError("SESSION_CLOSED");
    }

    // 4. Save Attendance
    const attendance: AttendanceItem = {
        sessionId,
        studentId,
        studentName,
        studentSchool,
        studentFaculty,
        studentMajor,
        checkinTime: Date.now(),
        deviceFingerprint,
        
        className: session.className, // Fallback
        courseId: session.courseId,
        courseName: session.courseName,
        sessionCreatedAt: session.createdAt,
        teacherName: session.teacherName,
        teacherSchool: session.teacherSchool,
        teacherFaculty: session.teacherFaculty,
    };
    await repo.saveAttendance(attendance);

    // 5. Delete Token immediately to prevent reuse
    await repo.deleteQrToken(token);

    return attendance;
};

export const getStudentHistory = async (studentId: string): Promise<Partial<AttendanceItem>[]> => {
    const history = await repo.listAttendanceByStudent(studentId);
    return history.map(item => ({
        sessionId: item.sessionId,
        checkinTime: item.checkinTime,
        className: item.className,
        courseId: item.courseId,
        courseName: item.courseName,
        sessionCreatedAt: item.sessionCreatedAt,
        teacherName: item.teacherName,
        teacherSchool: item.teacherSchool,
        teacherFaculty: item.teacherFaculty
    }));
};
