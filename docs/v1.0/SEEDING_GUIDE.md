# Seeding Guide - Version 1.0

## Tổng quan

Hướng dẫn seeding dữ liệu từ Google Sheets CSV cho hệ thống quản lý khách mời sự kiện. Hệ thống hỗ trợ đọc trực tiếp từ Google Sheets, validate dữ liệu, và upsert vào database một cách idempotent.

## Mục tiêu

- **Idempotent**: Chạy nhiều lần không tạo dữ liệu trùng lặp
- **Real-time**: Đọc trực tiếp từ Google Sheets, không cần copy thủ công
- **Robust**: Validate dữ liệu, xử lý lỗi, logging chi tiết
- **Audit**: Lưu snapshot sau mỗi lần chạy thành công

## Yêu cầu hệ thống

### Dependencies
```bash
pip install requests python-dotenv
```

### Environment Variables
```env
# CSV Seeding Configuration
SEED_CSV_URL=https://docs.google.com/spreadsheets/d/your-sheet-id/export?format=csv&gid=0
SEED_TIMEOUT=30

# Database Configuration
DATABASE_URL=postgresql+psycopg2://user:pass@localhost:5432/exp_guest_db
```

## Cấu trúc thư mục

```
backend/
├── app/
│   ├── seeds/
│   │   ├── seed_csv.py          # Main seeding script
│   │   ├── mapping.py           # Column mapping configuration
│   │   └── validators.py        # Data validation utilities
│   └── utils/
│       └── http.py              # HTTP utilities for CSV fetching
├── scripts/
│   └── run_seed_csv.sh          # Shell script wrapper
seed/
├── README.md                    # Snapshot documentation
└── snapshot_guests_v1.csv       # CSV snapshot for audit
```

## Quy trình 3 bước

### 1. Migration
```bash
# Chạy migration trước khi seeding
PYTHONPATH="backend" alembic upgrade head
```

### 2. Seeding
```bash
# Seeding từ Google Sheets
backend/scripts/run_seed_csv.sh

# Hoặc dry-run để kiểm tra
backend/scripts/run_seed_csv.sh --dry-run

# Hoặc từ file local
backend/scripts/run_seed_csv.sh --file=./data.csv
```

### 3. Verify
```bash
# Kiểm tra dữ liệu đã được seed
python -c "
from app.db.session import SessionLocal
from app.models import Event, Guest
db = SessionLocal()
print(f'Events: {db.query(Event).count()}')
print(f'Guests: {db.query(Guest).count()}')
db.close()
"
```

## Cách sử dụng

### Basic Usage

```bash
# Seeding từ Google Sheets (mặc định)
backend/scripts/run_seed_csv.sh

# Dry run - chỉ validate, không ghi database
backend/scripts/run_seed_csv.sh --dry-run

# Sử dụng file local thay vì URL
backend/scripts/run_seed_csv.sh --file=./my_data.csv

# Dừng ngay khi gặp lỗi
backend/scripts/run_seed_csv.sh --stop-on-error
```

### Advanced Usage

```bash
# Chạy trực tiếp Python script
PYTHONPATH="backend" python -m app.seeds.seed_csv --dry-run

# Với custom environment
SEED_CSV_URL="https://example.com/data.csv" backend/scripts/run_seed_csv.sh
```

## Cấu hình CSV

### Required Columns
- `Name`: Họ tên đầy đủ (bắt buộc)

### Optional Columns
- `title`: Danh xưng (Mr, Ms, Dr, Prof, Mrs, Miss)
- `Role`: Chức vụ (ví dụ: Founder, CEO, CTO, Marketing Manager)
- `Organizati/tags`: Tên tổ chức và tag viết tắt (ví dụ: "ABC Technology (tech)")
- `host`: Tên lễ tân sẽ tiếp đón khách
- `message`: Nội dung thiệp mời gửi cho khách

### CSV Format Example (Format chuẩn)
**Thứ tự cột bắt buộc:**
```csv
title,Name,Role,Organizati/tags,host,message
```

**Ví dụ dữ liệu:**
```csv
title,Name,Role,Organizati/tags,host,message
Mr,Nguyễn Văn Cường,Founder,ABC Technology (tech),Nguyễn Thị Mai,Chào mừng anh Cường đến tham dự sự kiện của chúng tôi
Ms,Trần Thị Lan,CEO,XYZ Corporation (xyz),Lê Văn Hùng,Trân trọng mời chị Lan tham dự buổi họp quan trọng
Dr,Lê Minh Tuấn,CTO,DEF Solutions (def),Phạm Thị Hoa,Chào mừng anh Tuấn đến với sự kiện công nghệ
```

### Legacy Format (vẫn được hỗ trợ)
```csv
FullName,Email,Phone,Title,Role,Organization,GroupTag,IsVIP,EventCode,EventName,EventDate,EventLocation,Host,RSVP,Notes
Nguyễn Văn Cường,cuong.nguyen@abc.com,+84901234567,Mr,CEO,ABC Technology,VIP,true,EVT001,Lễ kỷ niệm 15 năm,2025-10-30,Trung tâm Hội nghị,admin@exp.com,pending,CEO của ABC
```

