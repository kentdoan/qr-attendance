# API Contract

## 1. Auth (Cognito trực tiếp, không qua API Gateway)

| Method | Endpoint Cognito | Mô tả |
|--------|-----------------|-------|
| — | `SignUp` | Đăng ký tài khoản |
| — | `ConfirmSignUp` | Xác nhận email |
| — | `InitiateAuth` | Đăng nhập, nhận JWT |

> Frontend gọi thẳng Cognito SDK (Amplify Auth), không qua API Gateway.

---

## 2. Session API (`λ Session`)

### `POST /sessions` — Tạo phiên điểm danh
- **Auth**: Bearer JWT (nhóm `TEACHER`)
- **Request Body**:
  ```json
  {
    "classId": "string",
    "startTime": "ISO 8601 string",
    "durationMinutes": 15 // (Optional) Thời gian hẹn giờ đóng phiên
  }
  ```
- **Response `201`**:
  ```json
  { "sessionId": "uuid" }
  ```
- **Errors**: `401` (chưa đăng nhập), `403` (không phải TEACHER)

### `GET /sessions/{sessionId}` — Lấy thông tin session
- **Auth**: Bearer JWT
- **Response `200`**:
  ```json
  {
    "sessionId": "uuid",
    "classId": "string",
    "teacherId": "string",
    "status": "OPEN | CLOSED",
    "startTime": "ISO 8601",
    "endTime": "ISO 8601 | null",
    "expiresAt": "Unix timestamp | null"
  }
  ```
- **Errors**: `404` (không tìm thấy)

### `PATCH /sessions/{sessionId}/close` — Đóng phiên điểm danh
- **Auth**: Bearer JWT (nhóm `TEACHER`, chỉ teacher sở hữu session)
- **Response `200`**:
  ```json
  { "message": "Session closed" }
  ```
- **Errors**: `403` (không phải chủ sở hữu session), `404`, `400` (đã CLOSED rồi)

### `DELETE /sessions/{sessionId}` — Xóa phiên điểm danh
- **Auth**: Bearer JWT (nhóm `TEACHER`, chỉ teacher sở hữu session)
- **Response `200`**:
  ```json
  { "message": "Session deleted" }
  ```

---

## 3. QR Generator API (`λ QR Generator`)

### `GET /sessions/{sessionId}/qr` — Lấy QR token mới
- **Auth**: Bearer JWT (nhóm `TEACHER`)
- **Response `200`**:
  ```json
  {
    "token": "hmac-string",
    "expiresIn": 60
  }
  ```
- **Errors**: `404` (session không tồn tại), `400` (session đã CLOSED)

---

## 4. Check-in API (`λ Check-in`)

### `POST /checkin` — Sinh viên điểm danh
- **Auth**: Bearer JWT (nhóm `STUDENT`)
- **Request Body**:
  ```json
  { "token": "string" }
  ```
- **Response `200`**:
  ```json
  { "message": "Check-in thành công", "checkinTime": "ISO 8601" }
  ```
- **Errors**:

| HTTP Status | Error Code | Nguyên nhân |
|-------------|-----------|-------------|
| `403` | `INVALID_TOKEN` | Token không tồn tại hoặc giả mạo |
| `403` | `TOKEN_EXPIRED` | Token đã quá TTL |
| `409` | `ALREADY_CHECKED_IN` | Sinh viên đã điểm danh session này |
| `400` | `SESSION_CLOSED` | Session đã đóng (status CLOSED) |
| `400` | `SESSION_EXPIRED` | Session đã quá thời gian hẹn giờ đóng (`expiresAt`) |

---

## 5. Report API (`λ Report`)

### `GET /sessions/{sessionId}/report` — Xem báo cáo điểm danh
- **Auth**: Bearer JWT (nhóm `TEACHER`)
- **Response `200`**:
  ```json
  {
    "sessionId": "uuid",
    "total": 42,
    "attendees": [
      {
        "studentId": "string",
        "checkinTime": "ISO 8601",
        "deviceFingerprint": "string"
      }
    ]
  }
  ```

---

## 6. Admin API (`λ Admin`)

### `GET /admin/users` — Xem danh sách người dùng
- **Auth**: Bearer JWT (nhóm `ADMIN`)
- **Response `200`**:
  ```json
  {
    "users": [
      { "userId": "string", "email": "string", "name": "string", "role": "TEACHER | STUDENT" }
    ]
  }
  ```

### `POST /admin/assign-teacher` — Cấp quyền Giảng viên
- **Auth**: Bearer JWT (nhóm `ADMIN`)
- **Request Body**:
  ```json
  { "userId": "string" }
  ```
- **Response `200`**:
  ```json
  { "message": "Cập nhật quyền thành công" }
  ```

### `POST /admin/revoke-teacher` — Thu hồi quyền Giảng viên
- **Auth**: Bearer JWT (nhóm `ADMIN`)
- **Request Body**:
  ```json
  { "userId": "string" }
  ```
- **Response `200`**:
  ```json
  { "message": "Thu hồi quyền thành công" }
  ```
