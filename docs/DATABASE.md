# Database Schema (DynamoDB)

## 1. Các bảng DynamoDB

| Bảng | Dữ liệu lưu trữ |
|------|----------------|
| **Courses** | Thông tin môn học do giảng viên tạo (`courseId`, `teacherId`, `courseName`, `courseCode`) |
| **Sessions** | Thông tin phiên điểm danh (`sessionId`, `teacherId`, `courseId`, `status`, ...) |
| **QrTokens** | Token ngắn hạn — tự động bị xóa sau 30–60 giây nhờ tính năng DynamoDB TTL |
| **Attendance** | Bản ghi điểm danh (`sessionId` + `studentId`, unique per session để chống điểm danh 2 lần) |

## 2. Chi tiết các bảng

### 2.1 Courses Table

| Attribute | Type | Ghi chú |
|-----------|------|---------|
| `courseId` | String (PK) | UUID v4 |
| `teacherId` | String | Tham chiếu giảng viên tạo môn học |
| `courseName` | String | Tên môn học |
| `courseCode` | String | Mã môn học |
| `createdAt` | String | ISO 8601 string |

#### 2.1.1 Global Secondary Index (GSI)
| GSI | Partition Key (PK) | Ghi chú |
|----|---------------------|----------|
| `TeacherIdIndex` | `teacherId` | Được API sử dụng để Query tất cả môn học của một giảng viên |

### 2.2 Sessions Table

| Attribute | Type | Ghi chú |
|-----------|------|---------|
| `sessionId` | String (PK) | UUID v4 |
| `courseId` | String | Tham chiếu môn học |
| `courseName` | String | Tên môn học (Denormalized) |
| `className` | String | Tương thích ngược |
| `teacherId` | String | Sub (ID) của giảng viên trong Cognito |
| `teacherName` | String | Tên giảng viên (tùy chọn, lấy từ Cognito) |
| `teacherSchool` | String | Trường của giảng viên |
| `teacherFaculty` | String | Khoa của giảng viên |
| `status` | String | `ACTIVE` hoặc `CLOSED` |
| `createdAt` | String | ISO 8601 string |
| `duration` | Number | Thời gian hiệu lực tính bằng phút |
| `expiresAt` | String | ISO 8601 string. Hết hạn = `createdAt` + `duration` |

#### 2.2.1 Global Secondary Index (GSI)
| GSI | Partition Key (PK) | Ghi chú |
|----|---------------------|----------|
| `TeacherIdIndex` | `teacherId` | Được API `GET /sessions` sử dụng để `Query` tất cả phiên điểm danh giảng viên đã tạo thay vì `Scan` vét cạn |

### 2.3 QrTokens Table

| Attribute | Type | Ghi chú |
|-----------|------|---------|
| `token` | String (PK) | HMAC-SHA256 string |
| `sessionId` | String | Tham chiếu đến session |
| `expiresAt` | Number | Unix timestamp (giây) — DynamoDB TTL field, tự xóa khi hết hạn |

### 2.4 Attendance Table

| Attribute | Type | Ghi chú |
|-----------|------|---------|
| `sessionId` | String (PK) | Partition key |
| `studentId` | String (SK) | Sort key — kết hợp PK+SK đảm bảo unique per session |
| `studentName` | String | Tên hiển thị của sinh viên (lấy từ Cognito) |
| `studentSchool` | String | Trường của sinh viên |
| `studentFaculty` | String | Khoa của sinh viên |
| `studentMajor` | String | Ngành của sinh viên |
| `checkinTime` | Number | Unix timestamp (ms) |
| `deviceFingerprint` | String | Identifier thiết bị của user |
| `className` | String | Tên lớp (Tương thích ngược) |
| `courseId` | String | Mã định danh môn học (Denormalized) |
| `courseName` | String | Tên môn học (Denormalized) |
| `sessionCreatedAt` | String | Thời gian tạo phiên điểm danh (Denormalized) |
| `teacherName` | String | Tên giảng viên (Denormalized) |
| `teacherSchool` | String | Trường của giảng viên |
| `teacherFaculty` | String | Khoa của giảng viên |

## 3. Lược đồ người dùng (AWS Cognito)

Người dùng được quản lý hoàn toàn bằng Amazon Cognito User Pool. Mật khẩu không được lưu ở Database mà do AWS xử lý bằng chuẩn bảo mật cao (SRP).

| Thuộc tính (Attribute) | Loại | Mục đích |
|-------------------------|------|----------|
| `email` (Username) | Chuẩn | Tên đăng nhập và nhận mã OTP (Khôi phục mật khẩu, xác minh tài khoản). |
| `name` | Chuẩn | Họ và tên hiển thị của người dùng. |
| `custom:role` | Tùy chỉnh | `STUDENT`, `TEACHER`, `ADMIN` (Do backend gán, Frontend chỉ đọc). |
| `custom:school` | Tùy chỉnh | Tên trường đại học/cao đẳng của người dùng. |
| `custom:faculty` | Tùy chỉnh | Khoa đang theo học / giảng dạy. |
| `custom:major` | Tùy chỉnh | Chuyên ngành. |
