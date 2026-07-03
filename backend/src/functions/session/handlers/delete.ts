import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import * as repo from '../repository';
import { getTeacherId } from '../../../shared/permissions';
import { Responses } from '../../../shared/response';

export const handleDeleteSession = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  const teacherId = getTeacherId(event);
  const sessionId = event.pathParameters?.sessionId;

  if (!sessionId) return Responses.badRequest("Missing sessionId parameter");

  const session = await repo.getSession(sessionId);

  if (!session) return Responses.notFound("Session not found");
  if (session.teacherId !== teacherId) return Responses.forbidden("You do not own this session");

  await repo.deleteSession(sessionId);
  return Responses.success({ message: "Session deleted successfully" });
};
