# 🗄️ Database Management - EXP Guest System

## 📋 Tổng quan

Hệ thống EXP Guest sử dụng **SQLite** làm database chính với hệ thống migration và seed data để quản lý cấu trúc và dữ liệu khởi tạo.

## 🚀 Quick Start

### 1. Khởi tạo Database
```bash
# Cách 1: Sử dụng script nhanh (Khuyến nghị)
./scripts/db_quick_commands.sh init

# Cách 2: Chạy trực tiếp
cd backend && python init_db.py
```

### 2. Kiểm tra trạng thái Database
```bash
./scripts/db_quick_commands.sh status
```

### 3. Backup Database
```bash
./scripts/db_quick_commands.sh backup
```

## 📁 Cấu trúc Files

```
Exp-Gest-System/
├── exp_guest.db                    # Database chính
├── docs/
│   └── DATABASE_GUIDE.md          # Hướng dẫn chi tiết
├── backend/
│   ├── init_db.py                 # Script khởi tạo database
│   ├── db_utils.py                # Database utilities
│   ├── migrations/
│   │   ├── migrate.py             # Migration runner
│   │   ├── 001_initial_schema.py  # Schema cơ bản
│   │   ├── 002_add_event_fields.py # Thêm trường events
│   │   └── seed.py                # Seed data
│   └── models.py                  # Database models
└── scripts/
    └── db_quick_commands.sh       # Script quản lý nhanh
```

## 🛠️ Các lệnh quản lý Database

### Sử dụng Script nhanh
```bash
# Xem trạng thái database
./scripts/db_quick_commands.sh status

# Khởi tạo database
./scripts/db_quick_commands.sh init

# Chạy migration
./scripts/db_quick_commands.sh migrate

# Backup database
./scripts/db_quick_commands.sh backup

# Restore database
./scripts/db_quick_commands.sh restore /path/to/backup.db

# Xem schema
./scripts/db_quick_commands.sh schema

# Liệt kê tables
./scripts/db_quick_commands.sh tables

# Truy vấn SQL
./scripts/db_quick_commands.sh query "SELECT COUNT(*) FROM guests;"

# Mở SQLite shell
./scripts/db_quick_commands.sh shell
```

### Sử dụng Python Utilities
```bash
cd backend

# Xem thống kê
python db_utils.py stats

# Backup database
python db_utils.py backup

# Restore database
python db_utils.py restore --file backup.db

# Kiểm tra integrity
python db_utils.py check

# Tối ưu database
python db_utils.py vacuum

# Export table ra CSV
python db_utils.py export --table guests

# Import từ CSV
python db_utils.py import --table guests --file guests.csv
```

## 📊 Database Schema

### Tables chính:
- **`events`** - Quản lý sự kiện
- **`guests`** - Quản lý khách mời
- **`tokens`** - Token QR cho khách mời
- **`checkins`** - Lịch sử check-in
- **`users`** - Người dùng hệ thống
- **`user_tokens`** - Token đăng nhập

### Dữ liệu mẫu:
- **Admin user**: `admin/admin123`
- **Sample event**: EXP Solution Annual Conference 2024
- **Sample guests**: 3 khách mời mẫu
- **Tokens**: QR tokens cho khách mời

## 🔧 Migration System

### Chạy Migration
```bash
cd backend
python migrations/migrate.py
```

### Tạo Migration mới
1. Tạo file mới trong `backend/migrations/` với format: `003_description.py`
2. Thêm function `migrate()` vào file
3. Chạy migration

### Ví dụ Migration
```python
# backend/migrations/003_add_new_field.py
def migrate():
    """Thêm trường mới vào bảng"""
    from db import db
    db.session.execute(db.text("ALTER TABLE guests ADD COLUMN new_field VARCHAR(100)"))
    db.session.commit()
    print("✅ New field added")
```

## 📈 Monitoring & Maintenance

### Kiểm tra Database
```bash
# Kiểm tra integrity
./scripts/db_quick_commands.sh query "PRAGMA integrity_check;"

# Xem thống kê
./scripts/db_quick_commands.sh status

# Tối ưu database
cd backend && python db_utils.py vacuum
```

### Backup & Restore
```bash
# Backup tự động
./scripts/db_quick_commands.sh backup

# Restore từ backup
./scripts/db_quick_commands.sh restore backups/exp_guest_backup_20240929_110000.db
```

## 🔍 Troubleshooting

### Database không tồn tại
```bash
./scripts/db_quick_commands.sh init
```

### Database bị corrupt
```bash
# Kiểm tra integrity
./scripts/db_quick_commands.sh query "PRAGMA integrity_check;"

# Restore từ backup
./scripts/db_quick_commands.sh restore /path/to/backup.db
```

### Reset hoàn toàn
```bash
rm exp_guest.db
./scripts/db_quick_commands.sh init
```

## 📚 Tài liệu tham khảo

- **Chi tiết**: Xem `docs/DATABASE_GUIDE.md`
- **Models**: Xem `backend/models.py`
- **Migration**: Xem `backend/migrations/`

## ⚠️ Lưu ý quan trọng

1. **Luôn backup** trước khi thực hiện thao tác quan trọng
2. **Test migration** trên database copy trước
3. **Monitor database size** và performance
4. **Regular backup** database production
5. **Validate input data** trước khi insert

---

**Hỗ trợ**: Nếu gặp vấn đề, hãy kiểm tra logs và tham khảo `docs/DATABASE_GUIDE.md` để biết thêm chi tiết.
