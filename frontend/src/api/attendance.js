import { api } from "./client";

export const attendanceApi = {
  listSessions: async () => {
    const res = await api.get("/sessions");
    if (res.success && res.data && Array.isArray(res.data.sessions)) {
      const mapped = res.data.sessions.map(s => ({
        id: s.sessionId,
        title: s.className,
        isOpen: s.status === "ACTIVE",
        ...s
      }));
      return { ...res, data: mapped };
    }
    return res;
  },

  getMyAttendance: async () => {
    const res = await api.get("/my-attendance");
    if (res.success && res.data && Array.isArray(res.data.attendance)) {
      const mapped = res.data.attendance.map(a => ({
        id: `${a.sessionId}-${a.checkinTime}`,
        sessionId: a.sessionId,
        checkinAt: new Date(a.checkinTime).toISOString(),
        className: a.className,
        courseName: a.courseName,
        courseId: a.courseId,
        sessionCreatedAt: a.sessionCreatedAt,
        teacherName: a.teacherName,
        teacherSchool: a.teacherSchool,
        teacherFaculty: a.teacherFaculty,
      }));
      return { ...res, data: mapped };
    }
    return res;
  },

  createSession: async (input) => {
    const res = await api.post("/sessions", input);
    if (res.success && res.data?.session) {
      const s = res.data.session;
      const mapped = {
        id: s.sessionId,
        title: s.courseName || s.className,
        courseId: s.courseId,
        isOpen: s.status === "ACTIVE",
        ...s
      };
      return { ...res, data: mapped };
    }
    return res;
  },

  getQrToken: async (sessionId) => {
    const res = await api.get(`/sessions/${sessionId}/qr`);
    if (res.success && res.data) {
      return { ...res, data: { ...res.data, sessionId } };
    }
    return res;
  },

  checkin: async (payload) => {
    const res = await api.post("/checkin", payload);
    if (res.success && res.data?.attendance) {
      const a = res.data.attendance;
      const mapped = {
        id: a.studentId,
        studentName: a.studentName,
        checkinAt: new Date(a.checkinTime).toISOString(),
        courseName: a.courseName,
        className: a.className,
        teacherName: a.teacherName,
        checkinTime: a.checkinTime,
      };
      return { ...res, data: mapped };
    }
    return res;
  },

  getReport: async (sessionId) => {
    const res = await api.get(`/sessions/${sessionId}/report`);
    if (res.success && res.data) {
      const mapped = {
        ...res.data,
        records: (res.data.attendees || []).map(a => ({
          id: a.studentId,
          studentName: a.studentName,
          checkinAt: new Date(a.checkinTime).toISOString(),
          studentSchool: a.studentSchool,
          studentFaculty: a.studentFaculty,
          studentMajor: a.studentMajor,
        }))
      };
      return { ...res, data: mapped };
    }
    return res;
  },

  closeSession: (sessionId) =>
    api.patch(`/sessions/${sessionId}/close`),

  deleteSession: (sessionId) =>
    api.delete(`/sessions/${sessionId}`),

  listCourses: async () => {
    const res = await api.get("/courses");
    return res; // returns { success, data: { courses: [] } }
  },

  createCourse: async (courseData) => {
    const res = await api.post("/courses", courseData);
    return res;
  },

  deleteCourse: async (courseId) => {
    const res = await api.delete(`/courses/${courseId}`);
    return res;
  },
};