## Validation Rules

### Name Validation
- Required field
- Không được để trống

### Email Validation (Legacy format)
- Format: `user@domain.com`
- Optional field (tự động tạo từ tên nếu không có)
- Unique per event

### Phone Validation (Legacy format)
- Format: `+84901234567` or `0901234567`
- Optional field (tự động tạo unique nếu không có)
- Only digits, +, -, (, ), spaces allowed

### RSVP Status
- Values: `pending`, `accepted`, `declined`
- Default: `pending`

### Title
- Values: `Mr`, `Ms`, `Dr`, `Prof`, `Mrs`, `Miss`
- Case insensitive

### Group Tag
- Values: `VIP`, `Regular`, `Partner`, `Media`, `Staff`, `Speaker`
- Default: `Regular`

## Upsert Logic

### Guest Upsert
- **Key**: `email` + `event_id`
- **If exists**: Update all fields except `created_at`
- **If not exists**: Create new guest

### Event Upsert
- **Key**: `name` (event name)
- **If exists**: Use existing event
- **If not exists**: Create new event with default values

## Logging và Monitoring

### Log Levels
- `INFO`: Normal operations
- `WARNING`: Validation warnings, skipped rows
- `ERROR`: Processing errors, validation failures

### Summary Report
```
📊 SEEDING SUMMARY
==================================================
Total rows processed: 100
Valid rows: 95
Inserted: 20
Updated: 75
Skipped: 5
Errors: 0
==================================================
```

### Error Handling
- **Header validation**: Stop if required columns missing
- **Row validation**: Skip invalid rows, log warnings
- **Database errors**: Rollback transaction, exit with error code

## Snapshot Management

### Automatic Snapshot
- Snapshot được lưu tự động sau mỗi lần chạy thành công
- File: `seed/snapshot_guests_v1.csv`
- Dùng để audit và rollback

### Manual Snapshot
```bash
# Lưu snapshot thủ công
cp /path/to/current.csv seed/snapshot_guests_v1.csv
```

### Snapshot Comparison
```bash
# So sánh snapshot với CSV hiện tại
diff seed/snapshot_guests_v1.csv /path/to/current.csv
```

## Rollback dữ liệu

### Soft Rollback
```bash
# Xóa dữ liệu được seed từ CSV
python -c "
from app.db.session import SessionLocal
from app.models import Guest
db = SessionLocal()
# Xóa guests có source từ CSV (có thể thêm field source)
db.query(Guest).filter(Guest.notes.like('%CSV%')).delete()
db.commit()
db.close()
"
```

### Hard Rollback
```bash
# Rollback database migration
PYTHONPATH="backend" alembic downgrade -1
```

## Troubleshooting

### Common Issues

#### 1. CSV không tải được
```bash
# Kiểm tra URL
curl -I "https://docs.google.com/spreadsheets/d/your-sheet-id/export?format=csv&gid=0"

# Kiểm tra timeout
SEED_TIMEOUT=60 backend/scripts/run_seed_csv.sh
```

#### 2. Validation errors
```bash
# Chạy dry-run để xem lỗi
backend/scripts/run_seed_csv.sh --dry-run

# Dừng ngay khi gặp lỗi
backend/scripts/run_seed_csv.sh --stop-on-error
```

#### 3. Database connection
```bash
# Kiểm tra DATABASE_URL
echo $DATABASE_URL

# Test connection
python -c "from app.db.session import SessionLocal; print(SessionLocal().execute('SELECT 1').scalar())"
```

#### 4. Permission issues
```bash
# Cấp quyền chạy script
chmod +x backend/scripts/run_seed_csv.sh

# Kiểm tra Python path
echo $PYTHONPATH
```

### Debug Mode
```bash
# Chạy với debug logging
PYTHONPATH="backend" python -m app.seeds.seed_csv --dry-run --stop-on-error
```

## Best Practices

### 1. CSV Preparation
- Sử dụng UTF-8 encoding
- Đảm bảo header row đúng format
- Validate dữ liệu trước khi upload lên Google Sheets

### 2. Environment Management
- Sử dụng `.env` file cho local development
- Set environment variables cho production
- Backup snapshot files

### 3. Monitoring
- Chạy dry-run trước khi seed thật
- Monitor logs để phát hiện lỗi sớm
- Backup database trước khi seed

### 4. Security
- Không commit file `.env` với credentials
- Sử dụng read-only access cho Google Sheets
- Validate input để tránh injection

## CI/CD Integration

### GitHub Actions
```yaml
- name: Seed CSV Data
  run: |
    backend/scripts/run_seed_csv.sh --dry-run
    backend/scripts/run_seed_csv.sh
```

### Pre-commit Hook
```bash
# Thêm vào .git/hooks/pre-commit
backend/scripts/run_seed_csv.sh --dry-run
```

## Support

Nếu gặp vấn đề:
1. Kiểm tra logs để xác định nguyên nhân
2. Chạy dry-run để validate dữ liệu
3. Kiểm tra environment variables
4. Xem tài liệu [SEED_MAPPING.md](./SEED_MAPPING.md) để hiểu mapping
5. Liên hệ team development
