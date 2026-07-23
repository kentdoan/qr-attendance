import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { getTeacherId } from '../shared/permissions';
import { Responses } from '../shared/response';
import { errorHandler } from '../shared/errors';
import { CreateCourseBodySchema } from '../shared/schemas';
import * as courseService from '../services/courseService';

export const handleCreateCourse = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  try {
    const teacherId = getTeacherId(event);
    if (!event.body) return Responses.badRequest("Missing request body");

    const payload = JSON.parse(event.body);
    const parsed = CreateCourseBodySchema.safeParse(payload);
    
    if (!parsed.success) return Responses.badRequest("Invalid payload", parsed.error.errors);

    const course = await courseService.createCourse(teacherId, parsed.data.courseName, parsed.data.courseCode);
    return Responses.created({ message: "Course created successfully", course });
  } catch (error: any) {
    return errorHandler(error);
  }
};

export const handleGetListCourses = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  try {
    const teacherId = getTeacherId(event);
    const courses = await courseService.getListCourses(teacherId);
    return Responses.success({
      total: courses.length,
      courses,
    });
  } catch (error: any) {
    return errorHandler(error);
  }
};

export const handleDeleteCourse = async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
  try {
    const teacherId = getTeacherId(event);
    const courseId = event.pathParameters?.courseId;
    if (!courseId) return Responses.badRequest("Missing courseId parameter");

    await courseService.deleteCourse(courseId, teacherId);
    return Responses.success({ message: "Course deleted successfully" });
  } catch (error: any) {
    return errorHandler(error);
  }
};
