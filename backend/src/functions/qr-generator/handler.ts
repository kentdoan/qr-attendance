import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import * as crypto from 'crypto';
import * as repo from './repository';
import { QrTokenItem } from './types';

const QR_TTL_SECONDS = 60;

import { getTeacherId } from '../../shared/permissions';
import { Responses } from '../../shared/response';

export const handleGenerateQR = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  const teacherId = getTeacherId(event);
  const sessionId = event.pathParameters?.sessionId;

  if (!sessionId) {
    return Responses.badRequest("Missing sessionId");
  }

  // 1. Verify session exists and is ACTIVE and belongs to the teacher
  const session = await repo.getSession(sessionId);
  if (!session) {
    return Responses.notFound("Session not found");
  }

  if (session.teacherId !== teacherId) {
    return Responses.forbidden("Forbidden: You are not the owner of this session");
  }

  if (session.status !== 'ACTIVE') {
    return Responses.badRequest("Session is not active");
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

  // 5. Return success
  return Responses.success({
    token,
    expiresIn: QR_TTL_SECONDS,
  });
};
