# Software Requirements Specification (SRS)

## 1. Yêu cầu chức năng (Functional Requirements)

| Mã | Mô tả yêu cầu |
|----|--------------|
| FR-01 | Hệ thống cho phép người dùng tự đăng ký tài khoản bằng email |
| FR-02 | Hệ thống xác thực người dùng bằng email và mật khẩu, trả về JWT token |
| FR-03 | Hệ thống phân quyền người dùng theo nhóm: `STUDENT`, `TEACHER`, `ADMIN` |
| FR-04 | Giảng viên có thể tạo, đóng và xóa phiên điểm danh (session) |
| FR-05 | Hệ thống sinh QR Code động, token thay đổi mỗi 30–60 giây |
| FR-06 | Mỗi QR token chỉ sử dụng được một lần duy nhất |
| FR-07 | Sinh viên điểm danh bằng cách quét QR Code |
| FR-08 | Hệ thống ngăn chặn điểm danh 2 lần trong cùng một phiên |
| FR-09 | Giảng viên xem và xuất báo cáo danh sách sinh viên đã điểm danh |
| FR-10 | Admin xem danh sách toàn bộ tài khoản trong hệ thống |
| FR-11 | Admin cấp và thu hồi quyền Giảng viên (`TEACHER`) cho tài khoản bất kỳ |
| FR-12 | Giảng viên có thể thiết lập thời gian hẹn giờ để tự động đóng phiên điểm danh |
| FR-13 | Giảng viên có thể xem danh sách các phiên điểm danh do mình quản lý |

## 2. Use Cases

### 2.1 Use Cases của Giảng viên

| Mã | Use Case | Mô tả | Điều kiện tiên quyết | Kết quả | FR liên quan |
|----|----------|-------|----------------------|---------|-------------|
| UC-T01 | Đăng ký tài khoản | Giảng viên tạo tài khoản mới | Chưa có tài khoản | Tài khoản tạo với quyền `STUDENT`; Admin nâng lên `TEACHER` | FR-01, FR-03 |
| UC-T02 | Đăng nhập | Giảng viên đăng nhập bằng email + mật khẩu | Đã có tài khoản `TEACHER` | Nhận JWT token | FR-02 |
| UC-T03 | Tạo phiên điểm danh | Giảng viên tạo session mới (có thể đặt hẹn giờ tự động đóng) | Đã đăng nhập (TEACHER) | Nhận `sessionId`, trạng thái `ACTIVE` | FR-04, FR-12 |
| UC-T04 | Lấy QR Code | Giảng viên lấy QR Code mới nhất để chiếu lên bảng | Session đang `ACTIVE` | Nhận token ngắn hạn (30–60s) | FR-05 |
| UC-T05 | Đóng phiên điểm danh | Giảng viên kết thúc buổi điểm danh | Session đang `ACTIVE` | Session chuyển `CLOSED`, dừng sinh QR | FR-04 |
| UC-T06 | Xem danh sách điểm danh | Giảng viên xem ai đã điểm danh trong session | Session đã tồn tại | Danh sách sinh viên kèm thời gian | FR-09 |
| UC-T07 | Xuất báo cáo | Giảng viên xem báo cáo theo lớp / ngày | Đã có dữ liệu điểm danh | Báo cáo tổng hợp | FR-09 |
| UC-T08 | Xóa phiên điểm danh | Giảng viên xóa session tạo nhầm | Session đã tồn tại | Session và dữ liệu điểm danh bị xóa | FR-04 |
| UC-T09 | Xem danh sách phiên điểm danh | Giảng viên xem tất cả session do mình tạo | Đã đăng nhập (TEACHER) | Danh sách các session | FR-13 |

#### Use Case Diagram — Giảng viên

```mermaid
graph LR
    GV(["👤 Giảng viên"])

    subgraph Tài khoản
        UC_T01(["UC-T01: Đăng ký"])
        UC_T02(["UC-T02: Đăng nhập"])
    end

    subgraph Quản lý Phiên
        UC_T03(["UC-T03: Tạo phiên"])
        UC_T09(["UC-T09: Danh sách phiên"])
        UC_T04(["UC-T04: Lấy QR Code"])
        UC_T05(["UC-T05: Đóng phiên"])
        UC_T08(["UC-T08: Xóa phiên"])
    end

    subgraph Báo cáo
        UC_T06(["UC-T06: Xem danh sách điểm danh"])
        UC_T07(["UC-T07: Xuất báo cáo"])
    end

    GV --> UC_T01
    GV --> UC_T02
    GV --> UC_T03
    GV --> UC_T04
    GV --> UC_T05
    GV --> UC_T06
    GV --> UC_T07
    GV --> UC_T08
    GV --> UC_T09
```

