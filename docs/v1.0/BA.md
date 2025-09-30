# Business Analysis (BA) - Version 1.0

## Tổng quan hệ thống

Hệ thống Quản lý Khách mời Sự kiện (EXP Guest Management System) được thiết kế để quản lý toàn bộ quy trình từ tạo sự kiện, mời khách, theo dõi RSVP đến check-in tại sự kiện.

## Luồng nghiệp vụ chính

### 1. Quản lý Sự kiện (Event Management)

#### 1.1. Tạo sự kiện
- **Actor**: Admin/Manager
- **Mô tả**: Tạo sự kiện mới với thông tin chi tiết
- **Dữ liệu cần thiết**:
  - Tên sự kiện, thời gian, địa điểm
  - Chương trình sự kiện (text + markdown)
  - Thông tin branding (logo, màu sắc)
  - Số khách tối đa
- **Tác động DB**: INSERT vào bảng `events`

#### 1.2. Cập nhật sự kiện
- **Actor**: Admin/Manager
- **Mô tả**: Chỉnh sửa thông tin sự kiện
- **Tác động DB**: UPDATE bảng `events`

#### 1.3. Xóa sự kiện
- **Actor**: Admin
- **Mô tả**: Xóa sự kiện và tất cả dữ liệu liên quan
- **Tác động DB**: 
  - DELETE từ bảng `events` (CASCADE)
  - Tự động xóa tất cả guests, tokens liên quan

### 2. Quản lý Khách mời (Guest Management)

#### 2.1. Import danh sách khách
- **Actor**: Manager/Host
- **Mô tả**: Import khách từ file CSV
- **Dữ liệu cần thiết**:
  - Họ tên, chức vụ, tổ chức
  - Thông tin liên hệ (email, phone)
  - Phân loại VIP/Regular
- **Tác động DB**: 
  - INSERT vào bảng `guests`
  - Tự động sinh `qr_code`, `invitation_id`, `qr_token`

#### 2.2. Quản lý thông tin khách
- **Actor**: Manager/Host
- **Mô tả**: Cập nhật thông tin khách mời
- **Tác động DB**: UPDATE bảng `guests`

#### 2.3. Phân loại khách
- **Actor**: Manager/Host
- **Mô tả**: Gán nhãn và phân loại khách
- **Dữ liệu**: `group_tag`, `is_vip`
- **Tác động DB**: UPDATE bảng `guests`

### 3. Hệ thống RSVP (Response System)

#### 3.1. Gửi thiệp mời
- **Actor**: Manager/Host
- **Mô tả**: Gửi thiệp mời qua email với QR code
- **Dữ liệu cần thiết**:
  - Template email với branding
  - QR code unique cho mỗi khách
  - Link RSVP cá nhân
- **Tác động DB**: 
  - SELECT từ bảng `guests`, `events`
  - UPDATE `email_subject_last` trong `guests`

#### 3.2. Xử lý phản hồi RSVP
- **Actor**: Khách mời
- **Mô tả**: Khách phản hồi tham gia/từ chối
- **Tác động DB**: UPDATE `rsvp_status` trong bảng `guests`

#### 3.3. Theo dõi RSVP
- **Actor**: Manager/Host
- **Mô tả**: Xem báo cáo tình trạng RSVP
- **Tác động DB**: SELECT với GROUP BY `rsvp_status`

### 4. Hệ thống Check-in

#### 4.1. Check-in bằng QR
- **Actor**: Nhân viên check-in
- **Mô tả**: Quét QR code để check-in khách
- **Tác động DB**: 
  - SELECT từ bảng `guests` theo `qr_code`
  - UPDATE `checkin_at` trong bảng `guests`
  - INSERT vào bảng `tokens` (audit log)

#### 4.2. Kiểm tra trùng lặp check-in
- **Actor**: Hệ thống
- **Mô tả**: Ngăn chặn check-in nhiều lần
- **Tác động DB**: SELECT `checkin_at` để kiểm tra

### 5. Hệ thống Phân quyền (User Management)

