## Dự án: Hệ thống Quản lý Khách mời – Lễ kỷ niệm 15 năm

### 1. Mục tiêu
- Xây dựng hệ thống hỗ trợ Ban tổ chức (BTC) quản lý danh sách khách mời, gửi thiệp mời kèm mã QR, thu thập phản hồi (RSVP) và hỗ trợ check-in tại sự kiện.
- Giai đoạn này chỉ thực hiện phân tích – thiết kế, chưa triển khai mã nguồn.

### 2. Phạm vi
- Quản lý dữ liệu khách mời (tạo/sửa/xóa, import CSV).
- Phát sinh và phân phối mã QR unique cho mỗi khách.
- Thu thập và theo dõi phản hồi RSVP (Tham gia/Từ chối/Chưa phản hồi).
- Check-in bằng quét QR tại cổng sự kiện.
- Cung cấp API phục vụ frontend web/app.

### 3. Vai trò & User Stories

#### 3.1. Ban tổ chức (BTC)
- Nhập hoặc import khách mời từ CSV để tạo nhanh danh sách.
- Cấp phát mã QR cho từng khách sau khi tạo.
- Gửi link thiệp mời có chứa mã QR tới khách mời.
- Theo dõi phản hồi RSVP theo thời gian thực.
- Quét QR để check-in khách tại sự kiện.

User Stories (BTC):
- Là BTC, tôi muốn import CSV để có ngay danh sách khách mời trong hệ thống.
- Là BTC, tôi muốn tạo mã QR duy nhất cho mỗi khách để sử dụng khi check-in.
- Là BTC, tôi muốn xem danh sách và trạng thái RSVP để dự trù hậu cần.
- Là BTC, tôi muốn quét QR tại cổng để ghi nhận check-in nhanh chóng, chính xác.

#### 3.2. Khách mời
- Nhận thiệp mời + QR code qua link.
- Xem thông tin chương trình (thời gian, địa điểm, agenda).
- Phản hồi tham gia hoặc từ chối (RSVP) qua link.
- Dùng QR để check-in khi tới sự kiện.

User Stories (Khách mời):
- Là khách, tôi muốn nhận link thiệp mời kèm QR để lưu giữ thuận tiện.
- Là khách, tôi muốn xem thông tin chương trình để lên kế hoạch tham dự.
- Là khách, tôi muốn phản hồi RSVP dễ dàng trên thiết bị di động.
- Là khách, tôi muốn dùng QR để check-in nhanh khi đến nơi.

### 4. Acceptance Criteria (AC)
- Import CSV thành công: hệ thống hiển thị danh sách khách đúng số lượng và trường dữ liệu.
- Mỗi khách có mã QR duy nhất, không trùng lặp, liên kết được tới hồ sơ khách tương ứng.
- Cập nhật RSVP: thay đổi trạng thái (Tham gia/Từ chối) được lưu và phản ánh trên danh sách.
- Quét QR hợp lệ: ghi nhận check-in thành công, thời gian check-in được lưu, không cho check-in trùng lần (cảnh báo lần 2).
- API đáp ứng tối thiểu các endpoint: /guests/import, /guests, /guests/{id}/rsvp, /guests/{id}/checkin, /events.

### 5. Ràng buộc & Giả định
- CSDL: SQLite cho giai đoạn thiết kế/POC.
- QR code chỉ sử dụng nội bộ sự kiện; không yêu cầu chữ ký số nâng cao.
- Hệ thống hỗ trợ import CSV với header chuẩn do BTC cung cấp.
- Frontend có thể là Web/Responsive; App mobile là tùy chọn.

### 6. Phi chức năng (NFR)
- Tính sẵn sàng: Hệ thống chịu được tải check-in cục bộ (offline-first có thể cân nhắc ở bản sau).
- Hiệu năng: Tra cứu, check-in trong < 1 giây trên mạng nội bộ.
- Bảo mật: Ẩn thông tin nhạy cảm của khách; link RSVP có token.
- Khả năng mở rộng: Cho phép chuyển từ SQLite sang DB khác ở giai đoạn triển khai.

### 7. Quy trình phát triển (Iterative)
- Chia nhỏ hạng mục theo checklist: Backend (DB, API CRUD, QR, RSVP, Check-in), Frontend (Quản lý khách, Thiệp mời, RSVP, Check-in), Test (CSV, QR, RSVP, Check-in).
- Chu kỳ: Phân tích → Thiết kế → Dev (sau này) → Test → Chốt → Triển khai tiếp.

### 8. Rủi ro & Biện pháp
- Dữ liệu CSV không đồng nhất: chuẩn hóa mẫu file, xác thực dữ liệu khi import.
- Khách không phản hồi RSVP: thêm nhắc nhở qua email/SMS (tùy chọn tương lai).
- Mạng yếu tại cổng: cung cấp chế độ cache tạm và đồng bộ lại (tương lai).
- QR bị lộ: mã hóa token chứa id khách + expiry ngắn cho link RSVP.
