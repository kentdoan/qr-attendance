import { randomUUID } from 'crypto';
import * as repo from '../repositories/courseRepository';
import { CourseItem } from '../shared/models';
import { ForbiddenError, NotFoundError, ConflictError } from '../shared/errors';

export const createCourse = async (teacherId: string, courseName: string, courseCode: string): Promise<CourseItem> => {
  // Check for duplicates
  const existingCourses = await repo.listCoursesByTeacher(teacherId);
  for (const c of existingCourses) {
    if (c.courseCode.toLowerCase() === courseCode.toLowerCase()) {
      throw new ConflictError(`Mã môn học '${courseCode}' đã tồn tại.`);
    }
    if (c.courseName.toLowerCase() === courseName.toLowerCase()) {
      throw new ConflictError(`Tên môn học '${courseName}' đã tồn tại.`);
    }
  }

  const courseId = randomUUID();
  const course: CourseItem = {
    courseId,
    teacherId,
    courseName,
    courseCode,
    createdAt: new Date().toISOString(),
  };
  await repo.saveCourse(course);
  return course;
};

export const getListCourses = async (teacherId: string): Promise<CourseItem[]> => {
  return await repo.listCoursesByTeacher(teacherId);
};

export const deleteCourse = async (courseId: string, teacherId: string): Promise<void> => {
  const course = await repo.getCourse(courseId);
  if (!course) {
    throw new NotFoundError("Course not found");
  }
  if (course.teacherId !== teacherId) {
    throw new ForbiddenError("You don't have permission to delete this course");
  }
  await repo.deleteCourse(courseId);
};