#### 5.1. Quản lý người dùng
- **Actor**: Admin
- **Mô tả**: Tạo, cập nhật, xóa tài khoản người dùng
- **Tác động DB**: 
  - CRUD trên bảng `users`
  - CRUD trên bảng `user_roles`

#### 5.2. Phân quyền vai trò
- **Actor**: Admin
- **Mô tả**: Gán vai trò cho người dùng
- **Vai trò**:
  - **Admin**: Toàn quyền hệ thống
  - **Manager**: Quản lý sự kiện và khách mời
  - **Host**: Quản lý khách mời trong sự kiện
- **Tác động DB**: INSERT/UPDATE bảng `user_roles`

### 6. Hệ thống Token và Bảo mật

#### 6.1. Quản lý token khách
- **Actor**: Hệ thống
- **Mô tả**: Tạo và quản lý token cho QR code
- **Tác động DB**: INSERT vào bảng `tokens`

#### 6.2. Quản lý token người dùng
- **Actor**: Hệ thống
- **Mô tả**: Tạo token cho session người dùng
- **Tác động DB**: INSERT vào bảng `user_tokens`

## Quy tắc nghiệp vụ

### 1. Ràng buộc dữ liệu
- Mỗi khách chỉ thuộc về một sự kiện
- `invitation_id` phải unique trong phạm vi một sự kiện
- `qr_code` phải unique toàn hệ thống
- Email và phone phải unique (nếu có)

### 2. Quy tắc RSVP
- Khách có thể thay đổi RSVP nhiều lần
- Hệ thống ghi nhận lần thay đổi cuối cùng
- RSVP mặc định là "pending"

### 3. Quy tắc Check-in
- Không thể check-in trước thời gian sự kiện
- Không thể check-in nhiều lần
- Check-in tự động cập nhật `rsvp_status` thành "accepted"

### 4. Quy tắc Phân quyền
- Mỗi user có thể có nhiều vai trò
- Admin có thể quản lý tất cả sự kiện
- Manager chỉ quản lý sự kiện được phân công
- Host chỉ quản lý khách trong sự kiện được phân công

## Tác động của Database Schema

### 1. Performance
- **Indexes**: Được tối ưu cho các truy vấn thường xuyên
  - Tìm kiếm khách theo tên, email, phone
  - Lọc khách theo sự kiện, trạng thái RSVP
  - Tìm kiếm sự kiện theo tên, thời gian

### 2. Data Integrity
- **Foreign Keys**: Đảm bảo tính toàn vẹn dữ liệu
- **Unique Constraints**: Ngăn chặn dữ liệu trùng lặp
- **Cascade Delete**: Tự động xóa dữ liệu liên quan

### 3. Scalability
- **Partitioning**: Có thể partition bảng `guests` theo `event_id`
- **Archiving**: Có thể archive dữ liệu cũ từ bảng `tokens`

### 4. Security
- **Password Hashing**: Mật khẩu được hash bằng Werkzeug
- **Token Management**: Token có thời hạn và trạng thái
- **Role-based Access**: Phân quyền chi tiết theo vai trò

## Báo cáo và Analytics

### 1. Báo cáo RSVP
- Tổng số khách mời theo sự kiện
- Tỷ lệ phản hồi RSVP
- Phân tích theo nhóm khách (VIP, Regular)

### 2. Báo cáo Check-in
- Số lượng check-in thực tế
- Thời gian check-in trung bình
- Tỷ lệ check-in so với RSVP

### 3. Báo cáo Sự kiện
- Hiệu suất các sự kiện
- Xu hướng tham gia theo thời gian
- Phân tích khách mời theo tổ chức

## Tích hợp với hệ thống khác

### 1. Email Service
- Gửi thiệp mời tự động
- Template email với branding
- Tracking email delivery

### 2. QR Code Service
- Tạo QR code unique
- Validation QR code tại check-in
- Mobile app integration

### 3. Analytics Service
- Real-time dashboard
- Export dữ liệu
- API cho báo cáo
