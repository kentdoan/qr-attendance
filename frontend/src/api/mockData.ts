// ============================================================================
// Mock data + mock API router
// Kích hoạt khi VITE_USE_MOCK_API === 'true' để dev frontend không cần backend.
// ============================================================================
import {
  ApiResponse,
  CheckinRecord,
  CheckinStatus,
  QrToken,
  ReportData,
  Role,
  Session,
  User,
} from '../types';

// ---- Users giả lập (mật khẩu mock: "123456" cho tất cả) ----
export const MOCK_PASSWORD = '123456';

export const mockUsers: User[] = [
  {
    id: 'u-student-1',
    fullName: 'Nguyễn Văn Sinh',
    email: 'student@demo.com',
    role: 'STUDENT',
    isActive: true,
    createdAt: '2026-06-15T08:00:00.000Z',
  },
  {
    id: 'u-teacher-1',
    fullName: 'Trần Thị Giảng',
    email: 'teacher@demo.com',
    role: 'TEACHER',
    isActive: true,
    createdAt: '2026-06-15T08:00:00.000Z',
  },
  {
    id: 'u-admin-1',
    fullName: 'Lê Quản Trị',
    email: 'admin@demo.com',
    role: 'ADMIN',
    isActive: true,
    createdAt: '2026-06-15T08:00:00.000Z',
  },
  {
    id: 'u-student-2',
    fullName: 'Phạm Thị Hoa',
    email: 'hoa@demo.com',
    role: 'STUDENT',
    isActive: true,
    createdAt: '2026-06-16T08:00:00.000Z',
  },
  {
    id: 'u-teacher-2',
    fullName: 'Võ Văn Thầy',
    email: 'thay2@demo.com',
    role: 'TEACHER',
    isActive: false, // chờ ADMIN kích hoạt quyền giảng viên
    createdAt: '2026-06-16T08:00:00.000Z',
  },
];

// ---- Sessions giả lập ----
export const mockSessions: Session[] = [
  {
    id: 's-1',
    teacherId: 'u-teacher-1',
    teacherName: 'Trần Thị Giảng',
    title: 'Nhập môn Điện toán đám mây - Buổi 1',
    isOpen: true,
    createdAt: '2026-07-20T01:00:00.000Z',
  },
];

// ---- Checkin records giả lập ----
export const mockCheckins: CheckinRecord[] = [
  {
    id: 'c-1',
    sessionId: 's-1',
    studentId: 'u-student-1',
    studentName: 'Nguyễn Văn Sinh',
    studentEmail: 'student@demo.com',
    deviceFingerprint: 'fp-demo-abc123',
    status: CheckinStatus.SUCCESS,
    checkinAt: '2026-07-20T01:05:00.000Z',
  },
];

/** Sinh 1 QR token động (mặc định sống 30 giây). */
export function generateMockQrToken(sessionId: string, ttlSeconds = 30): QrToken {
  const now = Date.now();
  const rand = Math.random().toString(36).slice(2, 10);
  return {
    sessionId,
    token: `${sessionId}.${now}.${rand}`,
    issuedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + ttlSeconds * 1000).toISOString(),
    ttlSeconds,
  };
}

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));

function ok<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message };
}
function fail(message: string, errorCode?: string): ApiResponse<never> {
  return { success: false, message, errorCode };
}

/**
 * Router mock đơn giản: nhận (method, url, body) và trả ApiResponse.
 * client.ts sẽ gọi hàm này khi cờ mock bật.
 */
