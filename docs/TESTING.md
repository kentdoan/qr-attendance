# Tài liệu Kiểm thử (Testing Documentation)

Dự án này áp dụng phương pháp **Unit Test (Behavior-Driven)** sử dụng **Jest** và **aws-sdk-client-mock** để kiểm thử logic nghiệp vụ một cách độc lập mà không cần kết nối tới AWS Cloud.

---

## 1. `λ Session` (Quản lý Phiên điểm danh)

### Mục tiêu kiểm thử
Đảm bảo API tạo và xóa phiên hoạt động đúng luật, dữ liệu đầu vào được kiểm soát chặt chẽ bởi Zod, và bảo mật quyền sở hữu (Ownership) được áp dụng.

### Kịch bản (Test Cases) đã kiểm thử:
- **[POST] Tạo Session (`handleCreateSession`)**:
  - `[PASS]` Gọi API với payload hợp lệ (Vd: `className`, `duration` chuẩn) -> Hệ thống trả về `200 OK` và dữ liệu Session có thuộc tính `sessionId`, `expiresAt`.
  - `[PASS]` Gọi API với `duration` < 1 (Phi logic) -> Zod phải bắt lỗi và ném ra `400 Bad Request`.
  - `[PASS]` Người gọi API không nằm trong nhóm `TEACHER` của Cognito -> Handler trả về `403 Forbidden` (không throw, không crash).
 
- **[GET] Lấy danh sách các Session `TEACHER` đã tạo (`handleGetListSessions`)**:
  - Gọi API lấy tất cả session mà giảng viên `TEACHER` đó đã tạo -> trả về tổng số session và mảng các session tương ứng.
  - Gọi API rỗng -> trả về rỗng `[]`.
  - Người gọi API không nằm trong nhóm `TEACHER` của Cognito -> Handler trả về `403 Forbidden` (không throw, không crash).

- **[DELETE] Xóa Session (`handleDeleteSession`)**:
  - `[PASS]` Giảng viên A yêu cầu xóa Session của chính Giảng viên A -> Hệ thống gọi DynamoDB `DeleteCommand` và trả về `200 OK`.
  - `[PASS]` Giảng viên B yêu cầu xóa Session của Giảng viên A -> Hệ thống phát hiện gian lận và chặn lại bằng mã `403 Forbidden`.

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

## 3. `λ Check-in` (Điểm danh Sinh viên)

### Mục tiêu kiểm thử
Đảm bảo tính năng cốt lõi hoạt động không có kẽ hở:
- Ngăn chặn điểm danh hộ bằng mã QR hết hạn hoặc mã giả.
- Ngăn chặn triệt để mã QR bị tái sử dụng (Cơ chế quét 1 lần - Single-use QR).
- Chống điểm danh lặp (Double check-in) trong cùng một lớp.

### Kịch bản (Test Cases) đã kiểm thử:
- **[POST] Điểm danh (`handleCheckin`)**:
  - `[PASS]` **Happy Path**: Payload hợp lệ, mã QR chính xác. -> Hệ thống ghi nhận điểm danh thành công vào `AttendanceTable`, đồng thời **XÓA MÃ QR** lập tức khỏi `QrTokensTable` và trả về `200 OK`.
  - `[PASS]` Truyền mã QR không tồn tại, sai, hoặc đã hết hạn TTL -> Trả về lỗi `400 Invalid or expired QR code`.
  - `[PASS]` Lấy mã QR của lớp Toán để điểm danh cho lớp Văn (Sai `sessionId`) -> Trả về lỗi `400 QR code does not match this session`.
  - `[PASS]` Sinh viên đã quét QR thành công trước đó, nay cố tình quét lại lần 2 -> Hệ thống chặn ở `checkAttendanceExist` và trả về `409 Conflict` (không phải 400).
  - `[PASS]` Giảng viên cố tình gọi API check-in -> Handler trả về `403 Forbidden: Caller is not a STUDENT` (không throw, không crash).

---

## 4. `λ Report` (Báo cáo Điểm danh)

### Mục tiêu kiểm thử
Đảm bảo chỉ có Giảng viên mới được phép xem danh sách sinh viên của lớp do chính họ tạo ra. Tối ưu hóa hiệu năng bằng lệnh `Query`.

### Kịch bản (Test Cases) đã kiểm thử:
- **[GET] Báo cáo (`handleGetReport`)**:
  - `[PASS]` **Happy Path**: Payload hợp lệ, session thuộc về Giảng viên -> Hệ thống trả về `200 OK` với danh sách `attendees` và `totalAttendees`.
  - `[PASS]` Session ID không tồn tại -> Trả về `404 Not Found`.
  - `[PASS]` Sinh viên cố tình gọi API lấy báo cáo -> Chặn ở tầng xác thực, trả về `403 Forbidden: Caller is not a TEACHER`.
  - `[PASS]` Giảng viên A cố tình xem báo cáo của lớp do Giảng viên B tạo -> Chặn ở logic kiểm tra sở hữu (Ownership), trả về `403 Forbidden: You do not own this session`.

---

## 5. `λ Auth` & `λ Admin` (Xác thực & Quản trị)

### Mục tiêu kiểm thử
Đảm bảo luồng tự động cấp quyền STUDENT khi đăng ký tài khoản mới và hệ thống APIs Quản trị hoạt động nghiêm ngặt, cấm truy cập trái phép.

### Kịch bản (Test Cases) đã kiểm thử:
- **`λ Auth` (PostConfirmation Trigger)**:
  - `[PASS]` Người dùng đăng ký thành công -> Hệ thống tự động gọi **2 lệnh Cognito**: `AdminAddUserToGroup` (nhóm `STUDENT`) và `AdminUpdateUserAttributes` (cập nhật `custom:role`).
- **`λ Admin` (Admin APIs)**:
  - `[PASS]` Giảng viên/Sinh viên cố tình gọi API `/admin/users` -> Hệ thống trả về `403 Forbidden: Caller is not a ADMIN`.
  - `[PASS]` **[GET] `/admin/users`**: Lấy danh sách toàn bộ người dùng trong Cognito User Pool.
  - `[PASS]` **[POST] `/admin/assign-teacher`**: Gọi **2 lệnh Cognito** (`AdminAddUserToGroup` + `AdminUpdateUserAttributes`) để cấp quyền `TEACHER` thành công.
  - `[PASS]` **[POST] `/admin/revoke-teacher`**: Gọi **2 lệnh Cognito** (`AdminRemoveUserFromGroup` + `AdminUpdateUserAttributes`) để tước quyền `TEACHER` thành công.


> Để chạy bộ test này, chỉ cần mở terminal tại thư mục `backend` và chạy lệnh `npm test`. Bộ test gồm **25 test cases** trên **6 test suites**, hoàn thành trong khoảng 7-10 giây.
