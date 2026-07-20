// ============================================================================
// Dynamic QR Attendance System — Core TypeScript types
// ============================================================================

/** Vai trò người dùng trong hệ thống (khớp Cognito groups / custom:role). */
export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN';

/** Người dùng đã xác thực. */
export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  /** TEACHER được kích hoạt bởi ADMIN hay chưa (dùng cho luồng cấp/thu quyền). */
  isActive?: boolean;
  createdAt: string; // ISO string
}

/** Phiên điểm danh do giảng viên tạo. */
export interface Session {
  id: string;
  teacherId: string;
  teacherName: string;
  /** Tên môn học / buổi học. */
  title: string;
  /** Phiên còn đang mở nhận điểm danh hay không. */
  isOpen: boolean;
  createdAt: string;
  closedAt?: string;
}

/** Token QR động — đổi mỗi 30 giây. */
export interface QrToken {
  sessionId: string;
  /** Chuỗi mã hoá nhúng vào QR (nonce/JWT ngắn hạn). */
  token: string;
  issuedAt: string; // ISO
  expiresAt: string; // ISO — thường issuedAt + 30s
  /** Thời gian sống tính bằng giây (mặc định 30). */
  ttlSeconds: number;
}

/** Trạng thái kết quả điểm danh. */
export enum CheckinStatus {
  SUCCESS = 'SUCCESS',
  EXPIRED = 'EXPIRED', // Mã QR đã hết hạn
  INVALID = 'INVALID', // Mã QR không hợp lệ / sai phiên
  DUPLICATE_DEVICE = 'DUPLICATE_DEVICE', // Thiết bị đã điểm danh hộ người khác
  ALREADY_CHECKED_IN = 'ALREADY_CHECKED_IN', // Sinh viên đã điểm danh trong phiên
  SESSION_CLOSED = 'SESSION_CLOSED', // Phiên đã đóng
}

/** Payload sinh viên gửi lên `POST /checkin`. */
export interface CheckinPayload {
  sessionId: string;
  /** Token đọc được từ QR code. */
  qrToken: string;
  /** Device fingerprint lấy từ fingerprintjs. */
  deviceFingerprint: string;
}

/** Bản ghi một lượt điểm danh. */
export interface CheckinRecord {
  id: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  deviceFingerprint: string;
  status: CheckinStatus;
  checkinAt: string; // ISO
}

/** Dữ liệu báo cáo một phiên (dùng cho bảng danh sách & export Excel). */
export interface ReportData {
  session: Session;
  records: CheckinRecord[];
  totalCheckedIn: number;
  generatedAt: string;
}

/** Bao bọc phản hồi API chuẩn. */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  /** Mã lỗi máy đọc được (nếu có). */
  errorCode?: string;
}

// ---- Payload cho các luồng Auth ----

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
}

// ---- Payload cho luồng ADMIN quản lý quyền ----

export interface UpdateRolePayload {
  userId: string;
  role: Role;
  isActive?: boolean;
}
