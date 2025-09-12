## Thiết kế hệ thống (Design)

### 1. Mô hình 4C

- Context: BTC và Khách mời tương tác với Hệ thống Quản lý Khách mời.
- Container:
  - Frontend: Web (React/Next.js gợi ý), hiển thị danh sách, RSVP, QR, check-in.
  - Backend: API (Python/Flask gợi ý), xử lý CSV, QR, RSVP, check-in.
  - Database: SQLite (giai đoạn thiết kế/POC).
- Component (Backend chính):
  - Guest Management: CRUD khách, import CSV, tìm kiếm/lọc.
  - QR Service: sinh mã QR unique, tạo link thiệp mời.
  - RSVP Service: cập nhật trạng thái RSVP, log thay đổi.
  - Check-in Service: xác thực QR, ghi nhận thời gian check-in, chặn trùng lặp.
  - Event Service: CRUD sự kiện, cung cấp thông tin chương trình.

### 2. Kiến trúc & Lược đồ DB

- Bảng `Event`:
  - id, name, start_datetime, location, agenda
- Bảng `Guest`:
  - id, full_name, title, organization, phone, qr_code, rsvp_status, checkin_at, event_id (FK→Event)
- Ràng buộc:
  - `qr_code` unique
  - `rsvp_status` ∈ {pending, accepted, declined}
  - `checkin_at` nullable

ERD (mô tả): Event 1─* Guest

### 3. Luồng nghiệp vụ chính

- Import CSV:
  1) BTC upload CSV chuẩn header.
  2) Backend parse, validate, insert/update Guests theo Event.
  3) Trả về danh sách khách.

- Phát QR & Thiệp mời:
  1) Sau khi tạo Guest, hệ thống sinh `qr_code` unique (token hóa id).
  2) Tạo link chứa token để khách xem thiệp mời và RSVP.
  3) BTC gửi link qua email/SMS.

- RSVP:
  1) Khách mở link thiệp mời, xem thông tin sự kiện.
  2) Chọn Tham gia/Từ chối → Backend cập nhật `rsvp_status`.
  3) BTC theo dõi dashboard.

- Check-in bằng QR:
  1) Tại cổng, nhân sự quét QR.
  2) Backend xác thực token, tìm Guest, kiểm tra trùng check-in.
  3) Ghi `checkin_at` (timestamp) và phản hồi thành công.

### 4. API cơ bản (REST)
- `POST /guests/import` – Import CSV.
- `GET /guests` – Danh sách khách (lọc theo event, status...).
- `POST /guests/{id}/rsvp` – Cập nhật RSVP.
- `POST /guests/{id}/checkin` – Check-in bằng QR.
- `GET /events` – Thông tin sự kiện.

### 5. Test Plan (tổng quan)
- CSV Import: định dạng header, dữ liệu thiếu/thừa, ký tự unicode, trùng lặp.
- QR: tính duy nhất, token hợp lệ, link thiệp mời mở được.
- RSVP: cập nhật đúng trạng thái, id không tồn tại, lặp lại yêu cầu.
- Check-in: quét hợp lệ, quét trùng, token không hợp lệ/hết hạn.
- API: status codes, payload validation, phân trang/lọc đơn giản cho `GET /guests`.

### 6. Invitation & Delivery Spec

#### 6.1. Data Dictionary (JSON input)
- guest:
  - title (string): Danh xưng/học vị.
  - name (string): Họ tên khách mời.
  - role (string): Chức vụ (CEO/Director/Founder/...).
  - organization (string): Tổ chức/Doanh nghiệp.
  - tag (string|null): Nhóm/nhãn (ví dụ: Partner, Media...).
  - vip (boolean|null): Suy luận từ role; cho phép override thủ công.
- event:
  - title (string): Tên sự kiện.
  - subtitle (string|null): Phụ đề/khẩu hiệu.
  - datetime (string|object): Thời gian sự kiện (ISO8601 hoặc {start_at, end_at}).
  - timezone (string): Múi giờ (ví dụ: Asia/Ho_Chi_Minh).
  - venue (object): { name (string), address (string) }.
- rsvp:
  - accept_url (string): Link xác nhận tham gia.
  - decline_url (string): Link từ chối.
  - deadline (string|null): Hạn phản hồi (ISO8601) – có thể lưu ghi chú.
