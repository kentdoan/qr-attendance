# Database Schema (DynamoDB)

## 1. Các bảng DynamoDB

| Bảng | Dữ liệu lưu trữ |
|------|----------------|
| **Sessions** | Thông tin phiên điểm danh (`sessionId`, `teacherId`, `status`, ...) |
| **QrTokens** | Token ngắn hạn — tự động bị xóa sau 30–60 giây nhờ tính năng DynamoDB TTL |
| **Attendance** | Bản ghi điểm danh (`sessionId` + `studentId`, unique per session để chống điểm danh 2 lần) |

## 2. Chi tiết các bảng

### 2.1 Sessions Table

| Attribute | Type | Ghi chú |
|-----------|------|---------|
| `sessionId` | String (PK) | UUID v4 |
| `className` | String | Tên lớp học |
| `teacherId` | String | Sub (ID) của giảng viên trong Cognito |
| `status` | String | `ACTIVE` hoặc `CLOSED` |
| `createdAt` | String | ISO 8601 string |
| `duration` | Number | Thời gian hiệu lực tính bằng phút |
| `expiresAt` | String | ISO 8601 string. Hết hạn = `createdAt` + `duration` |

### 2.2 QrTokens Table

| Attribute | Type | Ghi chú |
|-----------|------|---------|
| `token` | String (PK) | HMAC-SHA256 string |
| `sessionId` | String | Tham chiếu đến session |
| `expiresAt` | Number | Unix timestamp (giây) — DynamoDB TTL field, tự xóa khi hết hạn |

### 2.3 Attendance Table

| Attribute | Type | Ghi chú |
|-----------|------|---------|
| `sessionId` | String (PK) | Partition key |
| `studentId` | String (SK) | Sort key — kết hợp PK+SK đảm bảo unique per session |
| `studentName` | String | Tên hiển thị của sinh viên (lấy từ Cognito) |
| `checkinTime` | Number | Unix timestamp (ms) |
| `deviceFingerprint` | String | Identifier thiết bị của user |
