export interface AttendanceRecord {
  studentId: string;
  checkinTime: number;
}

export interface ReportResponse {
  sessionId: string;
  totalAttendees: number;
  attendees: AttendanceRecord[];
}
