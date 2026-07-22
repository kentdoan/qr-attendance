// ============================================================================
// Attendance API service — phiên điểm danh, QR động, check-in, báo cáo.
// ============================================================================
import { api } from "./client";

export const attendanceApi = {
  /** Danh sách phiên (giảng viên). */
  listSessions: async () => {
    const res = await api.get("/sessions");
    if (res.success && Array.isArray(res.data)) {
      const mapped = res.data.map(s => ({
        id: s.sessionId,
        title: s.className,
        isOpen: s.status === "ACTIVE",
        ...s
      }));
      return { ...res, data: mapped };
    }
    return res;
  },

  /** Tạo phiên điểm danh mới. */
  createSession: async (input) => {
    const res = await api.post("/sessions", input);
    if (res.success && res.data?.session) {
      const s = res.data.session;
      const mapped = {
        id: s.sessionId,
        title: s.className,
        isOpen: s.status === "ACTIVE",
        ...s
      };
      return { ...res, data: mapped };
    }
    return res;
  },

  /** Lấy QR token mới cho phiên (gọi lại mỗi 30s để đổi mã). */
  getQrToken: async (sessionId) => {
    const res = await api.get(`/sessions/${sessionId}/qr`);
    if (res.success && res.data) {
      // Đảm bảo có sessionId để component mã hoá vào QR
      return { ...res, data: { ...res.data, sessionId } };
    }
    return res;
  },

  /** Sinh viên gửi điểm danh. */
  checkin: async (payload) => {
    const res = await api.post("/checkin", payload);
    if (res.success && res.data?.attendance) {
      const a = res.data.attendance;
      const mapped = {
        id: a.studentId, // dummy id
        studentName: a.studentName,
        checkinAt: new Date(a.checkinTime).toISOString(),
      };
      return { ...res, data: mapped };
    }
    return res;
  },

  /** Báo cáo phiên (danh sách đã điểm danh) — dùng cho bảng realtime & export. */
  getReport: async (sessionId) => {
    const res = await api.get(`/sessions/${sessionId}/report`);
    if (res.success && res.data) {
      // Map attendees to records
      const mapped = {
        ...res.data,
        records: (res.data.attendees || []).map(a => ({
          id: a.studentId, // just for react key
          studentName: a.studentName,
          checkinAt: new Date(a.checkinTime).toISOString()
        }))
      };
      return { ...res, data: mapped };
    }
    return res;
  },

  /** Đóng phiên. */
  closeSession: (sessionId) =>
    api.patch(`/sessions/${sessionId}/close`),
};

