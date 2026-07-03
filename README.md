# Smart QR Attendance — Developer Guide

Hệ thống điểm danh bằng QR Code động xây dựng trên AWS Serverless.  
Xem tài liệu yêu cầu tại [`REQUIREMENTS.md`](./docs/REQUIREMENTS.md) và thiết kế kỹ thuật tại [`DESIGN.md`](./docs/DESIGN.md).

---

## Tech Stack

| Layer                | Công nghệ                              |
| -------------------- | -------------------------------------- |
| **IaC / Deploy**     | AWS SAM (Serverless Application Model) |
| **Runtime**          | Node.js 20.x, TypeScript               |
| **API**              | Amazon API Gateway (HTTP API)          |
| **Business Logic**   | AWS Lambda                             |
| **Database**         | Amazon DynamoDB                        |
| **Auth**             | Amazon Cognito                         |
| **Frontend Hosting** | AWS Amplify Hosting                    |
| **Logging**          | Amazon CloudWatch                      |

---

## Prerequisites

Cách cài AWS SAM: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

Kiểm tra sự tồn tại của các công cụ sau trước khi bắt đầu:

```bash
# 1. Node.js 20+
node --version  # >= 20.0.0

# 2. AWS CLI (đã cấu hình credentials)
aws --version
aws configure   # nhập Access Key, Secret Key, Region

# 3. AWS SAM CLI
sam --version   # >= 1.100.0

# 4. TypeScript (global, tuỳ chọn)
npm install -g typescript
```

---

## Cài đặt dự án

```bash
# Clone repo
git clone <repo-url>
cd serverless-qr-attendance

# Cài dependencies
npm install
```

---

## Cấu trúc thư mục

```
serverless-qr-attendance/
├── backend/
│   ├── template.yaml            # SAM template: định nghĩa toàn bộ AWS resources
│   ├── samconfig.toml           # Cấu hình deploy mặc định (stack name, region, ...)
│   ├── package.json
│   │
│   ├── src/
│   │   ├── functions/           # Lambda handlers
│   │   └── shared/              # Utilities dùng chung
│   └── tests/                   # Unit tests
│
├── docs/                        # Tài liệu dự án
└── README.md                    # File này
```

---

## NPM Libraries

### Runtime Dependencies

| Package                                     | Version | Mục đích                                            |
| ------------------------------------------- | ------- | --------------------------------------------------- |
| `@aws-sdk/client-dynamodb`                  | ^3      | Kết nối DynamoDB                                    |
| `@aws-sdk/lib-dynamodb`                     | ^3      | DynamoDB Document Client (type-safe hơn)            |
| `@aws-sdk/client-cognito-identity-provider` | ^3      | Gọi Cognito Admin API (λ Admin)                     |
| `@aws-sdk/client-secrets-manager`           | ^3      | Đọc HMAC secret key                                 |
| `uuid`                                      | ^9      | Tạo `sessionId` dạng UUID v4                        |
| `zod`                                       | ^3      | Validate request body (type-safe schema validation) |

### Dev Dependencies

| Package             | Version | Mục đích                                     |
| ------------------- | ------- | -------------------------------------------- |
| `typescript`        | ^5      | Compiler                                     |
| `@types/aws-lambda` | ^8      | Type definitions cho Lambda event/context    |
| `@types/node`       | ^20     | Type definitions cho Node.js built-ins       |
| `@types/uuid`       | ^9      | Types cho uuid                               |
| `esbuild`           | ^0      | Bundler nhanh cho TypeScript → JS (SAM dùng) |
| `jest`              | ^29     | Test runner                                  |
| `ts-jest`           | ^29     | Chạy TypeScript trong Jest                   |
| `@types/jest`       | ^29     | Types cho Jest                               |

> **Lưu ý:** `crypto` là built-in của Node.js, không cần cài thêm. Dùng để tạo HMAC token.

---

## Development Workflow

### Chạy local với SAM

```bash
# Build (compile TypeScript → JS, package Lambda)
sam build

# Khởi động API local (giả lập API Gateway + Lambda)
sam local start-api

# Gọi thử một Lambda function cụ thể
sam local invoke SessionFunction --event events/create-session.json
```

### Chạy tests

```bash
# Chạy toàn bộ unit tests
npm test

# Chạy test với coverage
npm run test:coverage

# Watch mode khi dev
npm run test:watch
```

### Linting & Type check

```bash
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

---

## Build & Deploy

### Lần đầu deploy

```bash
# Build + deploy với hướng dẫn tương tác
sam build
sam deploy --guided

# SAM sẽ hỏi: stack name, region, S3 bucket, xác nhận changeset
# Sau đó lưu vào samconfig.toml để deploy lần sau không cần --guided
```

### Deploy cập nhật

```bash
sam build && sam deploy
```

### Xóa stack

```bash
sam delete --stack-name smart-qr-attendance
```

---

## Environment Variables (Lambda)

Lưu ý: Phần này chưa kiểm chứng

Tất cả env vars được inject qua `template.yaml`, không hard-code trong code:

| Biến                    | Giá trị                          | Nguồn         |
| ----------------------- | -------------------------------- | ------------- |
| `SESSION_TABLE_NAME`    | Tên DynamoDB table Sessions      | SAM `!Ref`    |
| `QR_TOKENS_TABLE_NAME`  | Tên DynamoDB table QrTokens      | SAM `!Ref`    |
| `ATTENDANCE_TABLE_NAME` | Tên DynamoDB table Attendance    | SAM `!Ref`    |
| `COGNITO_USER_POOL_ID`  | ID của Cognito User Pool         | SAM `!Ref`    |
| `HMAC_SECRET_NAME`      | Tên secret trong Secrets Manager | SAM parameter |

---

## Khởi tạo Admin Account

Tài khoản Admin không đăng ký qua portal. Chạy sau khi deploy:

```bash
# Tạo user Admin
aws cognito-idp admin-create-user \
  --user-pool-id <USER_POOL_ID> \
  --username admin@example.com \
  --temporary-password "Temp@1234" \
  --message-action SUPPRESS

# Thêm vào group ADMIN
aws cognito-idp admin-add-user-to-group \
  --user-pool-id <USER_POOL_ID> \
  --username admin@example.com \
  --group-name ADMIN
```

---

## Tài liệu tham khảo

- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [DynamoDB Developer Guide](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/)
