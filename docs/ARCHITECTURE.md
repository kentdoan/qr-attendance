# Application Architecture

## 1. Pattern: Index → Handler → Service → Repository

Ta sử dụng **Layered Architecture** 

```
API Gateway Event
       │
       ▼
  indexes/         ← Entry Point: nhận event, phân nhánh theo method + path
       │
       ▼
  handlers/        ← Request Layer: parse body, validate (Zod), kiểm tra quyền, trả về Response
       │
       ▼
  services/        ← Business Logic: orchestrate, xử lý nghiệp vụ, ném typed errors
       │
       ▼
  repositories/    ← Data Access: tương tác DynamoDB / Cognito (PutItem, GetItem, ...)
```

| Tầng               | Thư mục          | Trách nhiệm                                                                                                 |
| ------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------- |
| **Entry Point**    | `indexes/`       | Nhận `APIGatewayProxyEventV2` từ API Gateway, đọc `method` + `path`, điều phối sang đúng Handler           |
| **Handler**        | `handlers/`      | Parse `event.body`, validate bằng Zod, lấy userId từ JWT, gọi Service, trả về Response                     |
| **Service**        | `services/`      | Chứa toàn bộ Business Logic. Ném `AppError` (NotFoundError, ForbiddenError...) khi vi phạm nghiệp vụ        |
| **Repository**     | `repositories/`  | Thực thi DynamoDB / Cognito commands. Giấu hoàn toàn chi tiết kỹ thuật của AWS SDK khỏi tầng trên           |
| **Shared**         | `shared/`        | Các tiện ích dùng chung: `errors.ts`, `response.ts`, `permissions.ts`, `logger.ts`, `models.ts`, `schemas.ts` |

## 2. Cấu trúc thư mục `src/`

```
src/
├── indexes/         # Entry point của mỗi Lambda Function
│   ├── authIndex.ts
│   ├── sessionIndex.ts
│   ├── qrGeneratorIndex.ts
│   ├── checkinIndex.ts
│   ├── reportIndex.ts
│   └── adminIndex.ts
│
├── handlers/        # Request/Response layer (tương đương Controller)
│   ├── authHandler.ts
│   ├── sessionHandler.ts
│   ├── qrGeneratorHandler.ts
│   ├── checkinHandler.ts
│   ├── reportHandler.ts
│   └── adminHandler.ts
│
├── services/        # Business Logic layer
│   ├── authService.ts
│   ├── sessionService.ts
│   ├── qrGeneratorService.ts
│   ├── checkinService.ts
│   ├── reportService.ts
│   └── adminService.ts
│
├── repositories/    # Data Access layer
│   ├── sessionRepository.ts
│   ├── qrGeneratorRepository.ts
│   ├── checkinRepository.ts
│   └── reportRepository.ts
│
└── shared/          # Dùng chung toàn dự án
    ├── errors.ts    # AppError, NotFoundError, ForbiddenError, ConflictError... + errorHandler
    ├── response.ts  # Responses.success(), Responses.notFound()...
    ├── permissions.ts # getTeacherId(), getStudentId(), requireAdmin()
    ├── logger.ts    # Logger.info(), Logger.error()
    ├── models.ts    # TypeScript interfaces & enums (SessionItem, SessionStatus...)
    └── schemas.ts   # Zod validation schemas (CreateSessionBodySchema...)
```

## 3. Kiến trúc triển khai trên AWS

Sơ đồ dưới đây mô phỏng kiến trúc Serverless trên AWS

![architecture](./images/diagram.png)
