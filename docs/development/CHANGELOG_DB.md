# Database Changelog - Version 1.0

## Tổng quan

Changelog này ghi lại tất cả các thay đổi về database schema, migration và seeding từ khi bắt đầu dự án.

## Format

Mỗi entry có format:
```
YYYY-MM-DD: [Migration ID] - Mô tả ngắn gọn
- Chi tiết thay đổi 1
- Chi tiết thay đổi 2
- Breaking changes (nếu có)
```

## Changelog

### 2025-09-30: [0b7055c4e4ce] - Init schema v1

**Migration**: `0b7055c4e4ce_init_schema_v1.py`

**Mô tả**: Tạo schema cơ sở cho hệ thống quản lý khách mời sự kiện

**Thay đổi chính**:

#### Bảng mới được tạo:
- **events**: Quản lý thông tin sự kiện
  - Các trường: id, name, start_datetime, end_datetime, location, address, agenda, agenda_md, timezone, brand_logo_url, brand_primary_color, brand_accent_color, status, max_guests, created_at, updated_at
  - Indexes: ix_events_id, ix_events_name, ix_events_start_datetime

- **guests**: Quản lý thông tin khách mời
  - Các trường: id, full_name, title, role, organization, phone, email, qr_code, invitation_id, qr_token, group_tag, is_vip, rsvp_status, checkin_at, event_id, notes, email_subject_last, attach_file_name, created_at, updated_at
  - Indexes: ix_guests_id, ix_guests_full_name, ix_guests_email (UNIQUE), ix_guests_phone (UNIQUE), ix_guests_qr_code (UNIQUE), ix_guests_qr_token (UNIQUE), ix_guests_event_id, ix_guests_organization, ix_guests_group_tag, ix_guests_is_vip, ix_guests_rsvp_status, ix_guests_checkin_at, ix_guests_invitation_id
  - Constraints: uq_guests_invitation_event (UNIQUE trên invitation_id, event_id)
  - Foreign Keys: FK_guests_event_id → events(id) ON DELETE CASCADE

- **users**: Quản lý người dùng hệ thống
  - Các trường: id, username, email, password_hash, is_active, created_at, updated_at
  - Indexes: ix_users_id, ix_users_username (UNIQUE), ix_users_email (UNIQUE)

- **roles**: Quản lý vai trò người dùng
  - Các trường: id, name, description, created_at, updated_at
  - Indexes: ix_roles_id, ix_roles_name (UNIQUE)

- **user_roles**: Bảng liên kết user-role (many-to-many)
  - Các trường: id, user_id, role_id, created_at
  - Indexes: ix_user_roles_id, ix_user_roles_user_id, ix_user_roles_role_id
  - Constraints: uq_user_roles_user_role (UNIQUE trên user_id, role_id)
  - Foreign Keys: FK_user_roles_user_id → users(id) ON DELETE CASCADE, FK_user_roles_role_id → roles(id) ON DELETE CASCADE

- **tokens**: Quản lý token cho guests
  - Các trường: id, guest_id, token, status, created_at, expires_at
  - Indexes: ix_tokens_id, ix_tokens_guest_id, ix_tokens_token (UNIQUE), ix_tokens_status
  - Foreign Keys: FK_tokens_guest_id → guests(id) ON DELETE CASCADE

- **user_tokens**: Quản lý token cho users
  - Các trường: id, user_id, token, status, created_at, expires_at
  - Indexes: ix_user_tokens_id, ix_user_tokens_user_id, ix_user_tokens_token (UNIQUE), ix_user_tokens_status
  - Foreign Keys: FK_user_tokens_user_id → users(id) ON DELETE CASCADE

#### Seeding được thêm:
- **Roles**: admin, manager, host
- **Users**: admin user (admin@exp.com), manager user (manager@exp.com)
- **Events**: 1 sự kiện mẫu "Lễ kỷ niệm 15 năm thành lập EXP Technology"
- **Guests**: 5 khách mời mẫu với đầy đủ thông tin

#### Cấu hình Alembic:
- Khởi tạo Alembic với cấu hình PostgreSQL
- Cấu hình env.py để sử dụng DATABASE_URL từ environment
- Tạo migration autogenerate từ SQLAlchemy models

#### Tài liệu được tạo:
- **ERD.md**: Entity Relationship Diagram chi tiết
- **BA.md**: Business Analysis với luồng nghiệp vụ
- **DATABASE_GUIDE.md**: Hướng dẫn quản lý database
- **CHANGELOG_DB.md**: File này

**Breaking Changes**: Không có (đây là version đầu tiên)

**Migration Commands**:
```bash
# Chạy migration
PYTHONPATH="backend" alembic upgrade head

# Chạy seeding
python -m backend.seed
```

**Rollback Commands**:
```bash
# Rollback về trước migration này
PYTHONPATH="backend" alembic downgrade base
```

### 2025-09-30: [CSV-SEED-v1] - Seed via Google Sheet CSV v1

**Migration**: Không có migration mới (sử dụng schema hiện tại)

**Mô tả**: Thêm hệ thống seeding từ Google Sheets CSV với đầy đủ tính năng idempotent, validation và audit

**Thay đổi chính**:

