# Database Setup Guide - EXP Guest Management System

## Tổng quan

Hướng dẫn thiết lập database cho hệ thống quản lý khách mời sự kiện với PostgreSQL, Alembic migration và SQLAlchemy ORM.

## Cấu trúc dự án

```
backend/
├── app/
│   ├── db/
│   │   ├── __init__.py
│   │   └── session.py          # Database connection
│   ├── models/                 # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── event.py
│   │   ├── guest.py
│   │   ├── user.py
│   │   ├── role.py
│   │   ├── user_role.py
│   │   └── token.py
│   └── seeds/                  # Database seeding
│       ├── __init__.py
│       ├── base_seed.py
│       ├── seed_roles.py
│       ├── seed_users.py
│       ├── seed_events.py
│       └── seed_guests.py
├── alembic/                    # Alembic migrations
│   ├── env.py
│   └── versions/
├── alembic.ini
└── seed.py                     # Main seeding script

docs/v1.0/
├── ERD.md                      # Entity Relationship Diagram
├── BA.md                       # Business Analysis
├── DATABASE_GUIDE.md           # Database management guide
└── CHANGELOG_DB.md             # Database changelog

scripts/
└── check-docs.sh               # Pre-commit hook

.github/workflows/
└── database-migration.yml      # CI/CD pipeline
```

## Quick Start

### 1. Cài đặt dependencies

```bash
pip install alembic psycopg2-binary sqlalchemy
```

### 2. Cấu hình database

Tạo file `.env`:
```env
DATABASE_URL=postgresql+psycopg2://username:password@localhost:5432/exp_guest_db
```

### 3. Chạy migration

```bash
# Từ thư mục gốc dự án
PYTHONPATH="backend" alembic upgrade head
```

### 4. Chạy seeding

```bash
# Từ thư mục gốc dự án
python -m backend.seed
```

## Lệnh thường dùng

### Migration

```bash
# Tạo migration mới
PYTHONPATH="backend" alembic revision --autogenerate -m "describe changes"

# Chạy migration
PYTHONPATH="backend" alembic upgrade head

# Rollback
PYTHONPATH="backend" alembic downgrade -1

# Xem lịch sử
PYTHONPATH="backend" alembic history

# Xem version hiện tại
PYTHONPATH="backend" alembic current
```

### Seeding

```bash
# Chạy seeding
python -m backend.seed

# Hoặc từ thư mục backend
python seed.py
```

## Database Schema

### Bảng chính

1. **events** - Quản lý sự kiện
2. **guests** - Quản lý khách mời
3. **users** - Quản lý người dùng hệ thống
4. **roles** - Quản lý vai trò
5. **user_roles** - Liên kết user-role (many-to-many)
6. **tokens** - Token cho guests
7. **user_tokens** - Token cho users

### Dữ liệu mẫu

- **3 roles**: admin, manager, host
- **2 users**: admin (admin@exp.com), manager (manager@exp.com)
- **1 event**: "Lễ kỷ niệm 15 năm thành lập EXP Technology"
- **5 guests**: Khách mời mẫu với đầy đủ thông tin

## Testing

### Test migration

```bash
# Test với SQLite
PYTHONPATH="backend" DATABASE_URL="sqlite:///./test.db" alembic upgrade head
PYTHONPATH="backend" DATABASE_URL="sqlite:///./test.db" python -m backend.seed
```

### Test rollback

```bash
# Rollback về đầu
PYTHONPATH="backend" alembic downgrade base

# Upgrade lại
PYTHONPATH="backend" alembic upgrade head
```

## CI/CD

Pipeline tự động chạy khi có thay đổi:
- Chạy migration
- Chạy seeding
- Verify database state
- Test rollback
- Run smoke tests

## Pre-commit Hook

Script `scripts/check-docs.sh` kiểm tra:
- Model files có được cập nhật không
- Documentation có được cập nhật không
- Migration files có được tạo không

## Troubleshooting

### Lỗi kết nối database

```bash
# Kiểm tra DATABASE_URL
echo $DATABASE_URL

# Test kết nối
python -c "from app.db.session import engine; print(engine.execute('SELECT 1').scalar())"
```

### Lỗi migration

```bash
# Xem log chi tiết
PYTHONPATH="backend" alembic upgrade head --verbose

# Kiểm tra version hiện tại
PYTHONPATH="backend" alembic current
```

### Lỗi seeding

```bash
# Chạy với debug
python -c "from app.seeds.base_seed import run_all; run_all()"
```

## Tài liệu

- [ERD.md](docs/v1.0/ERD.md) - Entity Relationship Diagram
- [BA.md](docs/v1.0/BA.md) - Business Analysis
- [DATABASE_GUIDE.md](docs/v1.0/DATABASE_GUIDE.md) - Database management guide
- [CHANGELOG_DB.md](docs/v1.0/CHANGELOG_DB.md) - Database changelog

## Support

Nếu gặp vấn đề, hãy kiểm tra:
1. Database service đang chạy
2. DATABASE_URL đúng format
3. Dependencies đã cài đặt
4. PYTHONPATH được set đúng