- qr:
  - value (string): invitation_id/token.
  - qr_url (string): URL ảnh QR để render email (không cần lưu DB nếu có thể tái tạo).
- delivery:
  - email_to (string): Email người nhận.
  - email_subject (string): Tiêu đề email.
  - file_name (string|null): Tên file đính kèm (nếu có).
- branding:
  - logo_url (string|null): Logo thương hiệu.
  - primary_color (string|null): Màu chủ đạo (#RRGGBB).
  - accent_color (string|null): Màu nhấn (#RRGGBB).

Quy ước:
- vip: infer từ `role` (CEO/Director/Founder…) nhưng cho phép override thủ công (ưu tiên giá trị JSON nếu cung cấp).
- invitation_id: khóa ngoại mềm trỏ về guest; unique trong phạm vi `event_id`.
- `qr.value` là token/`invitation_id`; `qr.qr_url` chỉ phục vụ rendering email (không bắt buộc lưu).

#### 6.2. Mapping JSON → DB (cứng)
- guest:
  - title → `guests.title`
  - name → `guests.full_name`
  - role → `guests.role`
  - organization → `guests.org`
  - tag → `guests.group_tag`
  - vip? → `guests.is_vip` (boolean; infer từ `role` nếu null)
- event:
  - title → `events.name`
  - subtitle → `events.agenda_md` (hoặc mô tả ngắn)
  - datetime → `events.start_at` (nếu string) hoặc `events.start_at`/`events.end_at` (nếu object)
  - timezone → `events.timezone`
  - venue.name → `events.location`
  - venue.address → `events.address`
- rsvp:
  - accept_url / decline_url / deadline → `guests.notes` (gộp JSON nhỏ) hoặc bảng `guest_links` nếu cần audit chi tiết
- qr:
  - value (invitation_id/token) → `guests.invitation_id` (unique per `event_id`) và/hoặc `guests.qr_token`
  - qr_url → không lưu hoặc cache tạm; có thể tái tạo từ token
- delivery:
  - email_to → `guests.email`
  - email_subject → `guests.email_subject_last`
  - file_name → `guests.attach_file_name`
- branding:
  - logo_url → `events.brand_logo_url`
  - primary_color → `events.brand_primary_color`
  - accent_color → `events.brand_accent_color`

Gợi ý mở rộng bảng (nếu cần thêm trường):
- `guests`: email, role, org, group_tag, is_vip, invitation_id, qr_token, notes, email_subject_last, attach_file_name
- `events`: timezone, address, brand_logo_url, brand_primary_color, brand_accent_color, agenda_md, end_at
- Bảng phụ `guest_links` (tùy chọn): guest_id, event_id, accept_url, decline_url, deadline, created_at, updated_at

### 7. Invitation UX & Email Spec

#### 7.1. Email Template
- Subject: lấy từ `delivery.email_subject`
- Preheader: "Xác nhận trước {deadline} để giữ chỗ."
- Hero: logo + tiêu đề + subtitle
- CTA đôi: "Tham dự" và "Từ chối"
- Ticket section: QR lớn, cảnh báo không chia sẻ
- Footer: thông tin đơn vị tổ chức, liên hệ

#### 7.2. Web Invitation
- Page RSVP công khai theo `{invitation_id}`: hiển thị tóm tắt sự kiện, CTA, link tải ICS, QR preview
- Branding: màu `primary_color`, `accent_color`; fallback font sans; logo từ `logo_url` với alt text

#### 7.3. Wireframe (Email & Web)
```
┌─────────────────────────────────────┐
│ [Logo] EXP Technology              │
│ 15 Years of Excellence             │
│ Lễ kỷ niệm 15 năm thành lập        │
├─────────────────────────────────────┤
│ Kính gửi Mr Nguyễn Cường,          │
│                                     │
│ Trân trọng kính mời Quý khách...    │
│                                     │
│ [Tham dự] [Từ chối]                │
├─────────────────────────────────────┤
│ [QR Code]                          │
│ ⚠️ Không chia sẻ QR này            │
├─────────────────────────────────────┤
│ EXP Technology Company Limited     │
│ Liên hệ: info@exp.com              │
└─────────────────────────────────────┘
```
