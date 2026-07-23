import * as repo from '../repositories/sessionRepository';
import * as courseRepo from '../repositories/courseRepository';
import { SessionItem, SessionStatus } from '../shared/models';
import { NotFoundError, ForbiddenError, BadRequestError } from '../shared/errors';
import { randomUUID } from 'crypto';

const validateSessionOwnership = async (sessionId: string, teacherId: string): Promise<SessionItem> => {
  const session = await repo.getSession(sessionId);
  if (!session) throw new NotFoundError('Session not found');
  if (session.teacherId !== teacherId) throw new ForbiddenError('You do not own this session');

  if (session.status === SessionStatus.ACTIVE && new Date() > new Date(session.expiresAt)) {
    await repo.updateSessionStatus(sessionId, SessionStatus.CLOSED);
    session.status = SessionStatus.CLOSED;
  }

  return session;
};

export const createSession = async (
  teacherId: string,
  teacherName: string,
  teacherSchool: string,
  teacherFaculty: string,
  courseId: string,
  className: string, // fallback 
  duration: number
): Promise<SessionItem> => {
  let courseName = className;
  let courseCode = undefined;
  
  if (courseId) {
    const course = await courseRepo.getCourse(courseId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }
    if (course.teacherId !== teacherId) {
      throw new ForbiddenError('You do not own this course');
    }
    courseName = course.courseName;
    courseCode = course.courseCode;
  }

  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + duration * 60000);

  const session: SessionItem = {
    sessionId: randomUUID(),
    teacherId,
    teacherName,
    teacherSchool,
    teacherFaculty,
    courseId,
    courseName,
    courseCode,
    className: courseName, // Fallback for backwards compatibility
    duration,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: SessionStatus.ACTIVE,
  };

  await repo.createSession(session);
  return session;
};

export const getListSessions = async (teacherId: string): Promise<SessionItem[]> => {
  return await repo.getListSessions(teacherId);
};

export const getSession = async (sessionId: string, teacherId: string): Promise<SessionItem> => {
  return validateSessionOwnership(sessionId, teacherId);
};

export const deleteSession = async (sessionId: string, teacherId: string): Promise<void> => {
  await validateSessionOwnership(sessionId, teacherId);
  await repo.deleteSession(sessionId);
};

export const closeSession = async (sessionId: string, teacherId: string): Promise<void> => {
  const session = await validateSessionOwnership(sessionId, teacherId);
  if (session.status === SessionStatus.CLOSED) {
    throw new BadRequestError('Session is already closed');
  }
  await repo.updateSessionStatus(sessionId, SessionStatus.CLOSED);
};
