# Seed Data Directory

## Tổng quan

Thư mục này chứa dữ liệu snapshot và tài liệu liên quan đến việc seeding database từ CSV.

## Cấu trúc thư mục

```
seed/
├── README.md                    # File này
└── snapshot_guests_v1.csv       # Snapshot CSV mẫu
```

## Snapshot Files

### snapshot_guests_v1.csv

File CSV snapshot chứa dữ liệu khách mời mẫu được sử dụng để:

1. **Audit**: Ghi lại dữ liệu đã được seed
2. **Fallback**: Sử dụng khi không có URL Google Sheets
3. **Testing**: Test seeding với dữ liệu cố định
4. **Version Control**: Track thay đổi dữ liệu theo thời gian

### Format CSV

```csv
FullName,Email,Phone,Title,Role,Organization,GroupTag,IsVIP,EventCode,EventName,EventDate,EventLocation,Host,RSVP,Notes
Nguyễn Văn Cường,cuong.nguyen@abc.com,+84901234567,Mr,CEO,ABC Technology,VIP,true,EVT001,Lễ kỷ niệm 15 năm thành lập EXP Technology,2025-10-30,Trung tâm Hội nghị Quốc gia,admin@exp.com,pending,CEO của công ty ABC
```

### Required Columns

- `FullName`: Họ tên đầy đủ
- `Email`: Email (unique key)
- `EventCode`: Mã sự kiện

### Optional Columns

- `Phone`: Số điện thoại
- `Title`: Danh xưng (Mr, Ms, Dr, Prof, Mrs, Miss)
- `Role`: Chức vụ
- `Organization`: Tổ chức
- `GroupTag`: Nhãn nhóm (VIP, Regular, Partner, Media, Staff, Speaker)
- `IsVIP`: VIP status (true/false)
- `EventName`: Tên sự kiện
- `EventDate`: Ngày sự kiện
- `EventLocation`: Địa điểm sự kiện
- `Host`: Tên người tiếp khách
- `RSVP`: Trạng thái RSVP (pending, accepted, declined)
- `Notes`: Ghi chú

## Khi nào commit snapshot?

### ✅ Nên commit khi:
- Thêm dữ liệu mẫu mới
- Cập nhật format CSV
- Thay đổi cấu trúc dữ liệu
- Tạo version mới của snapshot

### ❌ Không nên commit khi:
- Dữ liệu test tạm thời
- Dữ liệu production thật
- File quá lớn (>1MB)
- Dữ liệu nhạy cảm

## Cách sử dụng snapshot

### 1. Sử dụng làm fallback
```bash
# Khi không có SEED_CSV_URL
backend/scripts/run_seed_csv.sh
```

### 2. Test với dữ liệu cố định
```bash
# Sử dụng snapshot thay vì Google Sheets
backend/scripts/run_seed_csv.sh --file=seed/snapshot_guests_v1.csv
```

### 3. Dry run validation
```bash
# Validate snapshot mà không ghi database
backend/scripts/run_seed_csv.sh --file=seed/snapshot_guests_v1.csv --dry-run
```

## So sánh diff khi dữ liệu đổi

### 1. So sánh với CSV hiện tại
```bash
# So sánh snapshot với CSV từ Google Sheets
curl -s "https://docs.google.com/spreadsheets/d/your-sheet-id/export?format=csv&gid=0" > current.csv
diff seed/snapshot_guests_v1.csv current.csv
```

### 2. So sánh với version trước
```bash
# So sánh với commit trước
git show HEAD~1:seed/snapshot_guests_v1.csv > old.csv
diff old.csv seed/snapshot_guests_v1.csv
```

### 3. So sánh với database
```bash
# Export dữ liệu từ database
python -c "
from app.db.session import SessionLocal
from app.models import Guest, Event
import csv

db = SessionLocal()
guests = db.query(Guest).join(Event).all()

with open('db_export.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['FullName', 'Email', 'Phone', 'Title', 'Role', 'Organization', 'GroupTag', 'IsVIP', 'EventCode', 'EventName', 'RSVP', 'Notes'])
    
    for guest in guests:
        writer.writerow([
            guest.full_name,
            guest.email,
            guest.phone,
            guest.title,
            guest.role,
            guest.organization,
            guest.group_tag,
            guest.is_vip,
            guest.event.name if guest.event else '',
            guest.event.name if guest.event else '',
            guest.rsvp_status,
            guest.notes
        ])

db.close()
print('Exported to db_export.csv')
"

# So sánh với snapshot
diff seed/snapshot_guests_v1.csv db_export.csv
```

## Quản lý version

### Naming Convention
- `snapshot_guests_v1.csv`: Version 1
- `snapshot_guests_v2.csv`: Version 2
- `snapshot_guests_2025-09-30.csv`: Theo ngày

### Version History
- **v1**: Initial snapshot với 5 guests mẫu
- **v2**: Thêm fields mới (planned)
- **v3**: Cập nhật validation rules (planned)

## Best Practices

### 1. Data Quality
- Đảm bảo dữ liệu đúng format
- Validate trước khi commit
- Sử dụng encoding UTF-8

### 2. Security
- Không commit dữ liệu thật
- Sử dụng dữ liệu mẫu an toàn
- Kiểm tra trước khi push

### 3. Maintenance
- Cập nhật định kỳ
- Xóa file cũ không cần thiết
- Document thay đổi

## Troubleshooting

### 1. Encoding Issues
```bash
# Kiểm tra encoding
file seed/snapshot_guests_v1.csv

# Convert encoding nếu cần
iconv -f latin1 -t utf-8 seed/snapshot_guests_v1.csv > seed/snapshot_guests_v1_utf8.csv
```

### 2. Format Issues
```bash
# Validate CSV format
python -c "
import csv
with open('seed/snapshot_guests_v1.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    print('Headers:', reader.fieldnames)
    print('Row count:', sum(1 for row in reader))
"
```

### 3. Data Issues
```bash
# Check for duplicates
python -c "
import csv
emails = []
with open('seed/snapshot_guests_v1.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row['Email'] in emails:
            print('Duplicate email:', row['Email'])
        emails.append(row['Email'])
"
```

## Liên kết

- [SEEDING_GUIDE.md](../docs/v1.0/SEEDING_GUIDE.md) - Hướng dẫn seeding chi tiết
- [SEED_MAPPING.md](../docs/v1.0/SEED_MAPPING.md) - Tài liệu mapping CSV → DB
- [CHANGELOG_DB.md](../docs/v1.0/CHANGELOG_DB.md) - Database changelog
