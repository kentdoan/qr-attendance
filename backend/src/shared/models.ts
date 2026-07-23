export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

export interface CourseItem {
  courseId: string;
  teacherId: string;
  courseName: string;
  courseCode: string;
  createdAt: string; // ISO 8601
}

export interface SessionItem {
  sessionId: string;
  teacherId: string;
  teacherName?: string;
  teacherSchool?: string;
  teacherFaculty?: string;
  courseId: string;
  courseName: string;
  courseCode?: string;
  className?: string; // Tương thích ngược
  createdAt: string; // ISO 8601
  expiresAt: string; // ISO 8601
  duration: number; // minutes
  status: SessionStatus;
}

export interface QrTokenItem {
  token: string;
  sessionId: string;
  expiresAt: number; // Unix timestamp in seconds
}

export interface AttendanceItem {
  sessionId: string;
  studentId: string;
  studentName?: string;
  studentSchool?: string;
  studentFaculty?: string;
  studentMajor?: string;
  checkinTime: number; // Unix timestamp
  deviceFingerprint: string;
  
  // Denormalized session info
  className?: string;
  courseId?: string;
  courseName?: string;
  sessionCreatedAt?: string;
  teacherName?: string;
  teacherSchool?: string;
  teacherFaculty?: string;
}

export interface AttendanceRecord {
  studentId: string;
  studentName?: string;
  studentSchool?: string;
  studentFaculty?: string;
  studentMajor?: string;
  checkinTime: number;
  deviceFingerprint: string;
}

export interface ReportResponse {
  sessionId: string;
  totalAttendees: number;
  attendees: AttendanceRecord[];
}

export interface PostConfirmationEvent {
  version: string;
  region: string;
  userPoolId: string;
  userName: string;
  callerContext: {
    awsSdkVersion: string;
    clientId: string;
  };
  request: {
    userAttributes: {
      [key: string]: string;
    };
  };
  response: Record<string, unknown>;
}
