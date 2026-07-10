# Lambda Logic

## `λ Auth` — Cognito Post Confirmation Trigger

```
Input: CognitoUserPoolTriggerEvent (post confirmation)
Logic:
  1. Đọc userId từ event.userName, userPoolId từ event.userPoolId
  2. Gọi Cognito AdminAddUserToGroup(userId, "STUDENT")
  3. Gọi Cognito AdminUpdateUserAttributes để cập nhật custom:role = "STUDENT"
Output: Trả về event (Cognito trigger yêu cầu)
```

## `λ Session` — Session Management

```
createSession:
  1. Handler: Đọc teacherId từ JWT bằng getTeacherId(), validate body bằng Zod
  2. Service: Tính toán expiresAt = createdAt + duration * 60000 (ms), tạo UUID sessionId
  3. Repository: PutItem vào SessionsTable
  4. Return 200 { session }

getSession:
  1. Handler: Đọc teacherId từ JWT, lấy sessionId từ pathParameters
  2. Service: validateSessionOwnership() → GetItem, kiểm tra tồn tại (NotFoundError) và quyền sở hữu (ForbiddenError)
  3. Return 200 { session } hoặc 403 / 404

closeSession:
  1. Handler: Đọc teacherId từ JWT, lấy sessionId từ pathParameters
  2. Service: validateSessionOwnership() → xác minh quyền sở hữu
  3. Repository: UpdateCommand set status = 'CLOSED'
  4. Return 200 hoặc 403 / 404

deleteSession:
  1. Handler: Đọc teacherId từ JWT, lấy sessionId từ pathParameters
  2. Service: validateSessionOwnership() → xác minh quyền sở hữu
  3. Repository: DeleteCommand
  4. Return 200 hoặc 403 / 404
```

## `λ QR Generator`

```
generateQR:
  1. Handler: Đọc teacherId từ JWT bằng getTeacherId()
  2. Service: GetItem session → NotFoundError nếu không tồn tại
  3. Service: Kiểm tra teacherId khớp → ForbiddenError nếu không phải chủ sở hữu
  4. Service: Kiểm tra session.status === SessionStatus.ACTIVE → BadRequestError nếu đã đóng
  5. Repository: Lấy HMAC secret từ Secrets Manager (cache in-memory sau lần đầu)
  6. Service: Tạo token = HMAC-SHA256(sessionId + currentTimestamp, secretKey)
  7. Repository: PutItem { token, sessionId, expiresAt: now_in_seconds + 60 } (DynamoDB TTL)
  8. Return 200 { token, expiresIn: 60 }
```

## `λ Check-in`

```
checkin:
  1. Handler: Đọc studentId từ JWT bằng getStudentId(), validate body bằng Zod (CheckinSchema)
  2. Service: GetItem QrTokens { token }
     → null: throw BadRequestError (400 INVALID_TOKEN)
  3. Service: Kiểm tra qrToken.sessionId === payload.sessionId
     → không khớp: throw BadRequestError (400 MISMATCH)
  4. Service: GetItem Attendance { sessionId, studentId }
     → tồn tại: throw ConflictError (409 ALREADY_CHECKED_IN)
  5. Service: PutItem Attendance { sessionId, studentId, checkinTime, deviceFingerprint }
  6. Service: DeleteItem QrToken (single-use — xóa ngay sau khi dùng)
  7. Return 200 { attendance }
```

## `λ Report`

```
getReport:
  1. Handler: Đọc teacherId từ JWT bằng getTeacherId()
  2. Service: GetItem session để lấy teacherId chủ sở hữu
     → null: throw NotFoundError (404)
     → session.teacherId !== teacherId: throw ForbiddenError (403)
  3. Repository: Query Attendance { PK = sessionId }
  4. Return 200 { sessionId, totalAttendees: count, attendees: [...] }
```

## `λ Admin`

```
listUsers:
  1. Handler: requireAdmin() kiểm tra caller thuộc nhóm ADMIN
  2. Service: Gọi Cognito ListUsersCommand (Limit: 50)
  3. Service: Map và chuẩn hóa dữ liệu (username, status, attributes, created)
  4. Return 200 { users }

assignTeacher:
  1. Handler: requireAdmin() kiểm tra caller thuộc nhóm ADMIN, validate body bằng Zod
  2. Service: Cognito AdminAddUserToGroup(username, "TEACHER")
  3. Service: Cognito AdminUpdateUserAttributes set custom:role = "TEACHER"
  4. Return 200

revokeTeacher:
  1. Handler: requireAdmin() kiểm tra caller thuộc nhóm ADMIN, validate body bằng Zod
  2. Service: Cognito AdminRemoveUserFromGroup(username, "TEACHER")
  3. Service: Cognito AdminUpdateUserAttributes set custom:role = "STUDENT"
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
| **`λ Check-in`** | `DynamoDBReadPolicy`<br>`DynamoDBCrudPolicy`<br>`DynamoDBCrudPolicy` | DynamoDB (`SessionsTable`)<br>DynamoDB (`QrTokensTable`)<br>DynamoDB (`AttendanceTable`) | Kiểm tra tính hợp lệ của phiên.<br>Xác thực token.<br>Ghi nhận điểm danh chống trùng lặp. |
| **`λ Report`** | `DynamoDBReadPolicy`<br>`DynamoDBReadPolicy` | DynamoDB (`SessionsTable`)<br>DynamoDB (`AttendanceTable`) | Kiểm tra quyền sở hữu phiên của giảng viên.<br>Lấy toàn bộ danh sách điểm danh. |
| **`λ Admin`** | `cognito-idp:AdminAddUserToGroup`<br>`cognito-idp:AdminRemoveUserFromGroup`<br>`cognito-idp:ListUsers` | Amazon Cognito (`UserPool`) | Quản lý nâng/hạ quyền và xem danh sách người dùng. |
