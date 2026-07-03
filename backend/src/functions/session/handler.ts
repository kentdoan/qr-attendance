import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import {
  CreateSessionBodySchema,
  SessionItem,
  SessionStatus,
} from './types';
import * as repo from './repository';

// Helper to extract teacherId from JWT claims (Cognito Authorizer)
const getTeacherId = (event: APIGatewayProxyEventV2WithJWTAuthorizer): string => {
  const authorizer = event.requestContext.authorizer;
  if (!authorizer || !authorizer.jwt || !authorizer.jwt.claims) {
    throw new Error('Unauthorized: Missing JWT claims');
  }
  
  // Checking if caller is TEACHER
  const groups = authorizer.jwt.claims['cognito:groups'] as string[] | undefined;
  if (!groups || !groups.includes('TEACHER')) {
    throw new Error('Forbidden: Caller is not a TEACHER');
  }

  return authorizer.jwt.claims.sub as string;
};

// POST /sessions
export const handleCreateSession = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  const teacherId = getTeacherId(event);
  
  if (!event.body) {
    return { statusCode: 400, body: JSON.stringify({ message: "Missing body" }) };
  }

  // Parse & Validate using Zod
  let parsedBody;
  try {
    parsedBody = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ message: "Invalid JSON" }) };
  }

  const validationResult = CreateSessionBodySchema.safeParse(parsedBody);
  if (!validationResult.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({ 
        message: "Validation Error", 
        errors: validationResult.error.errors 
      }),
    };
  }

  const { className, duration } = validationResult.data;
  const sessionId = uuidv4();
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + duration * 60000);

  const newSession: SessionItem = {
    sessionId,
    teacherId,
    className,
    duration,
    status: SessionStatus.ACTIVE,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  await repo.createSession(newSession);

  return {
    statusCode: 201,
    body: JSON.stringify(newSession),
  };
};

// GET /sessions/{sessionId}
export const handleGetSession = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  const sessionId = event.pathParameters?.sessionId;
  if (!sessionId) {
    return { statusCode: 400, body: JSON.stringify({ message: "Missing sessionId" }) };
  }

  const session = await repo.getSession(sessionId);
  if (!session) {
    return { statusCode: 404, body: JSON.stringify({ message: "Session not found" }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(session),
  };
};

// PATCH /sessions/{sessionId}/close
export const handleCloseSession = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  const teacherId = getTeacherId(event);
  const sessionId = event.pathParameters?.sessionId;
  if (!sessionId) {
    return { statusCode: 400, body: JSON.stringify({ message: "Missing sessionId" }) };
  }

  const session = await repo.getSession(sessionId);
  if (!session) {
    return { statusCode: 404, body: JSON.stringify({ message: "Session not found" }) };
  }

  // Verify ownership
  if (session.teacherId !== teacherId) {
    return { statusCode: 403, body: JSON.stringify({ message: "Forbidden: You are not the owner of this session" }) };
  }

  await repo.updateSessionStatus(sessionId, SessionStatus.CLOSED);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Session closed successfully" }),
  };
};

// DELETE /sessions/{sessionId}
export const handleDeleteSession = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  const teacherId = getTeacherId(event);
  const sessionId = event.pathParameters?.sessionId;
  if (!sessionId) {
    return { statusCode: 400, body: JSON.stringify({ message: "Missing sessionId" }) };
  }

  const session = await repo.getSession(sessionId);
  if (!session) {
    return { statusCode: 404, body: JSON.stringify({ message: "Session not found" }) };
  }

  // Verify ownership
  if (session.teacherId !== teacherId) {
    return { statusCode: 403, body: JSON.stringify({ message: "Forbidden: You are not the owner of this session" }) };
  }

  await repo.deleteSession(sessionId);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Session deleted successfully" }),
  };
};
