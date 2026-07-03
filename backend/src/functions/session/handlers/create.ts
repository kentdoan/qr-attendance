import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import * as repo from '../repository';
import { CreateSessionBodySchema, SessionItem, SessionStatus } from '../types';
import { getTeacherId } from '../../../shared/permissions';
import { Responses } from '../../../shared/response';
import { randomUUID } from 'crypto';

export const handleCreateSession = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  const teacherId = getTeacherId(event);

  if (!event.body) {
    return Responses.badRequest("Missing request body");
  }

  const payload = JSON.parse(event.body);
  const parsed = CreateSessionBodySchema.safeParse(payload);
  
  if (!parsed.success) {
    return Responses.badRequest("Invalid payload", parsed.error.errors);
  }

  const duration = parsed.data.duration;
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + duration * 60000);

  const session: SessionItem = {
    sessionId: randomUUID(),
    teacherId,
    className: parsed.data.className,
    duration,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: SessionStatus.ACTIVE,
  };

  await repo.createSession(session);
  return Responses.success({ message: "Session created successfully", session });
};
