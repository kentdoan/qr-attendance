// ============================================================================
// Dynamic QR Attendance System — Core TypeScript types
// ============================================================================

/** Vai trò người dùng trong hệ thống (khớp Cognito groups / custom:role). */

/** Người dùng đã xác thực. */

/** Phiên điểm danh do giảng viên tạo. */

/** Token QR động — đổi mỗi 30 giây. */

/** Trạng thái kết quả điểm danh. */
export let CheckinStatus = /*#__PURE__*/ (function (CheckinStatus) {
  CheckinStatus["SUCCESS"] = "SUCCESS";
  CheckinStatus["EXPIRED"] = "EXPIRED";
  // Mã QR đã hết hạn
  CheckinStatus["INVALID"] = "INVALID"; // Mã QR không hợp lệ / sai phiên
  CheckinStatus["DUPLICATE_DEVICE"] = "DUPLICATE_DEVICE"; // Thiết bị đã điểm danh hộ người khác
  CheckinStatus["ALREADY_CHECKED_IN"] = "ALREADY_CHECKED_IN"; // Sinh viên đã điểm danh trong phiên
  CheckinStatus["SESSION_CLOSED"] = "SESSION_CLOSED"; // Phiên đã đóng
  return CheckinStatus;
})({});

/** Payload sinh viên gửi lên `POST /checkin`. */

/** Bản ghi một lượt điểm danh. */

/** Dữ liệu báo cáo một phiên (dùng cho bảng danh sách & export Excel). */

/** Bao bọc phản hồi API chuẩn. */

// ---- Payload cho các luồng Auth ----

// ---- Payload cho luồng ADMIN quản lý quyền ----