---

### 2.2 Use Cases của Sinh viên

| Mã | Use Case | Mô tả | Điều kiện tiên quyết | Kết quả | FR liên quan |
|----|----------|-------|----------------------|---------|-------------|
| UC-S01 | Đăng ký tài khoản | Sinh viên tạo tài khoản mới | Chưa có tài khoản | Tài khoản được tạo với quyền `STUDENT` | FR-01, FR-03 |
| UC-S02 | Đăng nhập | Sinh viên đăng nhập bằng email + mật khẩu | Đã có tài khoản | Nhận JWT token | FR-02 |
| UC-S03 | Quét QR và điểm danh | Sinh viên quét QR Code đang chiếu → hệ thống gửi token lên API | Đã đăng nhập, session `ACTIVE`, token hợp lệ | Điểm danh thành công | FR-07, FR-06, FR-08 |
| UC-S04 | Xem lịch sử điểm danh | Sinh viên xem các buổi mình đã điểm danh | Đã đăng nhập | Danh sách lịch sử cá nhân | FR-09 |

#### Use Case Diagram — Sinh viên

```mermaid
graph LR
    SV(["👤 Sinh viên"])

    subgraph Tài khoản
        UC_S01(["UC-S01: Đăng ký"])
        UC_S02(["UC-S02: Đăng nhập"])
    end

    subgraph Điểm danh
        UC_S03(["UC-S03: Quét QR & điểm danh"])
        UC_S04(["UC-S04: Xem lịch sử"])
    end

    SV --> UC_S01
    SV --> UC_S02
    SV --> UC_S03
    SV --> UC_S04
```

---

### 2.3 Use Cases của Quản trị viên (Admin)

| Mã | Use Case | Mô tả | Điều kiện tiên quyết | Kết quả | FR liên quan |
|----|----------|-------|----------------------|---------|-------------|
| UC-A01 | Đăng nhập Admin | Admin đăng nhập vào hệ thống | Tài khoản nhóm `ADMIN` (tạo sẵn khi deploy) | Nhận JWT token quyền Admin | FR-02 |
| UC-A02 | Xem danh sách người dùng | Admin xem tất cả tài khoản | Đã đăng nhập (ADMIN) | Danh sách email, họ tên, role hiện tại | FR-10 |
| UC-A03 | Cấp quyền Giảng viên | Admin nâng tài khoản `STUDENT` lên `TEACHER` | Đã đăng nhập (ADMIN) | User chuyển sang nhóm `TEACHER` | FR-11 |
| UC-A04 | Thu hồi quyền Giảng viên | Admin hạ `TEACHER` về `STUDENT` | Đã đăng nhập (ADMIN) | User chuyển sang nhóm `STUDENT` | FR-11 |

#### Use Case Diagram — Admin

```mermaid
graph LR
    AD(["👤 Admin"])

    subgraph Tài khoản
        UC_A01(["UC-A01: Đăng nhập"])
    end

    subgraph Quản lý Người dùng
        UC_A02(["UC-A02: Xem danh sách user"])
        UC_A03(["UC-A03: Cấp quyền Giảng viên"])
        UC_A04(["UC-A04: Thu hồi quyền Giảng viên"])
    end

    AD --> UC_A01
    AD --> UC_A02
    AD --> UC_A03
    AD --> UC_A04
```

---

### 2.4 Các trường hợp ngoại lệ (Alternative Flows)

| Mã | Tình huống | Nguyên nhân | Phản hồi hệ thống |
|----|-----------|-------------|-------------------|
| UC-F01 | Điểm danh thất bại — Token hết hạn | QR đã xoay sang token mới, token cũ quá TTL | `403 Token expired` |
| UC-F02 | Điểm danh thất bại — Token không hợp lệ | Token giả mạo hoặc đã được dùng trước đó | `403 Invalid token` |
| UC-F03 | Điểm danh thất bại — Đã điểm danh rồi | Sinh viên quét lần 2 trong cùng session | `409 Already checked in` |
| UC-F04 | Điểm danh thất bại — Session đã đóng | Giảng viên đã kết thúc buổi học | `400 Session is closed` |
| UC-F05 | Lấy QR thất bại — Session không tồn tại | `sessionId` sai hoặc đã bị xóa | `404 Session not found` |

