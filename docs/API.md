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
- **Auth**: Bearer JWT (nhóm `TEACHER` hoặc `ADMIN`)
- **Request Body**:
  ```json
  {
    "className": "string",
    "duration": 60
  }
  ```
- **Response `201`**:
  ```json
  { "sessionId": "uuid" }
  ```
- **Errors**: `401` (chưa đăng nhập), `403` (không có quyền)

### `GET /sessions/{sessionId}` — Lấy thông tin session
- **Auth**: Bearer JWT
- **Response `200`**:
  ```json
  {
    "sessionId": "uuid",
    "teacherId": "string",
    "className": "string",
    "status": "ACTIVE | CLOSED",
    "createdAt": "ISO 8601",
    "expiresAt": "ISO 8601",
    "duration": 60
  }
  ```
- **Errors**: `404` (không tìm thấy)

### `PATCH /sessions/{sessionId}/close` — Đóng phiên điểm danh
- **Auth**: Bearer JWT (nhóm `TEACHER` hoặc `ADMIN`, chỉ teacher sở hữu session)
- **Response `200`**:
  ```json
  { "message": "Session closed successfully" }
  ```
- **Errors**: `403` (không phải chủ sở hữu session), `404`, `400` (đã CLOSED rồi)

### `DELETE /sessions/{sessionId}` — Xóa phiên điểm danh
- **Auth**: Bearer JWT (nhóm `TEACHER` hoặc `ADMIN`, chỉ teacher sở hữu session)
- **Response `200`**:
  ```json
  { "message": "Session deleted successfully" }
  ```

---

## 3. QR Generator API (`λ QR Generator`)

### `GET /sessions/{sessionId}/qr` — Lấy QR token mới
- **Auth**: Bearer JWT (nhóm `TEACHER` hoặc `ADMIN`)
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
  { 
    "token": "string",
    "sessionId": "string",
    "deviceFingerprint": "string"
  }
  ```
- **Response `200`**:
  ```json
  { "message": "Check-in successful" }
  ```
- **Errors**:

| HTTP Status | Error Code | Nguyên nhân |
|-------------|-----------|-------------|
| `400` | `invalid_type` | Thiếu token, sessionId hoặc deviceFingerprint |
| `400` | `INVALID_TOKEN` | Token không tồn tại, hết hạn hoặc không khớp Session |
| `400` | `SESSION_CLOSED` | Session đã bị đóng (CLOSED) hoặc quá giờ (ACTIVE nhưng hết hạn) |
| `400` | `ALREADY_CHECKED_IN` | Sinh viên đã điểm danh session này rồi |

---

## 5. Report API (`λ Report`)

### `GET /sessions/{sessionId}/report` — Xem báo cáo điểm danh
- **Auth**: Bearer JWT (nhóm `TEACHER` hoặc `ADMIN`)
- **Response `200`**:
  ```json
  {
    "sessionId": "uuid",
    "total": 42,
    "attendees": [
      {
        "studentId": "string",
        "checkinTime": 1719543200,
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
      { "username": "string", "email": "string", "role": "string", "status": "string", "createdAt": "ISO 8601" }
    ]
  }
  ```

### `POST /admin/assign-teacher` — Cấp quyền Giảng viên
- **Auth**: Bearer JWT (nhóm `ADMIN`)
- **Request Body**:
  ```json
  { "username": "string" }
  ```
- **Response `200`**:
  ```json
  { "message": "Role TEACHER assigned to user string" }
  ```

### `POST /admin/revoke-teacher` — Thu hồi quyền Giảng viên
- **Auth**: Bearer JWT (nhóm `ADMIN`)
- **Request Body**:
  ```json
  { "username": "string" }
  ```
- **Response `200`**:
  ```json
  { "message": "Role TEACHER revoked from user string" }
  ```
