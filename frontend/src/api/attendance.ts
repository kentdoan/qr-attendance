// ============================================================================
// Attendance API service — phiên điểm danh, QR động, check-in, báo cáo.
// ============================================================================
import { api } from './client';
import { CheckinPayload, CheckinRecord, QrToken, ReportData, Session } from '../types';

export interface CreateSessionInput {
  teacherId: string;
  teacherName: string;
  title: string;
}

export const attendanceApi = {
  /** Danh sách phiên (giảng viên). */
  listSessions: () => api.get<Session[]>('/sessions'),

  /** Tạo phiên điểm danh mới. */
  createSession: (input: CreateSessionInput) => api.post<Session>('/sessions', input),

  /** Lấy QR token mới cho phiên (gọi lại mỗi 30s để đổi mã). */
  getQrToken: (sessionId: string) => api.get<QrToken>(`/sessions/${sessionId}/qr`),

  /** Sinh viên gửi điểm danh. */
  checkin: (payload: CheckinPayload) => api.post<CheckinRecord>('/checkin', payload),

  /** Báo cáo phiên (danh sách đã điểm danh) — dùng cho bảng realtime & export. */
  getReport: (sessionId: string) => api.get<ReportData>(`/sessions/${sessionId}/report`),

  /** Đóng phiên. */
  closeSession: (sessionId: string) =>
    api.patch<Session>(`/sessions/${sessionId}`, { isOpen: false }),
};