#### Files mới được tạo:
- **backend/app/utils/http.py**: HTTP utilities để fetch CSV từ Google Sheets
- **backend/app/seeds/seed_csv.py**: Main seeding script với đầy đủ logic
- **backend/app/seeds/mapping.py**: Column mapping configuration
- **backend/app/seeds/validators.py**: Data validation utilities
- **backend/scripts/run_seed_csv.sh**: Shell script wrapper
- **seed/snapshot_guests_v1.csv**: CSV snapshot mẫu
- **docs/v1.0/SEEDING_GUIDE.md**: Hướng dẫn seeding chi tiết
- **docs/v1.0/SEED_MAPPING.md**: Tài liệu mapping CSV → DB

#### Tính năng mới:
- **Idempotent seeding**: Chạy nhiều lần không tạo dữ liệu trùng
- **Real-time CSV**: Đọc trực tiếp từ Google Sheets URL
- **Data validation**: Validate email, phone, RSVP status, title, group tag
- **Upsert logic**: Update existing guests, create new ones
- **Error handling**: Robust error handling với detailed logging
- **Snapshot management**: Tự động lưu snapshot sau mỗi lần chạy
- **Dry-run mode**: Validate dữ liệu mà không ghi database
- **CLI options**: --dry-run, --file, --stop-on-error

#### Environment variables mới:
- **SEED_CSV_URL**: URL Google Sheets CSV
- **SEED_TIMEOUT**: Request timeout (default: 30s)

#### Column mapping:
- **Required**: FullName, Email, EventCode
- **Optional**: Phone, Title, Role, Organization, GroupTag, IsVIP, RSVP, Notes
- **Event fields**: EventName, EventDate, EventLocation
- **Host fields**: Host, HostName, HostEmail

#### Validation rules:
- **Email**: Standard format, unique per event
- **Phone**: International format với +, digits, spaces, hyphens
- **RSVP**: pending, accepted, declined
- **Title**: Mr, Ms, Dr, Prof, Mrs, Miss
- **GroupTag**: VIP, Regular, Partner, Media, Staff, Speaker
- **IsVIP**: true/false boolean

#### Seeding process:
1. **Fetch CSV**: Từ Google Sheets URL hoặc local file
2. **Parse CSV**: Parse thành list of dictionaries
3. **Validate headers**: Kiểm tra required columns
4. **Validate rows**: Validate từng row theo rules
5. **Process events**: Tìm hoặc tạo events
6. **Process guests**: Upsert guests theo email + event_id
7. **Save snapshot**: Lưu CSV snapshot để audit
8. **Log summary**: In tổng kết insert/update/skip/errors

**Breaking Changes**: Không có

**Seeding Commands**:
```bash
# Seeding từ Google Sheets
backend/scripts/run_seed_csv.sh

# Dry run
backend/scripts/run_seed_csv.sh --dry-run

# Từ file local
backend/scripts/run_seed_csv.sh --file=./data.csv

# Dừng khi gặp lỗi
backend/scripts/run_seed_csv.sh --stop-on-error
```

**Rollback Commands**:
```bash
# Xóa dữ liệu được seed từ CSV
python -c "
from app.db.session import SessionLocal
from app.models import Guest
db = SessionLocal()
db.query(Guest).filter(Guest.notes.like('%CSV%')).delete()
db.commit()
db.close()
"
```

## Lịch sử Version

| Version | Date | Migration ID | Mô tả |
|---------|------|--------------|-------|
| 1.0.0 | 2025-09-30 | 0b7055c4e4ce | Init schema v1 |

## Quy ước ghi Changelog

### 1. Format Entry
- **Date**: YYYY-MM-DD format
- **Migration ID**: ID của migration file
- **Title**: Mô tả ngắn gọn thay đổi
- **Details**: Chi tiết các thay đổi
- **Breaking Changes**: Nếu có thay đổi breaking
- **Commands**: Lệnh migration và rollback

### 2. Phân loại thay đổi
- **NEW**: Bảng/cột mới
- **CHANGE**: Thay đổi cấu trúc hiện có
- **REMOVE**: Xóa bảng/cột
- **INDEX**: Thay đổi indexes
- **CONSTRAINT**: Thay đổi constraints
- **DATA**: Thay đổi dữ liệu mẫu

### 3. Breaking Changes
- Thay đổi cấu trúc bảng
- Xóa cột không nullable
- Thay đổi kiểu dữ liệu
- Thay đổi constraints

## Checklist cho mỗi Migration

### Trước khi tạo Migration
- [ ] Model đã được cập nhật
- [ ] Test trên database test
- [ ] Review code changes

### Khi tạo Migration
- [ ] Sử dụng autogenerate khi có thể
- [ ] Review migration file
- [ ] Test migration và rollback
- [ ] Cập nhật tài liệu

### Sau khi Migration
- [ ] Chạy migration trên production
- [ ] Chạy seeding nếu cần
- [ ] Verify data integrity
- [ ] Cập nhật CHANGELOG_DB.md

## Liên kết

- [ERD.md](./ERD.md) - Entity Relationship Diagram
- [BA.md](./BA.md) - Business Analysis
- [DATABASE_GUIDE.md](./DATABASE_GUIDE.md) - Database Management Guide
- [Migration Files](../../alembic/versions/) - Alembic migration files
