# Tổng quan (Overview) — Smart QR Attendance

## 1. Giới thiệu

Tài liệu này đặc tả các yêu cầu phần mềm cho hệ thống **Smart QR Attendance**. Hệ thống sử dụng QR Code động để giải quyết bài toán điểm danh tự động, nhanh chóng và chống gian lận.

### 1.1 Vấn đề cốt lõi

QR Code tĩnh (in ra giấy) rất dễ bị gian lận — sinh viên chụp ảnh rồi chuyển cho bạn khác điểm danh hộ.
Hệ thống này giải quyết bài toán đó bằng **QR Code động** — token thay đổi mỗi 30–60 giây và chỉ dùng được **1 lần duy nhất**.

## 2. Đối tượng sử dụng (Stakeholders)

- **Giảng viên**: Tạo phiên điểm danh, mở/đóng phiên, lấy QR Code chiếu lên bảng, xem và xuất báo cáo.
- **Sinh viên**: Đăng ký, đăng nhập tài khoản, quét QR Code để ghi nhận điểm danh.
- **Quản trị viên (Admin)**: Quản lý danh sách tài khoản người dùng, phân quyền nhóm (Giảng viên / Sinh viên).

## 3. Yêu cầu phi chức năng cốt lõi

### 3.1 Cơ chế chống gian lận

| Phương pháp            | Mô tả                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| **QR xoay vòng**       | Token ẩn trong mã QR thay đổi mỗi 30–60 giây liên tục.                                             |
| **Single-use token**   | Mỗi token chỉ dùng được 1 lần, API xóa token ngay lập tức sau khi check-in thành công.             |
| **DynamoDB TTL**       | Token hết hạn được cơ sở dữ liệu tự động xóa sau N giây, không cần dọn dẹp thủ công.               |
| **Device fingerprint** | Ghi lại User-Agent / IP để phát hiện điểm danh hộ hàng loạt.                                       |
| **Xác thực danh tính** | Cả sinh viên và Giảng viên phải đăng nhập (thông qua AWS Cognito), không hỗ trợ điểm danh ẩn danh. |

### 3.2 Hiệu năng & Quy mô

- Xây dựng trên **AWS Lambda** (Serverless) có khả năng tự động mở rộng (auto-scaling) tức thì khi có 100-200 sinh viên cùng quét QR Code trong vòng 5 giây.
- **DynamoDB** cung cấp độ trễ (latency) cực thấp cỡ mili-giây, đảm bảo trải nghiệm điểm danh không bị nghẽn.
