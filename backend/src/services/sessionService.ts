import * as repo from '../repositories/sessionRepository';
import { SessionItem, SessionStatus } from '../shared/models';
import { NotFoundError, ForbiddenError } from '../shared/errors';
import { randomUUID } from 'crypto';

const validateSessionOwnership = async (sessionId: string, teacherId: string): Promise<SessionItem> => {
  const session = await repo.getSession(sessionId);
  if (!session) throw new NotFoundError('Session not found');
  if (session.teacherId !== teacherId) throw new ForbiddenError('You do not own this session');
  return session;
};

export const createSession = async (teacherId: string, className: string, duration: number): Promise<SessionItem> => {
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + duration * 60000);

  const session: SessionItem = {
    sessionId: randomUUID(),
    teacherId,
    className,
    duration,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: SessionStatus.ACTIVE,
  };

  await repo.createSession(session);
  return session;
};

export const getSession = async (sessionId: string, teacherId: string): Promise<SessionItem> => {
  return validateSessionOwnership(sessionId, teacherId);
};

export const deleteSession = async (sessionId: string, teacherId: string): Promise<void> => {
  await validateSessionOwnership(sessionId, teacherId);
  await repo.deleteSession(sessionId);
};

export const closeSession = async (sessionId: string, teacherId: string): Promise<void> => {
  await validateSessionOwnership(sessionId, teacherId);
  await repo.updateSessionStatus(sessionId, SessionStatus.CLOSED);
};
