# Tài liệu Kiểm thử (Testing Documentation)

Dự án này áp dụng phương pháp **Unit Test (Behavior-Driven)** sử dụng **Jest** và **aws-sdk-client-mock** để kiểm thử logic nghiệp vụ (Business Logic) một cách độc lập mà không cần kết nối tới AWS Cloud.

Tính đến hiện tại, các modules sau đã được bao phủ bởi Unit Tests (Passed 10/10):

---

## 1. `λ Session` (Quản lý Phiên điểm danh)

### Mục tiêu kiểm thử
Đảm bảo API tạo và xóa phiên hoạt động đúng luật, dữ liệu đầu vào được kiểm soát chặt chẽ bởi Zod, và bảo mật quyền sở hữu (Ownership) được áp dụng.

### Kịch bản (Test Cases) đã kiểm thử:
- **[POST] Tạo Session (`handleCreateSession`)**:
  - `[PASS]` Gọi API với payload hợp lệ (Vd: `className`, `duration` chuẩn) -> Hệ thống phải trả về `201 Created` và dữ liệu Session có thuộc tính `sessionId`, `expiresAt`.
  - `[PASS]` Gọi API với `duration` < 5 (Phi logic) -> Zod phải bắt lỗi và ném ra `400 Bad Request`.
  - `[PASS]` Người gọi API không nằm trong nhóm `TEACHER` của Cognito -> Trả về lỗi `403 Forbidden`.

- **[PATCH] Đóng Session (`handleCloseSession`)**:
  - `[PASS]` Giảng viên A yêu cầu đóng Session của chính Giảng viên A -> Hệ thống gọi DynamoDB `UpdateCommand` và trả về `200 OK`.
  - `[PASS]` Giảng viên B yêu cầu đóng Session của Giảng viên A -> Hệ thống phát hiện gian lận và chặn lại bằng mã `403 Forbidden`.

---

## 2. `λ QR Generator` (Sinh mã QR Điểm danh)

### Mục tiêu kiểm thử
Đảm bảo cơ chế lấy khóa HMAC (từ Secrets Manager), thuật toán băm SHA-256 hoạt động chuẩn xác, và mã băm chỉ được sinh ra đối với các Session còn đang mở (`ACTIVE`).

### Kịch bản (Test Cases) đã kiểm thử:
- **[GET] Sinh mã QR (`handleGenerateQR`)**:
  - `[PASS]` **Happy Path**: Giảng viên sở hữu lớp, lớp đang `ACTIVE`. Mock Secrets Manager trả về khóa bí mật. Hệ thống băm chuỗi. -> Token sinh ra phải khớp Regex `^[a-f0-9]{64}$` (Chuẩn mã băm 64 ký tự Hex của SHA-256) và `expiresIn` = 60.
  - `[PASS]` Truyền sai `sessionId` hoặc Session không tồn tại trong database -> Trả về `404 Not Found`.
  - `[PASS]` Người yêu cầu sinh mã không phải là người tạo ra Session -> Trả về `403 Forbidden`.
  - `[PASS]` Giảng viên cố tình sinh mã cho một Session đã bị Đóng (`CLOSED`) -> Trả về `400 Bad Request`.
  - `[PASS]` Sinh viên (User thuộc nhóm `STUDENT`) gọi API này -> Lập tức chặn ở tầng xác thực, trả về `403 Forbidden`.

---


> Để chạy bộ test này, chỉ cần mở terminal tại thư mục `backend` và chạy lệnh `npm test`. Tốc độ kiểm thử dưới 1 giây.
