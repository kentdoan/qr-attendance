# Lambda Logic

## `λ Auth` — Cognito Post Confirmation Trigger

```
Input: CognitoUserPoolTriggerEvent (post confirmation)
Logic:
  1. Đọc userId và email từ event.userName / event.request.userAttributes
  2. Gọi Cognito AdminAddUserToGroup(userId, "STUDENT")
Output: Trả về event (Cognito trigger yêu cầu)
```

## `λ Session` — Session Management

```
createSession:
  1. Đọc teacherId từ JWT (event.requestContext.authorizer.claims.sub)
  2. Validate: classId không rỗng
  3. Tính toán `expiresAt` (nếu có `durationMinutes`): `expiresAt = (startTime + durationMinutes * 60) in seconds`
  4. Gọi repository.createSession(sessionId, classId, teacherId, startTime, expiresAt)
  5. Return 201 { sessionId }

closeSession:
  1. Đọc teacherId từ JWT
  2. GetItem session → kiểm tra tồn tại + status OPEN + teacherId khớp
  3. Gọi repository.closeSession(sessionId, endTime)
  4. Return 200
```

## `λ QR Generator`

```
generateQR:
  1. Đọc teacherId từ JWT, kiểm tra nhóm TEACHER
  2. GetItem session → kiểm tra status OPEN
  3. Tạo token = HMAC-SHA256(sessionId + currentTimestamp + secretKey)
  4. PutItem { token, sessionId, ttl: now + 60s }
  5. Return 200 { token, expiresIn: 60 }
```

## `λ Check-in`

```
checkin:
  1. Đọc studentId từ JWT (claims.sub)
  2. GetItem QrTokens { token }
     → null: return 403 INVALID_TOKEN
     → ttl đã quá: return 403 TOKEN_EXPIRED (DynamoDB TTL có thể chậm vài giây)
  3. GetItem Session { sessionId } (dựa vào thông tin sessionId lấy từ token)
     → status == CLOSED: return 400 SESSION_CLOSED
     → expiresAt != null && now > expiresAt: return 400 SESSION_EXPIRED
  4. GetItem Attendance { sessionId, studentId }
     → tồn tại: return 409 ALREADY_CHECKED_IN
  5. PutItem Attendance { sessionId, studentId, checkinTime, deviceFingerprint }
  6. DeleteItem QrTokens { token }  ← xóa ngay để single-use
  7. Return 200
```

## `λ Report`

```
getReport:
  1. Đọc teacherId từ JWT, kiểm tra nhóm TEACHER
  2. GetItem session → kiểm tra teacherId khớp
  3. Query Attendance { PK = sessionId }
  4. Return 200 { total: count, attendees: [...] }
```

## `λ Admin`

```
assignTeacher:
  1. Kiểm tra caller thuộc nhóm ADMIN
  2. Cognito AdminAddUserToGroup(userId, "TEACHER")
  3. Cognito AdminRemoveUserFromGroup(userId, "STUDENT")
  4. Return 200

revokeTeacher:
  1. Kiểm tra caller thuộc nhóm ADMIN
  2. Cognito AdminRemoveUserFromGroup(userId, "TEACHER")
  3. Cognito AdminAddUserToGroup(userId, "STUDENT")
  4. Return 200
```

---

## Phân quyền IAM chéo (Least Privilege)

Nhằm đảm bảo bảo mật tuyệt đối, mỗi Lambda function trong hệ thống chỉ được cấp đúng những quyền (Permissions) mà nó cần để thực thi công việc, thông qua các **AWS SAM Policy Templates**:

| Lambda Function | Quyền IAM được cấp (Policies / Actions) | Tài nguyên đích (Resource) | Mục đích |
|-----------------|-----------------------------------------|----------------------------|----------|
| **`λ Auth`** | `cognito-idp:AdminAddUserToGroup` | Amazon Cognito (`UserPool`) | Tự động gán quyền `STUDENT` sau khi xác nhận email. |
| **`λ Session`** | `DynamoDBCrudPolicy` | DynamoDB (`SessionsTable`) | Tạo, Đóng, Lấy, và Xóa phiên điểm danh. |
| **`λ QR Gen`** | `DynamoDBReadPolicy`<br>`DynamoDBWritePolicy`<br>`AWSSecretsManagerGetSecretValuePolicy` | DynamoDB (`SessionsTable`)<br>DynamoDB (`QrTokensTable`)<br>Secrets Manager (`HmacSecret`) | Đọc trạng thái phiên.<br>Lưu token QR vừa sinh kèm TTL.<br>Lấy khóa bí mật để tạo mã băm. |
| **`λ Check-in`** | `DynamoDBReadPolicy`<br>`DynamoDBCrudPolicy`<br>`DynamoDBCrudPolicy` | DynamoDB (`SessionsTable`)<br>DynamoDB (`QrTokensTable`)<br>DynamoDB (`AttendanceTable`) | Kiểm tra tính hợp lệ của phiên.<br>Xác thực và xóa token (Single-use).<br>Ghi nhận điểm danh chống trùng lặp. |
| **`λ Report`** | `DynamoDBReadPolicy`<br>`DynamoDBReadPolicy` | DynamoDB (`SessionsTable`)<br>DynamoDB (`AttendanceTable`) | Kiểm tra quyền sở hữu phiên của giảng viên.<br>Lấy toàn bộ danh sách điểm danh. |
| **`λ Admin`** | `cognito-idp:AdminAddUserToGroup`<br>`cognito-idp:AdminRemoveUserFromGroup`<br>`cognito-idp:ListUsers` | Amazon Cognito (`UserPool`) | Quản lý nâng/hạ quyền và xem danh sách người dùng. |