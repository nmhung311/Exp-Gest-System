# Database Guide - Version 1.0

## Tổng quan

Hướng dẫn quản lý database cho EXP Guest Management System sử dụng PostgreSQL với Alembic migration và SQLAlchemy ORM.

## Cài đặt và Cấu hình

### 1. Yêu cầu hệ thống
- Python 3.8+
- PostgreSQL 12+
- Alembic 1.8+
- SQLAlchemy 2.0+

### 2. Cài đặt dependencies
```bash
pip install alembic psycopg2-binary sqlalchemy
```

### 3. Cấu hình Environment
Tạo file `.env` với nội dung:
```env
DATABASE_URL=postgresql+psycopg2://username:password@localhost:5432/exp_guest_db
```

## Quản lý Migration

### 1. Cấu trúc thư mục
```
backend/
├── app/
│   ├── db/
│   │   ├── __init__.py
│   │   └── session.py
│   └── models/
│       ├── __init__.py
│       ├── event.py
│       ├── guest.py
│       ├── user.py
│       ├── role.py
│       ├── user_role.py
│       └── token.py
├── alembic/
│   ├── env.py
│   └── versions/
├── alembic.ini
└── seed.py
```

### 2. Lệnh Migration cơ bản

#### Tạo migration mới
```bash
# Từ thư mục gốc dự án
PYTHONPATH="backend" alembic revision --autogenerate -m "description of changes"
```

#### Chạy migration
```bash
# Upgrade lên version mới nhất
PYTHONPATH="backend" alembic upgrade head

# Upgrade lên version cụ thể
PYTHONPATH="backend" alembic upgrade <revision_id>

# Downgrade về version trước
PYTHONPATH="backend" alembic downgrade -1

# Xem lịch sử migration
PYTHONPATH="backend" alembic history

# Xem version hiện tại
PYTHONPATH="backend" alembic current
```

#### Rollback migration
```bash
# Rollback về version trước
PYTHONPATH="backend" alembic downgrade -1

# Rollback về version cụ thể
PYTHONPATH="backend" alembic downgrade <revision_id>

# Rollback về đầu (xóa tất cả)
PYTHONPATH="backend" alembic downgrade base
```

### 3. Quy trình Migration

#### Khi có thay đổi model:
1. **Sửa model** trong `backend/app/models/`
2. **Tạo migration**:
   ```bash
   PYTHONPATH="backend" alembic revision --autogenerate -m "describe changes"
   ```
3. **Review migration file** trong `alembic/versions/`
4. **Test migration** trên database test
5. **Chạy migration** trên production:
   ```bash
   PYTHONPATH="backend" alembic upgrade head
   ```

#### Khi migration bị lỗi:
1. **Kiểm tra log** để xác định nguyên nhân
2. **Sửa migration file** nếu cần
3. **Rollback** nếu cần thiết:
   ```bash
   PYTHONPATH="backend" alembic downgrade -1
   ```
4. **Sửa lại** và chạy lại

## Seeding Database

### 1. Chạy seeding
```bash
# Từ thư mục backend
python seed.py

# Hoặc từ thư mục gốc
python -m backend.seed
```

### 2. Cấu trúc Seeding
- `base_seed.py`: Lớp cơ sở và registry
- `seed_roles.py`: Tạo roles mặc định
- `seed_users.py`: Tạo users hệ thống
- `seed_events.py`: Tạo events mẫu
- `seed_guests.py`: Tạo guests mẫu

### 3. Thêm Seed mới
```python
from app.seeds.base_seed import BaseSeed, register

@register
class SeedNewData(BaseSeed):
    order = 50  # Thứ tự chạy
    
    def run(self, db):
        # Logic seeding
        pass
```

## Quy ước đặt tên

### 1. Bảng (Tables)
- Sử dụng **snake_case**
- Tên số ít: `user`, `role`, `event`, `guest`
- Bảng liên kết: `user_role`, `user_token`

### 2. Cột (Columns)
- Sử dụng **snake_case**
- Khóa chính: `id`
- Khóa ngoại: `user_id`, `event_id`
- Timestamp: `created_at`, `updated_at`

### 3. Indexes
- Primary key: `pk_<table_name>`
- Foreign key: `fk_<table_name>_<column_name>`
- Unique: `uq_<table_name>_<column_name>`
- Index: `ix_<table_name>_<column_name>`

### 4. Constraints
- Unique constraint: `uq_<table_name>_<column_name>`
- Foreign key: `fk_<table_name>_<column_name>`
- Check constraint: `ck_<table_name>_<column_name>`

## Checklist trước khi Merge

### 1. Code Review
- [ ] Migration file được review kỹ lưỡng
- [ ] Không có DROP TABLE không cần thiết
- [ ] Foreign key constraints đúng
- [ ] Indexes được tối ưu
- [ ] Data types phù hợp

### 2. Testing
- [ ] Migration chạy thành công trên database test
- [ ] Rollback hoạt động đúng
- [ ] Seeding chạy thành công
- [ ] Không có data loss

### 3. Documentation
- [ ] ERD.md được cập nhật
- [ ] BA.md được cập nhật
- [ ] CHANGELOG_DB.md được cập nhật
- [ ] Migration có comment rõ ràng

### 4. Performance
- [ ] Indexes được tạo cho các truy vấn thường xuyên
- [ ] Không có full table scan không cần thiết
- [ ] Partitioning được xem xét cho bảng lớn

## Troubleshooting

### 1. Lỗi Migration
```bash
# Xem log chi tiết
PYTHONPATH="backend" alembic upgrade head --verbose

# Kiểm tra version hiện tại
PYTHONPATH="backend" alembic current

# Xem lịch sử
PYTHONPATH="backend" alembic history
```

### 2. Lỗi Seeding
```bash
# Chạy với debug
python -c "from app.seeds.base_seed import run_all; run_all()"

# Kiểm tra kết nối database
python -c "from app.db.session import engine; print(engine.execute('SELECT 1').scalar())"
```

### 3. Lỗi Kết nối Database
- Kiểm tra `DATABASE_URL` trong `.env`
- Kiểm tra PostgreSQL service đang chạy
- Kiểm tra credentials và permissions

## Monitoring và Maintenance

### 1. Backup Database
```bash
# Backup toàn bộ database
pg_dump -h localhost -U username -d exp_guest_db > backup.sql

# Restore database
psql -h localhost -U username -d exp_guest_db < backup.sql
```

### 2. Monitoring Performance
```sql
-- Xem kích thước các bảng
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Xem indexes không sử dụng
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE idx_scan = 0;
```

### 3. Cleanup
```sql
-- Xóa dữ liệu cũ (tokens hết hạn)
DELETE FROM tokens WHERE expires_at < NOW() AND expires_at IS NOT NULL;

-- Xóa dữ liệu test
DELETE FROM guests WHERE email LIKE '%@test.com';
```

## Best Practices

### 1. Migration
- Luôn test migration trên database test trước
- Backup database trước khi chạy migration production
- Viết migration có thể rollback được
- Sử dụng transaction cho migration phức tạp

### 2. Seeding
- Seeding phải idempotent (chạy nhiều lần không lỗi)
- Không seed dữ liệu production
- Sử dụng upsert thay vì insert khi có thể

### 3. Performance
- Tạo indexes cho các truy vấn thường xuyên
- Sử dụng pagination cho queries lớn
- Monitor và optimize slow queries

### 4. Security
- Không hardcode credentials trong code
- Sử dụng environment variables
- Encrypt sensitive data
- Regular security audit
