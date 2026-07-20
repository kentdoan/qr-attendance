# QR Attendance — Frontend (React + TypeScript + Vite)

Frontend cho **Hệ thống Quét Mã QR Điểm Danh Động** (Đề tài 3 — Application Development on AWS).

## Bắt đầu

```bash
npm install
cp .env.example .env   # rồi điền giá trị (mặc định đang bật mock)
npm run dev
```

Mở http://localhost:5173

## Chế độ Mock

Đặt `VITE_USE_MOCK_API=true` trong `.env` để chạy toàn bộ frontend mà không cần backend/Cognito.

Tài khoản mock (mật khẩu chung: `123456`):

| Role    | Email             |
|---------|-------------------|
| STUDENT | student@demo.com  |
| TEACHER | teacher@demo.com  |
| ADMIN   | admin@demo.com    |

## Cấu trúc `src/`

```
src/
  types/index.ts          # Toàn bộ TypeScript interfaces & enums
  config/amplify.ts        # Cấu hình aws-amplify v6 (Cognito)
  api/
    mockData.ts            # Dữ liệu giả lập + mock API router
    client.ts              # Axios client + interceptor gắn idToken
  auth/AuthContext.tsx     # Auth state: login/register/logout (mock + Cognito)
  components/ProtectedRoute.tsx  # Route guard theo Role
  pages/
    Login.tsx
    Register.tsx
  main.tsx                 # Khởi tạo Amplify + AuthProvider
  App.tsx                  # Router + guard theo role
```

## Chuyển sang backend thật

1. Đặt `VITE_USE_MOCK_API=false`.
2. Điền `VITE_AWS_REGION`, `VITE_COGNITO_USER_POOL_ID`, `VITE_COGNITO_USER_POOL_CLIENT_ID`, `VITE_API_BASE_URL`.
3. Client sẽ tự đính `idToken` (Cognito) vào header `Authorization` cho mọi request.