export async function mockApi<T = unknown>(
  method: string,
  url: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  await delay();
  const m = method.toUpperCase();

  // --- Sessions ---
  if (m === 'GET' && url === '/sessions') {
    return ok(mockSessions) as ApiResponse<T>;
  }
  if (m === 'POST' && url === '/sessions') {
    const payload = body as { teacherId: string; teacherName: string; title: string };
    const session: Session = {
      id: `s-${mockSessions.length + 1}`,
      teacherId: payload.teacherId,
      teacherName: payload.teacherName,
      title: payload.title,
      isOpen: true,
      createdAt: new Date().toISOString(),
    };
    mockSessions.push(session);
    return ok(session, 'Đã tạo phiên điểm danh') as ApiResponse<T>;
  }

  // --- Đóng phiên (giảng viên) ---
  if (m === 'PATCH' && url.startsWith('/sessions/') && !url.endsWith('/qr')) {
    const sessionId = url.split('/')[2];
    const session = mockSessions.find((s) => s.id === sessionId);
    if (!session) return fail('Phiên không tồn tại') as ApiResponse<T>;
    const payload = body as { isOpen?: boolean };
    if (typeof payload?.isOpen === 'boolean') {
      session.isOpen = payload.isOpen;
      if (!payload.isOpen) session.closedAt = new Date().toISOString();
    }
    return ok(session, 'Đã cập nhật phiên') as ApiResponse<T>;
  }

  // --- QR token động (giảng viên gọi mỗi 30s) ---
  if (m === 'GET' && url.startsWith('/sessions/') && url.endsWith('/qr')) {
    const sessionId = url.split('/')[2];
    return ok(generateMockQrToken(sessionId)) as ApiResponse<T>;
  }

  // --- Check-in (sinh viên) ---
  if (m === 'POST' && url === '/checkin') {
    const payload = body as {
      sessionId: string;
      qrToken: string;
      deviceFingerprint: string;
    };
    const session = mockSessions.find((s) => s.id === payload.sessionId);
    if (!session) return fail('Phiên không tồn tại', CheckinStatus.INVALID) as ApiResponse<T>;
    if (!session.isOpen)
      return fail('Phiên đã đóng', CheckinStatus.SESSION_CLOSED) as ApiResponse<T>;

    // Kiểm tra hết hạn dựa trên timestamp trong token mock.
    const parts = payload.qrToken.split('.');
    const issued = Number(parts[1]);
    if (!issued || Date.now() - issued > 30_000) {
      return fail('Mã QR đã hết hạn', CheckinStatus.EXPIRED) as ApiResponse<T>;
    }

    const record: CheckinRecord = {
      id: `c-${mockCheckins.length + 1}`,
      sessionId: payload.sessionId,
      studentId: 'u-student-1',
      studentName: 'Nguyễn Văn Sinh',
      studentEmail: 'student@demo.com',
      deviceFingerprint: payload.deviceFingerprint,
      status: CheckinStatus.SUCCESS,
      checkinAt: new Date().toISOString(),
    };
    mockCheckins.push(record);
    return ok(record, 'Điểm danh thành công') as ApiResponse<T>;
  }

  // --- Report của 1 phiên ---
  if (m === 'GET' && url.startsWith('/sessions/') && url.endsWith('/report')) {
    const sessionId = url.split('/')[2];
    const session = mockSessions.find((s) => s.id === sessionId);
    if (!session) return fail('Phiên không tồn tại') as ApiResponse<T>;
    const records = mockCheckins.filter((c) => c.sessionId === sessionId);
    const report: ReportData = {
      session,
      records,
      totalCheckedIn: records.length,
      generatedAt: new Date().toISOString(),
    };
    return ok(report) as ApiResponse<T>;
  }

  // --- ADMIN: danh sách user ---
  if (m === 'GET' && url === '/users') {
    return ok(mockUsers) as ApiResponse<T>;
  }
  // --- ADMIN: cập nhật role / kích hoạt ---
  if (m === 'PATCH' && url.startsWith('/users/')) {
    const userId = url.split('/')[2];
    const payload = body as { role?: Role; isActive?: boolean };
    const user = mockUsers.find((u) => u.id === userId);
    if (!user) return fail('Không tìm thấy user') as ApiResponse<T>;
    if (payload.role) user.role = payload.role;
    if (typeof payload.isActive === 'boolean') user.isActive = payload.isActive;
    return ok(user, 'Đã cập nhật quyền') as ApiResponse<T>;
  }

  return fail(`Mock API chưa hỗ trợ: ${m} ${url}`, 'NOT_IMPLEMENTED') as ApiResponse<T>;
}
