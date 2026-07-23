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
    "courseId": "string-uuid",
    "className": "string",
    "duration": 60 
  }
  ```
  *(Lưu ý: `duration` là thời lượng của phiên tính bằng phút, cho phép từ 1 đến 180 phút)*
- **Response `201`**:
  ```json
  {
    "message": "Session created successfully",
    "session": {
      "sessionId": "uuid",
      "teacherId": "string",
      "courseId": "string-uuid",
      "courseName": "string",
      "className": "string",
      "status": "ACTIVE",
      "createdAt": "ISO 8601",
      "expiresAt": "ISO 8601",
      "duration": 60
    }
  }
  ```
- **Errors**: `401` (chưa đăng nhập), `403` (không có quyền)

### `GET /sessions` — Lấy danh sách phiên điểm danh
- **Auth**: Bearer JWT (nhóm `TEACHER`)
- **Query Params**: `?teacherId=your-teacher`
- **Response 200**: Trả về mảng (array) chứa thông tin các session:
  ```json
  {
    "total": 2,
    "sessions": [
      { 
        "sessionId": "uuid",
        "teacherId": "string", 
        "courseId": "string",
        "courseName": "string",
        "className": "string",
        "status": "ACTIVE | CLOSED",
        "createdAt": "ISO 8601",
        "expiresAt": "ISO 8601",
        "duration": 60
      },
      { 
        "sessionId": "uuid",
        "teacherId": "string", 
        "courseId": "string",
        "courseName": "string",
        "className": "string",
        "status": "ACTIVE | CLOSED",
        "createdAt": "ISO 8601",
        "expiresAt": "ISO 8601",
        "duration": 60
      }
    ]
  }
  ```
- **Errors**: `401` (chưa đăng nhập), `403` (không thuộc nhóm TEACHER)


### `GET /sessions/{sessionId}` — Lấy thông tin session
- **Auth**: Bearer JWT
- **Response `200`**:
  ```json
  {
    "session": {
      "sessionId": "uuid",
      "teacherId": "string",
      "className": "string",
      "status": "ACTIVE | CLOSED",
      "createdAt": "ISO 8601",
      "expiresAt": "ISO 8601",
      "duration": 60
    }
  }
  ```
- **Errors**: `404` (không tìm thấy)

### `PATCH /sessions/{sessionId}/close` — Đóng phiên điểm danh
- **Auth**: Bearer JWT (nhóm `TEACHER`, chỉ teacher sở hữu session)
- **Response `200`**:
  ```json
  { "message": "Session closed successfully" }
  ```
- **Errors**: `403` (không phải chủ sở hữu session), `404`, `400` (đã CLOSED rồi)

### `DELETE /sessions/{sessionId}` — Xóa phiên điểm danh
- **Auth**: Bearer JWT (nhóm `TEACHER`, chỉ teacher sở hữu session)
- **Response `200`**:
  ```json
  { "message": "Session deleted successfully" }
  ```

---

## 3. Course API (`λ Course`)

### `GET /courses` — Lấy danh sách môn học của giảng viên
- **Auth**: Bearer JWT (nhóm `TEACHER`)
- **Response `200`**:
  ```json
  {
    "total": 1,
    "courses": [
      {
        "courseId": "uuid",
        "teacherId": "string",
        "courseName": "string",
        "courseCode": "string",
        "createdAt": "ISO 8601"
      }
    ]
  }
  ```

### `POST /courses` — Tạo môn học mới
- **Auth**: Bearer JWT (nhóm `TEACHER`)
- **Request Body**:
  ```json
  {
    "courseName": "Phát triển ứng dụng Web",
    "courseCode": "INT3306"
  }
  ```
- **Response `201`**:
  ```json
  {
    "message": "Course created successfully",
    "course": {
      "courseId": "uuid",
      "teacherId": "string",
      "courseName": "Phát triển ứng dụng Web",
      "courseCode": "INT3306",
      "createdAt": "ISO 8601"
    }
  }
  ```
- **Errors**: `400` (dữ liệu không hợp lệ), `409` (trùng tên hoặc mã môn học).

### `DELETE /courses/{courseId}` — Xóa môn học
- **Auth**: Bearer JWT (nhóm `TEACHER`)
- **Response `200`**:
  ```json
  { "message": "Course deleted successfully" }
  ```

---

## 4. QR Generator API (`λ QR Generator`)

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
  { 
    "token": "string",
    "sessionId": "string",
    "deviceFingerprint": "string"
  }
  ```
- **Response `200`**:
  ```json
  {
    "message": "Check-in successful",
    "attendance": {
      "sessionId": "uuid",
      "studentId": "string",
      "studentName": "string",
      "studentSchool": "string",
      "studentFaculty": "string",
      "studentMajor": "string",
      "checkinTime": 1719543200,
      "deviceFingerprint": "string",
      "className": "string",
      "courseId": "string",
      "courseName": "string",
      "sessionCreatedAt": "ISO 8601",
      "teacherName": "string",
      "teacherSchool": "string",
      "teacherFaculty": "string"
    }
  }
  ```
- **Errors**:

| HTTP Status | Error Code | Nguyên nhân |
|-------------|-----------|-------------|
| `400` | `invalid_type` | Thiếu token, sessionId hoặc deviceFingerprint |
| `400` | `INVALID_TOKEN` | Token không tồn tại, hết hạn hoặc không khớp Session |
| `400` | `SESSION_CLOSED` | Session đã bị đóng (CLOSED) hoặc quá giờ (ACTIVE nhưng hết hạn) |
| `409` | `ALREADY_CHECKED_IN` | Sinh viên đã điểm danh session này rồi |

### `GET /my-attendance` — Sinh viên xem lịch sử điểm danh của bản thân
- **Auth**: Bearer JWT (nhóm `STUDENT`)
- **Response `200`**:
  ```json
  {
    "attendance": [
      {
        "sessionId": "uuid",
        "checkinTime": 1719543200,
        "className": "string",
        "courseId": "string",
        "courseName": "string",
        "sessionCreatedAt": "ISO 8601",
        "teacherName": "string",
        "teacherSchool": "string",
        "teacherFaculty": "string"
      }
    ]
  }
  ```

---

## 5. Report API (`λ Report`)

### `GET /sessions/{sessionId}/report` — Xem báo cáo điểm danh
- **Auth**: Bearer JWT (nhóm `TEACHER`)
- **Response `200`**:
  ```json
  {
    "sessionId": "uuid",
    "totalAttendees": 3,
    "attendees": [
      {
        "studentId": "string",
        "studentName": "string",
        "studentSchool": "string",
        "studentFaculty": "string",
        "studentMajor": "string",
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
- **Query Params**: `?nextToken=string` (tùy chọn để lấy trang tiếp theo)
- **Response `200`**:
  ```json
  {
    "users": [
      { "username": "string", "email": "string", "role": "string", "status": "string", "createdAt": "ISO 8601" }
    ],
    "nextToken": "string-token"
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

### `DELETE /admin/users/{username}` — Xóa người dùng
- **Auth**: Bearer JWT (nhóm `ADMIN`)
- **Response `200`**:
  ```json
  { "message": "Successfully deleted user {username}" }
  ```
- **Errors**: `400` (thiếu username), `403` (không có quyền), `500` (lỗi server)
