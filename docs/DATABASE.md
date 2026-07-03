# Database Schema (DynamoDB)

## 1. Các bảng DynamoDB

| Bảng | Dữ liệu lưu trữ |
|------|----------------|
| **Sessions** | Thông tin phiên điểm danh (`sessionId`, `teacherId`, `status`, ...) |
| **QrTokens** | Token ngắn hạn — tự động bị xóa sau 30–60 giây nhờ tính năng DynamoDB TTL |
| **Attendance** | Bản ghi điểm danh (`sessionId` + `studentId`, unique per session để chống điểm danh 2 lần) |

## 2. Chi tiết Schema

### 2.1 Sessions Table

| Attribute | Type | Ghi chú |
|-----------|------|---------|
| `sessionId` | String (PK) | UUID v4 |
| `classId` | String | Mã lớp học |
| `teacherId` | String | Sub (ID) của giảng viên trong Cognito |
| `status` | String | `OPEN` hoặc `CLOSED` |
| `startTime` | Number | Unix timestamp (ms) |
| `endTime` | Number | Unix timestamp (ms), null khi chưa đóng thủ công |
| `expiresAt` | Number | Unix timestamp (giây). Dùng nếu có hẹn giờ (`durationMinutes`) |

### 2.2 QrTokens Table

| Attribute | Type | Ghi chú |
|-----------|------|---------|
| `token` | String (PK) | HMAC-SHA256 string |
| `sessionId` | String | Tham chiếu đến session |
| `ttl` | Number | Unix timestamp (giây) — DynamoDB TTL field, tự xóa khi hết hạn |

### 2.3 Attendance Table

| Attribute | Type | Ghi chú |
|-----------|------|---------|
| `sessionId` | String (PK) | Partition key |
| `studentId` | String (SK) | Sort key — kết hợp PK+SK đảm bảo unique per session |
| `checkinTime` | Number | Unix timestamp (ms) |
| `deviceFingerprint` | String | User-Agent + IP hash |
