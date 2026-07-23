import { api } from "./client";

export const adminApi = {
  listUsers: async () => {
    const res = await api.get("/admin/users");
    if (res.success && res.data?.users) {
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

  updateUser: (userId, body) => api.patch(`/admin/users/${userId}`, body),

  grantTeacher: async (user) => {
    const res = await api.post(`/admin/assign-teacher`, { username: user.id });
    if (res.success) {
      return { ...res, data: { ...user, role: "TEACHER" } };
    }
    return res;
  },

  revokeTeacher: async (user) => {
    const res = await api.post(`/admin/revoke-teacher`, { username: user.id });
    if (res.success) {
      return { ...res, data: { ...user, role: "STUDENT" } };
    }
    return res;
  },

  deleteUser: (username) => api.delete(`/admin/users/${username}`),
};

