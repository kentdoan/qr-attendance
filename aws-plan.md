# 13/7/2026

## Yêu cầu chung

### 1. Quy trình làm việc với Git 
- **Fork** trên GitHub để tạo bản sao về tài khoản của mình
- Clone code về máy: `git clone <repo-url>` (Dùng URL của repo bạn vừa fork)
- **Tuyệt đối không code trực tiếp** trên nhánh `main` hay `develop`.
- Khi làm tính năng mới hoặc fix bug, hãy tạo nhánh mới từ nhánh `develop`:
  `git checkout -b feature/ten-tinh-nang` hoặc `git checkout -b fix/ten-loi`
- Code, test xong thì commit và push nhánh đó lên kho lưu trữ của bạn.
- Lên GitHub tạo Pull Request (PR) để yêu cầu merge nhánh đó vào nhánh `develop` của repo gốc.

### 2. Hướng dẫn Test Backend ở tài khoản AWS cá nhân
Để chạy API Backend trên tài khoản AWS cá nhân mà không cần chờ push lên GitHub:
- Yêu cầu: máy đã cài **AWS CLI** và **AWS SAM CLI**.
- **Đăng nhập AWS:** Mở terminal, chạy lệnh `aws configure` (hoặc dùng `aws login`) để đăng nhập account AWS của bạn.
- Di chuyển vào thư mục backend: `cd backend`
- Build code: `sam build`
- Deploy code: `sam deploy --guided`
- Lúc này, SAM sẽ trả về gồm: URL của API Gateway, user pool client id, user pool id. Backend có thể dùng Postman để test, Frontend có thể dùng để set .env để gọi API (và cũng dùng postman)

### 3. Cách tạo tài khoản Admin nhanh nhất
Hệ thống không cho phép tự đăng ký làm Admin. Để có tài khoản test các chức năng Admin, hãy làm theo 2 bước:
1. Đăng ký 1 tài khoản bình thường (Student) qua giao diện Frontend hoặc Postman.
2. Dùng AWS CLI chạy lệnh sau để nhét user đó vào nhóm ADMIN (Nhớ thay các tham số):
   ```bash
   aws cognito-idp admin-add-user-to-group \
     --user-pool-id <VITE_USER_POOL_ID> \
     --username <EMAIL_DA_DANG_KY> \
     --group-name ADMIN
   ```

## Frontend

### Yêu cầu cần thiết (tham khảo)

#### 1. Khởi tạo 
-  Khởi tạo dự án bằng **React + Vite** (đã làm)
-  Set biến môi trường .env theo .env.example

#### 2. Xác thực & Phân quyền (Authentication)
-  Cài đặt thư viện `aws-amplify` để kết nối với Amazon Cognito (User Pool).
-  Xây dựng form đăng kí/đăng nhập: gồm email, họ và tên, password.
-  Cần có 1 trang Home hiển thị thông tin người dùng, nếu chưa đăng nhập thì hiển thị form đăng nhập. Nếu đã đăng nhập thì hiển thị button "Đăng xuất". 

#### 3. Giao diện Sinh viên (STUDENT)
-  Màn hình quét QR Code (Sử dụng các thư viện như `html5-qrcode` hoặc `react-qr-reader`).
-  Logic lấy **Device Fingerprint**: Dùng thư viện `fingerprintjs` để sinh ra một chuỗi định danh thiết bị độc nhất nhằm chống gian lận (1 điện thoại điểm danh giùm nhiều người).
-  Gửi request `POST /checkin` và hiển thị thông báo ngay lập tức (Thành công / Thất bại).

#### 4. Giao diện Giảng viên (TEACHER)
-  **Dashboard:** Hiển thị danh sách các phiên điểm danh (Cần chờ Backend làm xong `GET /sessions`, có thể mock api trước).
-  **Tạo phiên mới:** Form gọi `POST /sessions` (nhập tên lớp, thời gian).
-  **Trình chiếu QR Code:** Gọi `GET /sessions/{sessionId}/qr` mỗi 30 giây để lấy token mới và vẽ thành hình ảnh QR code động chiếu lên màn hình.
-  **Báo cáo (Report):** Gọi `GET /sessions/{sessionId}/report`. Parse file JSON trả về thành file **Excel (.xlsx)** hoặc **CSV** và cho phép Giảng viên tải về máy (Sử dụng thư viện `xlsx` hoặc `papaparse`). Nếu ko thích excel thì có thể dùng định dạng khác nhẹ hơn

