import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import * as crypto from 'crypto';
import * as repo from './repository';
import { QrTokenItem } from './types';

const QR_TTL_SECONDS = 60;

// Helper to extract teacherId
const getTeacherId = (event: APIGatewayProxyEventV2WithJWTAuthorizer): string => {
  const authorizer = event.requestContext.authorizer;
  if (!authorizer || !authorizer.jwt || !authorizer.jwt.claims) {
    throw new Error('Unauthorized: Missing JWT claims');
  }

  const groups = authorizer.jwt.claims['cognito:groups'] as string[] | undefined;
  if (!groups || !groups.includes('TEACHER')) {
    throw new Error('Forbidden: Caller is not a TEACHER');
  }

  return authorizer.jwt.claims.sub as string;
};

export const handleGenerateQR = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  const teacherId = getTeacherId(event);
  const sessionId = event.pathParameters?.sessionId;

  if (!sessionId) {
    return { statusCode: 400, body: JSON.stringify({ message: "Missing sessionId" }) };
  }

  // 1. Verify session exists and is ACTIVE and belongs to the teacher
  const session = await repo.getSession(sessionId);
  if (!session) {
    return { statusCode: 404, body: JSON.stringify({ message: "Session not found" }) };
  }

  if (session.teacherId !== teacherId) {
    return { statusCode: 403, body: JSON.stringify({ message: "Forbidden: You are not the owner of this session" }) };
  }

  if (session.status !== 'ACTIVE') {
    return { statusCode: 400, body: JSON.stringify({ message: "Session is not active" }) };
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
  return {
    statusCode: 200,
    body: JSON.stringify({
      token,
      expiresIn: QR_TTL_SECONDS,
    }),
  };
};
