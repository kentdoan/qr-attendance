// ============================================================================
// Admin API service — quản lý người dùng & phân quyền.
// ============================================================================
import { api } from "./client";

export const adminApi = {
  /** Danh sách toàn bộ người dùng. */
  listUsers: async () => {
    const res = await api.get("/admin/users");
    if (res.success && res.data?.users) {
      // Map Cognito format to UI format
      const mapped = res.data.users.map((u) => ({
        id: u.username,
        fullName: u.attributes?.name || u.attributes?.email || u.username,
        email: u.attributes?.email || "",
        role: u.attributes?.["custom:role"] || "STUDENT",
        isActive: u.status === "CONFIRMED",
        createdAt: u.created,
      }));
      return { ...res, data: mapped };
    }
    return res;
  },

  /** Cập nhật role và/hoặc trạng thái kích hoạt của user. (Không có trong backend chuẩn, giữ dự phòng) */
  updateUser: (userId, body) => api.patch(`/admin/users/${userId}`, body),

  /** Cấp quyền giảng viên. */
  grantTeacher: async (user) => {
    const res = await api.post(`/admin/assign-teacher`, { username: user.id });
    if (res.success) {
      return { ...res, data: { ...user, role: "TEACHER" } };
    }
    return res;
  },

  /** Thu hồi quyền giảng viên (hạ về sinh viên). */
  revokeTeacher: async (user) => {
    const res = await api.post(`/admin/revoke-teacher`, { username: user.id });
    if (res.success) {
      return { ...res, data: { ...user, role: "STUDENT" } };
    }
    return res;
  },
};

