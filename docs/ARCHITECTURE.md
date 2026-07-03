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

| Tầng           | File            | Trách nhiệm                                                                                      |
| -------------- | --------------- | ------------------------------------------------------------------------------------------------ |
| **Router**     | `index.ts`      | Nhận `APIGatewayProxyEvent` từ API Gateway, đọc `httpMethod` + `path`, gọi đúng handler function |
| **Handler**    | `handler.ts`    | Validate input, đọc `teacherId`/`studentId` từ JWT context, kiểm tra quyền, gọi repository       |
| **Repository** | `repository.ts` | Thực thi DynamoDB commands (`PutItem`, `GetItem`, `UpdateItem`, `DeleteItem`, `Query`)           |
| **Types**      | `types.ts`      | TypeScript interfaces và enums dùng chung trong module                                           |

## 2. Kiến trúc triển khai trên AWS

Sơ đồ dưới đây mô phỏng kiến trúc Serverless trên AWS

![architecture](./images/diagram.png)
