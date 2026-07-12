import * as crypto from 'crypto';
import * as repo from '../repositories/qrGeneratorRepository';
import { NotFoundError, ForbiddenError, BadRequestError } from '../shared/errors';
import { QrTokenItem, SessionStatus } from '../shared/models';

const QR_TTL_SECONDS = 60;

export const generateQrToken = async (sessionId: string, teacherId: string): Promise<{ token: string, expiresIn: number }> => {
  // 1. Verify session exists and is ACTIVE and belongs to the teacher
  const session = await repo.getSession(sessionId);
  if (!session) {
    throw new NotFoundError("Session not found");
  }

  if (session.teacherId !== teacherId) {
    throw new ForbiddenError("Forbidden: You are not the owner of this session");
  }

  if (session.status !== SessionStatus.ACTIVE) {
    throw new BadRequestError("Session is not active");
  }

  // 2. Fetch HMAC Secret (Will be cached in memory by repository)
  const secretKey = await repo.getHmacSecret();

  // 3. Generate HMAC-SHA256 Token
  const timestamp = Date.now();
  const payload = `${sessionId}:${timestamp}`;
  const token = crypto
    .createHmac('sha256', secretKey)
    .update(payload)
    .digest('hex');

  // 4. Save Token to DynamoDB with TTL
  const expiresAt = Math.floor(timestamp / 1000) + QR_TTL_SECONDS;
  const qrTokenItem: QrTokenItem = {
    token,
    sessionId,
    expiresAt,
  };

  await repo.saveQrToken(qrTokenItem);

  return {
    token,
    expiresIn: QR_TTL_SECONDS,
  };
};