#### 5. Giao diện Quản trị viên (ADMIN)
-  **Quản lý Users:** Gọi `GET /admin/users` hiển thị danh sách tất cả tài khoản.
-  Tính năng cấp quyền (`POST /admin/assign-teacher`) và thu hồi quyền Giảng viên (`POST /admin/revoke-teacher`).

### Mở rộng

- Có thể thêm các tính năng khác cần thiết (cần nói với backend để viết thêm API endpoint nếu cần, trước đó có thể mock API trước để dàn layout)

### Lưu ý

- Team Frontend cần bám sát tài liệu `docs/API.md` để cấu trúc Request/Response đúng chuẩn. Cũng cần bám sát `docs/SRS.md`
- Test trên cục bộ trước bằng API khi deploy trên tài khoản AWS của mình


---
## Backend


### Chưa hiện thực

**UC-S04 — Sinh viên xem lịch sử điểm danh của bản thân**
- Không có route, không có handler, không có repository query nào cho tính năng này. Cần phải hiện thực (tự nghĩ ra cấu trúc request/response)

**FR-12 — Tự động đóng session khi hết giờ**
- `expiresAt` được lưu vào DynamoDB nhưng không có cơ chế nào tự động thay đổi `status` thành `CLOSED` khi hết hạn. Hiện tại chỉ có checkin bị chặn (sau fix UC-F04), nhưng `getSession` vẫn trả về session ACTIVE dù đã hết giờ. Hiện chưa hiện thực.

**`listUsers` bị giới hạn cứng 50 người**
- `adminService.listUsers()` có `Limit: 50`, chưa có pagination.

**UC-T09 & FR-13 (docs/SRS.md)**
- Cần hiện thực route `GET /sessions` để giảng viên có thể xem danh sách các phiên điểm danh do mình quản lý, hiện tại không có 
- Thông tin API nằm trong docs/API.md
- Vấn đề:
    - Hiện tại bảng SessionsTable trong DynamoDB đang dùng sessionId làm khóa chính (Partition Key).
    - Nếu muốn tìm tất cả session của một giảng viên (tìm theo teacherId) thì không thể query trực tiếp được. Nếu dùng lệnh Scan thì sẽ quét toàn bộ DB gây tốn kém tiền bạc và cực kỳ chậm.
    - Giải pháp đề xuất: Trong template.yaml, chúng ta sẽ phải tạo thêm một Global Secondary Index cho bảng SessionsTable với Partition Key là teacherId. (sau khi làm, bổ sung note vào DATABASE.md). Đọc thêm trong phần kiến thức DynamoDB

**Chưa thêm CloudWatch**

Hiện tại chưa thiết lập CloudWatch cho dự án, nên không thể theo dõi logs, metrics, và alarms. Cần bổ sung CloudWatch cho dự án.

**Cơ chế "danh sách điểm danh"** (soạn sẵn bởi giảng viên) Hiện tại chưa có

**AWS API Gateway WebSocket để giảng viên có thể thấy sinh viên điểm danh realtime** Hiện tại chưa có

### Mở rộng: 

- Có thể chuyển sang bất đồng bộ (dùng SQS, EventBridge,...) cho những tác vụ chạy lâu và không cần phản hồi ngay (không nên làm bất đồng bộ cho tính năng Điểm danh)
- Tự đề xuất thêm các API endpoint hay các dịch vụ khác phù hợp hoặc cần thiết cho frontend

### Lưu ý

- Cần cập nhật những thay đổi, tính năng mới vào trong các file .md trong thư mục `docs/`. (SRS.md, API.md, DATABASE.md, ...)
- Test trên cục bộ trước (Postman, tự viết Unit Test,...) bằng API khi deploy trên tài khoản AWS của mình

