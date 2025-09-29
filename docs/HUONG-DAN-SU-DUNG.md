# HƯỚNG DẪN SỬ DỤNG HỆ THỐNG QUẢN LÝ SỰ KIỆN

## Tổng quan hệ thống

Hệ thống quản lý sự kiện EXP Guest System là một nền tảng toàn diện để quản lý sự kiện, khách mời và quy trình check-in/check-out. Hệ thống hỗ trợ 3 vai trò chính:

- **Manager sự kiện**: Quản lý toàn bộ hệ thống, sự kiện và khách mời
- **Host**: Quản lý sự kiện cụ thể và khách mời của sự kiện đó
- **Khách hàng**: Nhận thiệp mời, RSVP và check-in tại sự kiện

---

## 1. MANAGER SỰ KIỆN

### 1.1 Đăng nhập hệ thống

**Truy cập**: https://event.expsolution.io/login

**Thông tin đăng nhập**:
- Username: `admin` hoặc `hung`
- Password: [Liên hệ quản trị viên]

### 1.2 Quản lý sự kiện

#### Tạo sự kiện mới
1. Vào **Dashboard** → **Quản lý sự kiện**
2. Click **"Thêm sự kiện mới"**
3. Điền thông tin:
   - Tên sự kiện
   - Ngày giờ tổ chức
   - Địa điểm
   - Mô tả
4. Click **"Lưu"**

#### Chỉnh sửa sự kiện
1. Tìm sự kiện cần chỉnh sửa
2. Click **"Sửa"** (biểu tượng bút chì)
3. Cập nhật thông tin
4. Click **"Lưu"**

#### Xóa sự kiện
1. Tìm sự kiện cần xóa
2. Click **"Xóa"** (biểu tượng thùng rác)
3. Xác nhận xóa

### 1.3 Quản lý khách mời

#### Thêm khách mời
1. Vào **Dashboard** → **Quản lý khách mời**
2. Click **"Thêm khách mời"**
3. Điền thông tin:
   - Họ và tên
   - Danh xưng (Mr/Ms/Dr)
   - Vai trò/Chức vụ
   - Tổ chức/Công ty
   - Email
   - Số điện thoại
   - Tag (VIP, Regular, etc.)
   - Host (người tiếp khách)
   - Sự kiện
4. Click **"Lưu"**

#### Import khách mời từ Excel
1. Vào **Quản lý khách mời**
2. Click **"Import Excel"**
3. Tải file mẫu
4. Điền thông tin theo mẫu
5. Upload file
6. Kiểm tra và xác nhận import

#### Chỉnh sửa thông tin khách mời
1. Tìm khách mời cần chỉnh sửa
2. Click **"Sửa"**
3. Cập nhật thông tin
4. Click **"Lưu"**

#### Gửi thiệp mời
1. Chọn khách mời cần gửi thiệp
2. Click **"Gửi thiệp mời"**
3. Hệ thống sẽ tạo QR code và link thiệp mời
4. Gửi link cho khách mời qua email/SMS

### 1.4 Quản lý check-in/check-out

#### Trang check-in
1. Vào **Dashboard** → **Check-in**
2. Chọn sự kiện cần quản lý
3. Xem danh sách khách mời theo trạng thái:
   - **Tổng số**: Tất cả khách mời
   - **Đã check-in**: Khách đã đến
   - **Chưa check-in**: Khách chưa đến

#### Check-in thủ công
1. Tìm khách mời trong danh sách
2. Click **"Sửa"** trên card khách mời
3. Click **"Check-in"**
4. Xác nhận thời gian check-in

#### Check-out khách mời
1. Tìm khách đã check-in
2. Click **"Sửa"**
3. Click **"Check-out"**
4. Xác nhận

#### Check-in bằng QR code
1. Bật camera trên trang check-in
2. Quét QR code từ thiệp mời của khách
3. Hệ thống tự động check-in

#### Thao tác hàng loạt
1. Bật chế độ **"Chọn nhiều"**
2. Chọn các khách mời cần thao tác
3. Chọn hành động:
   - Check-in hàng loạt
   - Check-out hàng loạt
   - Gửi thiệp mời hàng loạt

### 1.5 Thống kê và báo cáo

#### Xem thống kê tổng quan
1. Vào **Dashboard** → **Thống kê**
2. Xem các chỉ số:
   - Tổng số khách mời
   - Số khách đã RSVP
   - Tỷ lệ check-in
   - Khách mời mới nhất

#### Xuất báo cáo
1. Vào **Quản lý khách mời**
2. Chọn bộ lọc cần thiết
3. Click **"Xuất Excel"**
4. Tải file báo cáo

---

## 2. HOST

### 2.1 Đăng nhập

**Truy cập**: https://event.expsolution.io/login

**Thông tin đăng nhập**: Được cấp bởi Manager

### 2.2 Quản lý sự kiện được phân công

#### Xem danh sách sự kiện
1. Vào **Dashboard**
2. Xem danh sách sự kiện được phân công
3. Chọn sự kiện cần quản lý

#### Quản lý khách mời của sự kiện
1. Vào **Quản lý khách mời**
2. Lọc theo sự kiện được phân công
3. Thực hiện các thao tác:
   - Thêm khách mời mới
   - Chỉnh sửa thông tin
   - Gửi thiệp mời
   - Theo dõi trạng thái RSVP

### 2.3 Theo dõi check-in

#### Xem trạng thái khách mời
1. Vào **Check-in**
2. Chọn sự kiện
3. Theo dõi:
   - Khách đã check-in
   - Khách chưa đến
   - Thời gian check-in

