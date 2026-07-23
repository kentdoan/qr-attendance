import * as repo from '../repositories/reportRepository';
import { ReportResponse } from '../shared/models';
import { NotFoundError, ForbiddenError } from '../shared/errors';

export const getReport = async (sessionId: string, teacherId: string): Promise<ReportResponse> => {
  const sessionOwner = await repo.getSessionOwner(sessionId);
  if (!sessionOwner) {
    throw new NotFoundError('Session not found');
  }

  if (sessionOwner !== teacherId) {
    throw new ForbiddenError('You do not own this session');
  }

  const attendanceRecords = await repo.getAttendanceReport(sessionId);

  return {
    sessionId,
    totalAttendees: attendanceRecords.length,
    attendees: attendanceRecords.map(record => ({
      studentId: record.studentId,
      studentName: record.studentName,
      studentSchool: record.studentSchool,
      studentFaculty: record.studentFaculty,
      studentMajor: record.studentMajor,
      checkinTime: record.checkinTime,
      deviceFingerprint: record.deviceFingerprint,
    })),
  };
};