## 3. Sequence Diagrams (Luồng nghiệp vụ)

### SD-01: Đăng ký tài khoản (Giảng viên / Sinh viên)

```mermaid
sequenceDiagram
    actor User as Người dùng (Giảng viên / Sinh viên)
    participant FE as Frontend
    participant Cognito as Amazon Cognito
    participant Auth as λ Auth

    User->>FE: Nhập email, mật khẩu, họ tên
    FE->>Cognito: SignUp(email, password, attributes)
    Cognito-->>FE: Gửi mã xác nhận qua email
    FE-->>User: Yêu cầu nhập mã xác nhận

    User->>FE: Nhập mã xác nhận
    FE->>Cognito: ConfirmSignUp(email, code)
    Cognito->>Auth: Post Confirmation Trigger
    Auth->>Cognito: AdminAddUserToGroup(username, "STUDENT")
    Cognito-->>Auth: OK
    Cognito-->>FE: Xác nhận tài khoản thành công
    FE-->>User: Đăng ký thành công, mời đăng nhập

    Note over User,Auth: Mọi tài khoản đều được gán nhóm STUDENT ban đầu.<br/>Giảng viên cần Admin nâng cấp lên nhóm TEACHER.
```

### SD-02: Đăng nhập (Giảng viên / Sinh viên / Admin)

```mermaid
sequenceDiagram
    actor User as Người dùng
    participant FE as Frontend
    participant Cognito as Amazon Cognito

    User->>FE: Nhập email + mật khẩu
    FE->>Cognito: InitiateAuth(email, password)

    alt Thành công
        Cognito-->>FE: JWT Token (idToken, accessToken, refreshToken)
        FE-->>User: Đăng nhập thành công, chuyển hướng trang chủ
    else Sai thông tin
        Cognito-->>FE: 400 NotAuthorizedException
        FE-->>User: Sai email hoặc mật khẩu
    end
```

### SD-03: Giảng viên tạo phiên điểm danh

```mermaid
sequenceDiagram
    actor GV as Giảng viên
    participant FE as Frontend
    participant APIGW as API Gateway
    participant Session as λ Session
    participant QRGen as λ QR Generator
    participant SessionDB as DynamoDB (Sessions)
    participant TokenDB as DynamoDB (QrTokens)

    GV->>FE: Điền thông tin buổi học (tùy chọn hẹn giờ), nhấn "Tạo phiên"
    FE->>APIGW: POST /sessions { className, duration } (Bearer)
    APIGW->>APIGW: Xác thực JWT (Cognito Authorizer, yêu cầu nhóm TEACHER)
    APIGW->>Session: Invoke Lambda
    Session->>SessionDB: PutItem { sessionId, className, teacherId, status: ACTIVE, expiresAt }
    SessionDB-->>Session: OK
    Session-->>APIGW: 201 { sessionId }
    APIGW-->>FE: 201 { sessionId }
    FE-->>GV: Chuyển sang màn hình hiển thị QR Code

    Note over FE: Frontend tự động gọi lại mỗi 30 giây để cập nhật QR mới
    loop Mỗi 30 giây (trong khi session ACTIVE)
        FE->>APIGW: GET /sessions/{sessionId}/qr (Bearer jwtToken)
        APIGW->>QRGen: Invoke Lambda
        QRGen->>QRGen: token = HMAC(sessionId + timestamp + secretKey)
        QRGen->>TokenDB: PutItem { token, sessionId, ttl: now+60s }
        TokenDB-->>QRGen: OK
        QRGen-->>APIGW: 200 { token, expiresIn: 60 }
        APIGW-->>FE: 200 { token }
        FE->>FE: Render QR Code mới, hiển thị đếm ngược
    end
```

### SD-04: Sinh viên quét QR và điểm danh

