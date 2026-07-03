# Application Architecture

## 1. Pattern: Router → Handler → Repository

Ta sử dụng Layered Architecture

```
API Gateway Event
       │
       ▼
  index.ts          ← Router: nhận event, phân nhánh theo method + path
       │
       ▼
  handler.ts        ← Business Logic: validate, kiểm tra quyền, orchestrate
       │
       ▼
  repository.ts     ← Data Access: tương tác DynamoDB (PutItem, GetItem, ...)
```

| Tầng | File | Trách nhiệm |
|------|------|-------------|
| **Router** | `index.ts` | Nhận `APIGatewayProxyEvent` từ API Gateway, đọc `httpMethod` + `path`, gọi đúng handler function |
| **Handler** | `handler.ts` | Validate input, đọc `teacherId`/`studentId` từ JWT context, kiểm tra quyền, gọi repository |
| **Repository** | `repository.ts` | Thực thi DynamoDB commands (`PutItem`, `GetItem`, `UpdateItem`, `DeleteItem`, `Query`) |
| **Types** | `types.ts` | TypeScript interfaces và enums dùng chung trong module |

## 2. Cấu trúc thư mục

```
src/
├── functions/
│   ├── auth/
│   │   └── index.ts                 # Cognito Post Confirmation Trigger
│   ├── session/
│   │   ├── index.ts                 # Router
│   │   ├── handler.ts               # Business Logic
│   │   ├── repository.ts            # DynamoDB layer
│   │   └── types.ts
│   ├── qr-generator/
│   │   ├── index.ts
│   │   ├── handler.ts
│   │   └── types.ts
│   ├── checkin/
│   │   ├── index.ts
│   │   ├── handler.ts
│   │   └── repository.ts
│   ├── report/
│   │   ├── index.ts
│   │   ├── handler.ts
│   │   └── repository.ts
│   └── admin/
│       ├── index.ts
│       └── handler.ts
└── shared/
    ├── response.ts                  # Helper tạo HTTP response chuẩn
    ├── errors.ts                    # Custom error classes
    └── logger.ts                    # CloudWatch logging wrapper
```

## 3. Quy tắc thiết kế cốt lõi

- **`teacherId` / `studentId` lấy từ JWT**, không từ request body → tránh giả mạo định danh.
- **Tên bảng DynamoDB** inject qua Lambda environment variable, không hard-code.
- **HMAC secret key** lưu trong AWS Secrets Manager, không lưu trong env var.
- **`ExpressionAttributeNames`** phải dùng cho DynamoDB attribute `status` (reserved keyword).

## 4. Lambda Business Logic

### 4.1 `λ Auth` — Cognito Post Confirmation Trigger

```
Input: CognitoUserPoolTriggerEvent (post confirmation)
Logic:
  1. Đọc userId và email từ event.userName / event.request.userAttributes
  2. Gọi Cognito AdminAddUserToGroup(userId, "STUDENT")
Output: Trả về event (Cognito trigger yêu cầu)
```

### 4.2 `λ Session` — Session Management

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

### 4.3 `λ QR Generator`

```
generateQR:
  1. Đọc teacherId từ JWT, kiểm tra nhóm TEACHER
  2. GetItem session → kiểm tra status OPEN
  3. Tạo token = HMAC-SHA256(sessionId + currentTimestamp + secretKey)
  4. PutItem { token, sessionId, ttl: now + 60s }
  5. Return 200 { token, expiresIn: 60 }
```

### 4.4 `λ Check-in`

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

### 4.5 `λ Report`

```
getReport:
  1. Đọc teacherId từ JWT, kiểm tra nhóm TEACHER
  2. GetItem session → kiểm tra teacherId khớp
  3. Query Attendance { PK = sessionId }
  4. Return 200 { total: count, attendees: [...] }
```

### 4.6 `λ Admin`

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
