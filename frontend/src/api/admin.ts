// ============================================================================
// Admin API service — quản lý người dùng & phân quyền.
// ============================================================================
import { api } from './client';
import { Role, User } from '../types';

export const adminApi = {
  /** Danh sách toàn bộ người dùng. */
  listUsers: () => api.get<User[]>('/users'),

  /** Cập nhật role và/hoặc trạng thái kích hoạt của user. */
  updateUser: (userId: string, body: { role?: Role; isActive?: boolean }) =>
    api.patch<User>(`/users/${userId}`, body),

  /** Cấp quyền giảng viên. */
  grantTeacher: (userId: string) =>
    api.patch<User>(`/users/${userId}`, { role: 'TEACHER', isActive: true }),

  /** Thu hồi quyền giảng viên (hạ về sinh viên). */
  revokeTeacher: (userId: string) =>
    api.patch<User>(`/users/${userId}`, { role: 'STUDENT', isActive: true }),
};
