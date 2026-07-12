export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

export interface SessionItem {
  sessionId: string;
  teacherId: string;
  className: string;
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
  checkinTime: number; // Unix timestamp
  deviceFingerprint: string;
}

export interface AttendanceRecord {
  studentId: string;
  checkinTime: number;
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
  response: {};
}