```mermaid
sequenceDiagram
    actor SV as Sinh viên
    participant APP as Trình duyệt
    participant APIGW as API Gateway
    participant Checkin as λ Check-in
    participant SessionDB as DynamoDB (Sessions)
    participant TokenDB as DynamoDB (QrTokens)
    participant AttendDB as DynamoDB (Attendance)

    SV->>APP: Quét QR Code bằng camera
    APP->>APP: Giải mã QR, lấy token
    APP->>APIGW: POST /checkin { token } (Bearer jwtToken)
    APIGW->>APIGW: Xác thực JWT (Cognito Authorizer)
    APIGW->>Checkin: Invoke Lambda

    Checkin->>TokenDB: GetItem { token }

    alt Token không tồn tại (hết hạn hoặc giả mạo)
        TokenDB-->>Checkin: null
        Checkin-->>APIGW: 403 Invalid or expired token
        APIGW-->>APP: 403
        APP-->>SV: QR Code không hợp lệ hoặc đã hết hạn

    else Token hợp lệ
        TokenDB-->>Checkin: Item { sessionId, ttl }
        Checkin->>SessionDB: GetItem { sessionId }
        
        alt Quá thời gian hẹn giờ (now > expiresAt) hoặc đã đóng thủ công
            SessionDB-->>Checkin: Item { status: CLOSED hoặc expiresAt }
            Checkin-->>APIGW: 400 Session expired/closed
            APIGW-->>APP: 400
            APP-->>SV: Phiên điểm danh đã kết thúc
            
        else Phiên đang mở
            SessionDB-->>Checkin: Item { status: ACTIVE }
            Checkin->>AttendDB: GetItem { sessionId, studentId }

            alt Đã điểm danh rồi
                AttendDB-->>Checkin: Item tồn tại
                Checkin-->>APIGW: 409 Already checked in
                APIGW-->>APP: 409
                APP-->>SV: Bạn đã điểm danh buổi này rồi

            else Chưa điểm danh
                AttendDB-->>Checkin: null
                Checkin->>AttendDB: PutItem { sessionId, studentId, checkinTime, deviceFingerprint }
                AttendDB-->>Checkin: OK
                Checkin->>TokenDB: DeleteItem { token }
                TokenDB-->>Checkin: OK
                Checkin-->>APIGW: 200 Check-in thành công
                APIGW-->>APP: 200
                APP-->>SV: Điểm danh thành công!
            end
        end
    end
```

### SD-05: Giảng viên kết thúc phiên và xem báo cáo

```mermaid
sequenceDiagram
    actor GV as Giảng viên
    participant FE as Frontend
    participant APIGW as API Gateway
    participant Session as λ Session
    participant Report as λ Report
    participant SessionDB as DynamoDB (Sessions)
    participant AttendDB as DynamoDB (Attendance)

    GV->>FE: Nhấn "Kết thúc điểm danh"
    FE->>APIGW: PATCH /sessions/{sessionId}/close (Bearer jwtToken)
    APIGW->>Session: Invoke Lambda
    Session->>SessionDB: UpdateItem { status: CLOSED, endTime: now }
    SessionDB-->>Session: OK
    Session-->>APIGW: 200 Session closed
    APIGW-->>FE: 200
    FE-->>GV: Đã đóng phiên điểm danh

    GV->>FE: Nhấn "Xem báo cáo"
    FE->>APIGW: GET /sessions/{sessionId}/report (Bearer jwtToken)
    APIGW->>Report: Invoke Lambda
    Report->>AttendDB: Query { sessionId }
    AttendDB-->>Report: [{ studentId, checkinTime }, ...]
    Report-->>APIGW: 200 { total: N, attendees: [...] }
    APIGW-->>FE: 200
    FE-->>GV: Hiển thị danh sách N sinh viên đã điểm danh
```

### SD-06: Admin thay đổi role tài khoản

```mermaid
sequenceDiagram
    actor Admin
    participant FE as Frontend
    participant APIGW as API Gateway
    participant AdminFn as λ Admin
    participant Cognito as Amazon Cognito

    Admin->>FE: Chọn tài khoản, nhấn "Cấp quyền Giảng viên"
    FE->>APIGW: POST /admin/assign-teacher { username } (Bearer jwtToken)
    APIGW->>APIGW: Xác thực JWT (chỉ cho phép nhóm ADMIN)

    alt Không phải Admin
        APIGW-->>FE: 403 Forbidden
        FE-->>Admin: Không có quyền thực hiện thao tác này
    else Là Admin
        APIGW->>AdminFn: Invoke Lambda
        AdminFn->>Cognito: AdminAddUserToGroup(username, "TEACHER")
        Cognito-->>AdminFn: OK
        AdminFn->>Cognito: AdminRemoveUserFromGroup(username, "STUDENT")
        Cognito-->>AdminFn: OK
        AdminFn-->>APIGW: 200 Cập nhật quyền thành công
        APIGW-->>FE: 200
        FE-->>Admin: Cập nhật quyền thành công
    end
```