#### Hỗ trợ check-in
1. Hướng dẫn khách quét QR code
2. Check-in thủ công nếu cần
3. Cập nhật thông tin khách mời

---

## 3. KHÁCH HÀNG - QUY TRÌNH SỬ DỤNG

### 3.1 Nhận thiệp mời

#### Qua email/SMS
1. Nhận link thiệp mời từ Host/Manager
2. Click vào link để mở thiệp mời
3. Xem thông tin sự kiện

#### Qua QR code
1. Nhận QR code từ Host/Manager
2. Quét QR code bằng camera điện thoại
3. Mở link thiệp mời

### 3.2 Xem thông tin sự kiện

#### Thông tin hiển thị
- Tên sự kiện
- Ngày giờ tổ chức
- Địa điểm
- Mô tả sự kiện
- Thông tin khách mời

#### QR code cá nhân
- QR code riêng cho từng khách mời
- Dùng để check-in tại sự kiện
- Không thể chia sẻ cho người khác

### 3.3 RSVP (Xác nhận tham gia)

#### Thực hiện RSVP
1. Mở thiệp mời
2. Click **"Xác nhận tham gia"** hoặc **"Không thể tham gia"**
3. Điền thông tin bổ sung (nếu có)
4. Click **"Gửi"**

#### Trạng thái RSVP
- **Đã xác nhận**: Sẽ tham gia sự kiện
- **Từ chối**: Không thể tham gia
- **Chưa phản hồi**: Chưa xác nhận

#### Thay đổi RSVP
1. Mở lại thiệp mời
2. Click **"Thay đổi RSVP"**
3. Chọn trạng thái mới
4. Xác nhận

### 3.4 Check-in tại sự kiện

#### Chuẩn bị
1. Đến địa điểm sự kiện
2. Mở thiệp mời trên điện thoại
3. Chuẩn bị QR code cá nhân

#### Quy trình check-in
1. **Tự động (khuyến nghị)**:
   - Tìm bàn check-in
   - Hiển thị QR code cho nhân viên
   - Nhân viên quét QR code
   - Nhận xác nhận check-in

2. **Thủ công**:
   - Cung cấp thông tin cho nhân viên
   - Nhân viên tìm tên trong danh sách
   - Xác nhận thông tin
   - Check-in thủ công

#### Xác nhận check-in thành công
- Nhận thông báo "Check-in thành công"
- Thời gian check-in được ghi nhận
- Có thể xem lại thông tin trên thiệp mời

### 3.5 Check-out (nếu cần)

#### Khi rời sự kiện
1. Thông báo cho nhân viên
2. Nhân viên thực hiện check-out
3. Nhận xác nhận

---

## 4. TÍNH NĂNG BỔ SUNG

### 4.1 Tìm kiếm và lọc

#### Tìm kiếm khách mời
- Tìm theo tên
- Tìm theo email
- Tìm theo tổ chức
- Tìm theo tag

#### Lọc dữ liệu
- Lọc theo sự kiện
- Lọc theo trạng thái RSVP
- Lọc theo trạng thái check-in
- Lọc theo ngày tạo

### 4.2 Thông báo

#### Thông báo hệ thống
- Thông báo khi có khách mời mới
- Thông báo khi khách RSVP
- Thông báo khi khách check-in
- Thông báo lỗi hệ thống

#### Cài đặt thông báo
1. Vào **Cài đặt** → **Thông báo**
2. Bật/tắt các loại thông báo
3. Cài đặt email/SMS

### 4.3 Bảo mật

#### Đăng nhập an toàn
- Sử dụng mật khẩu mạnh
- Đăng xuất khi không sử dụng
- Không chia sẻ thông tin đăng nhập

#### Quyền truy cập
- Manager: Toàn quyền
- Host: Quyền hạn chế theo sự kiện
- Khách mời: Chỉ xem thiệp mời cá nhân

---

## 5. XỬ LÝ SỰ CỐ

### 5.1 Lỗi thường gặp

#### Không thể đăng nhập
1. Kiểm tra username/password
2. Liên hệ quản trị viên
3. Thử đăng nhập lại

#### Không nhận được thiệp mời
1. Kiểm tra email/spam
2. Liên hệ Host/Manager
3. Yêu cầu gửi lại link

#### QR code không hoạt động
1. Kiểm tra kết nối internet
2. Thử refresh trang
3. Sử dụng check-in thủ công

#### Check-in không thành công
1. Kiểm tra thông tin cá nhân
2. Liên hệ nhân viên check-in
3. Thử lại sau vài phút

### 5.2 Liên hệ hỗ trợ

#### Thông tin liên hệ
- Email: support@expsolution.io
- Hotline: [Số điện thoại hỗ trợ]
- Website: https://expsolution.io

#### Thời gian hỗ trợ
- Thứ 2 - Thứ 6: 8:00 - 17:00
- Thứ 7: 8:00 - 12:00
- Chủ nhật: Nghỉ

---

## 6. CẬP NHẬT VÀ BẢO TRÌ

### 6.1 Cập nhật hệ thống
- Hệ thống tự động cập nhật
- Thông báo trước khi cập nhật
- Thời gian cập nhật: 2:00 - 4:00 AM

### 6.2 Sao lưu dữ liệu
- Tự động sao lưu hàng ngày
- Lưu trữ 30 ngày
- Khôi phục khi cần thiết

---

**Phiên bản tài liệu**: 1.0  
**Ngày cập nhật**: 28/09/2025  
**Liên hệ**: support@expsolution.io
