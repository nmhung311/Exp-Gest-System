# Hướng dẫn sử dụng Database - EXP Guest System

## 📋 Tổng quan

Hệ thống EXP Guest sử dụng **SQLite** làm database chính với hệ thống migration và seed data để quản lý cấu trúc và dữ liệu khởi tạo.

## 🗂️ Cấu trúc Database

### Vị trí Database
- **File chính**: `/home/exp/Hung/Exp-Gest-System/exp_guest.db`
- **Cấu hình**: `backend/app.py` - `SQLALCHEMY_DATABASE_URI = "sqlite:///../exp_guest.db"`

### Tables chính

#### 1. **events** - Quản lý sự kiện
```sql
CREATE TABLE events (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    time TIME,
    location VARCHAR(255),
    venue_address VARCHAR(512),
    venue_map_url VARCHAR(1024),
    program_outline TEXT,
    dress_code VARCHAR(255),
    invitation_content TEXT,
    status VARCHAR(20) DEFAULT 'upcoming',
    max_guests INTEGER DEFAULT 100,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. **guests** - Quản lý khách mời
```sql
CREATE TABLE guests (
    id INTEGER PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    title VARCHAR(20),
    role VARCHAR(255),
    organization VARCHAR(255),
    tag VARCHAR(50),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50) UNIQUE,
    host VARCHAR(255),
    rsvp_status VARCHAR(20) DEFAULT 'pending',
    checkin_status VARCHAR(20) DEFAULT 'not_arrived',
    checked_in_at DATETIME,
    event_content TEXT,
    event_id INTEGER REFERENCES events(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. **tokens** - Token QR cho khách mời
```sql
CREATE TABLE tokens (
    id INTEGER PRIMARY KEY,
    guest_id INTEGER NOT NULL REFERENCES guests(id),
    token VARCHAR(128) NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME
);
```

#### 4. **checkins** - Lịch sử check-in
```sql
CREATE TABLE checkins (
    id INTEGER PRIMARY KEY,
    guest_id INTEGER NOT NULL REFERENCES guests(id),
    time DATETIME DEFAULT CURRENT_TIMESTAMP,
    gate VARCHAR(50),
    staff VARCHAR(100)
);
```

#### 5. **users** - Người dùng hệ thống
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username VARCHAR(150) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 6. **user_tokens** - Token đăng nhập
```sql
CREATE TABLE user_tokens (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    token VARCHAR(128) NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME
);
```

## 🚀 Khởi tạo Database

### Cách 1: Sử dụng script khởi tạo (Khuyến nghị)
```bash
cd /home/exp/Hung/Exp-Gest-System/backend
python init_db.py
```

### Cách 2: Chạy migration thủ công
```bash
cd /home/exp/Hung/Exp-Gest-System/backend
python migrations/migrate.py
```

### Cách 3: Khởi tạo qua Flask app
```bash
cd /home/exp/Hung/Exp-Gest-System/backend
python -c "
from app import create_app
from db import db
app = create_app()
with app.app_context():
    db.create_all()
    print('Database initialized!')
"
```

## 🔧 Quản lý Migration

### Hệ thống Migration
- **Thư mục**: `backend/migrations/`
- **Script chính**: `migrate.py`
- **Migration files**: `001_initial_schema.py`, `002_add_event_fields.py`, etc.

### Chạy Migration
```bash
cd backend
python migrations/migrate.py
```

### Tạo Migration mới
1. Tạo file mới trong `backend/migrations/` với format: `003_description.py`
2. Thêm function `migrate()` vào file
3. Chạy `python migrations/migrate.py`

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

## 📊 Seed Data

### Dữ liệu mẫu mặc định
- **Admin user**: `admin/admin123`
- **Sample event**: EXP Solution Annual Conference 2024
- **Sample guests**: 3 khách mời mẫu
- **Tokens**: QR tokens cho khách mời

### Chạy Seed Data
```bash
cd backend
python migrations/seed.py
```

## 🔍 Truy vấn Database

### Sử dụng SQLite CLI
```bash
# Kết nối database
sqlite3 /home/exp/Hung/Exp-Gest-System/exp_guest.db

# Xem tất cả tables
.tables

# Xem cấu trúc table
.schema guests

# Truy vấn dữ liệu
SELECT * FROM guests;
SELECT COUNT(*) FROM events;
```

### Sử dụng Python
```python
from app import create_app
from models import Guest, Event, User

app = create_app()
with app.app_context():
    # Lấy tất cả khách mời
    guests = Guest.query.all()
    
    # Lấy khách mời theo event
    event_guests = Guest.query.filter_by(event_id=1).all()
    
    # Tạo khách mời mới
    new_guest = Guest(
        name="Nguyen Van A",
        email="nguyenvana@example.com",
        event_id=1
    )
    db.session.add(new_guest)
    db.session.commit()
```

## 📈 Thống kê Database

### Kiểm tra số lượng records
```sql
-- Số lượng users
SELECT COUNT(*) FROM users;

-- Số lượng events
SELECT COUNT(*) FROM events;

-- Số lượng guests
SELECT COUNT(*) FROM guests;

-- Số lượng tokens
SELECT COUNT(*) FROM tokens;

-- Số lượng checkins
SELECT COUNT(*) FROM checkins;
```

### Thống kê theo event
```sql
-- Khách mời theo event
SELECT e.name, COUNT(g.id) as guest_count
FROM events e
LEFT JOIN guests g ON e.id = g.event_id
GROUP BY e.id, e.name;

-- Trạng thái RSVP
SELECT rsvp_status, COUNT(*) as count
FROM guests
GROUP BY rsvp_status;

-- Trạng thái check-in
SELECT checkin_status, COUNT(*) as count
FROM guests
GROUP BY checkin_status;
```

## 🔒 Bảo mật

### Backup Database
```bash
# Backup database
cp exp_guest.db exp_guest_backup_$(date +%Y%m%d_%H%M%S).db

# Hoặc sử dụng SQLite dump
sqlite3 exp_guest.db .dump > backup.sql
```

### Restore Database
```bash
# Restore từ backup file
cp exp_guest_backup_20240929_110000.db exp_guest.db

# Hoặc restore từ SQL dump
sqlite3 exp_guest.db < backup.sql
```

## 🛠️ Troubleshooting

### Database bị khóa
```bash
# Kiểm tra processes đang sử dụng database
lsof exp_guest.db

# Kill processes nếu cần
kill -9 <PID>
```

### Database corruption
```bash
# Kiểm tra integrity
sqlite3 exp_guest.db "PRAGMA integrity_check;"

# Repair nếu cần
sqlite3 exp_guest.db ".recover" | sqlite3 exp_guest_recovered.db
```

### Reset Database
```bash
# Xóa database và tạo lại
rm exp_guest.db
cd backend && python init_db.py
```

## 📝 Best Practices

### 1. Migration
- Luôn backup trước khi chạy migration
- Test migration trên database copy trước
- Viết migration có thể rollback được

### 2. Queries
- Sử dụng indexes cho các trường thường query
- Tránh N+1 queries, sử dụng eager loading
- Sử dụng transactions cho operations phức tạp

### 3. Performance
- Regular VACUUM database
- Monitor database size
- Optimize queries với EXPLAIN QUERY PLAN

### 4. Security
- Không hardcode database credentials
- Sử dụng environment variables
- Regular backup database
- Validate input data

## 🔗 Liên kết hữu ích

- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Flask-SQLAlchemy Documentation](https://flask-sqlalchemy.palletsprojects.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)

---

**Lưu ý**: Luôn backup database trước khi thực hiện các thao tác quan trọng!
