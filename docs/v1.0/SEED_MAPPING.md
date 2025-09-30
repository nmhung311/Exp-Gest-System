# Seed Mapping Guide - Version 1.0

## Tổng quan

Tài liệu này mô tả cách mapping dữ liệu từ CSV sang database schema cho hệ thống seeding từ Google Sheets.

## Column Mapping

### CSV → Database Field Mapping (Format chuẩn)

**Thứ tự cột chuẩn:** `title,Name,Role,Organizati/tags,host,message`

| CSV Column | Database Table | Database Field | Type | Required | Description |
|------------|----------------|----------------|------|----------|-------------|
| `title` | `guests` | `title` | VARCHAR(20) | ❌ | Danh xưng (Mr, Ms, Dr, etc.) |
| `Name` | `guests` | `full_name` | VARCHAR(200) | ✅ | Họ tên đầy đủ |
| `Role` | `guests` | `role` | VARCHAR(255) | ❌ | Chức vụ (Founder, CEO, CTO, etc.) |
| `Organizati/tags` | `guests` | `organization` + `group_tag` | VARCHAR(255) + VARCHAR(50) | ❌ | Tên tổ chức và tag viết tắt |
| `host` | `guests` | `notes` | TEXT | ❌ | Tên lễ tân tiếp đón |
| `message` | `guests` | `notes` | TEXT | ❌ | Nội dung thiệp mời |

### CSV → Database Field Mapping (Legacy format)

| CSV Column | Database Table | Database Field | Type | Required | Description |
|------------|----------------|----------------|------|----------|-------------|
| `FullName` | `guests` | `full_name` | VARCHAR(200) | ✅ | Họ tên đầy đủ |
| `Email` | `guests` | `email` | VARCHAR(255) | ✅ | Email (unique key) |
| `Phone` | `guests` | `phone` | VARCHAR(50) | ❌ | Số điện thoại |
| `Title` | `guests` | `title` | VARCHAR(20) | ❌ | Danh xưng |
| `Role` | `guests` | `role` | VARCHAR(255) | ❌ | Chức vụ |
| `Organization` | `guests` | `organization` | VARCHAR(255) | ❌ | Tổ chức |
| `Company` | `guests` | `organization` | VARCHAR(255) | ❌ | Tên công ty (alias) |
| `GroupTag` | `guests` | `group_tag` | VARCHAR(50) | ❌ | Nhãn nhóm |
| `IsVIP` | `guests` | `is_vip` | BOOLEAN | ❌ | VIP status |
| `VIP` | `guests` | `is_vip` | BOOLEAN | ❌ | VIP status (alias) |
| `EventCode` | `events` | `name` | VARCHAR(255) | ✅ | Mã sự kiện |
| `EventName` | `events` | `name` | VARCHAR(255) | ❌ | Tên sự kiện |
| `EventDate` | `events` | `start_datetime` | DATETIME | ❌ | Ngày sự kiện |
| `EventLocation` | `events` | `location` | VARCHAR(255) | ❌ | Địa điểm |
| `Host` | `guests` | `notes` | TEXT | ❌ | Tên người tiếp khách |
| `HostName` | `guests` | `notes` | TEXT | ❌ | Tên host (alias) |
| `HostEmail` | `guests` | `notes` | TEXT | ❌ | Email host |
| `RSVP` | `guests` | `rsvp_status` | VARCHAR(20) | ❌ | Trạng thái RSVP |
| `RSVPStatus` | `guests` | `rsvp_status` | VARCHAR(20) | ❌ | RSVP status (alias) |
| `Response` | `guests` | `rsvp_status` | VARCHAR(20) | ❌ | Response (alias) |
| `Notes` | `guests` | `notes` | TEXT | ❌ | Ghi chú |
| `Comments` | `guests` | `notes` | TEXT | ❌ | Comments (alias) |
| `EmailSubject` | `guests` | `email_subject_last` | VARCHAR(255) | ❌ | Tiêu đề email |
| `Attachment` | `guests` | `attach_file_name` | VARCHAR(255) | ❌ | File đính kèm |

## Event Mapping

### CSV Event Fields → Event Table

| CSV Field | Event Field | Type | Description |
|-----------|-------------|------|-------------|
| `EventCode` | `name` | VARCHAR(255) | Mã sự kiện (primary identifier) |
| `EventName` | `name` | VARCHAR(255) | Tên sự kiện |
| `EventDate` | `start_datetime` | DATETIME | Ngày bắt đầu |
| `EventLocation` | `location` | VARCHAR(255) | Địa điểm |

### Event Creation Logic
1. **Lookup by name**: Tìm event theo `EventName` hoặc `EventCode`
2. **If not found**: Tạo event mới với:
   - `name`: `EventName` hoặc `EventCode`
   - `start_datetime`: `EventDate` hoặc current time
   - `location`: `EventLocation` hoặc empty
   - `status`: `upcoming`
   - `max_guests`: 100 (default)

## Guest Mapping

### CSV Guest Fields → Guest Table

| CSV Field | Guest Field | Type | Required | Description |
|-----------|-------------|------|----------|-------------|
| `FullName` | `full_name` | VARCHAR(200) | ✅ | Họ tên đầy đủ |
| `Email` | `email` | VARCHAR(255) | ✅ | Email (unique key) |
| `Phone` | `phone` | VARCHAR(50) | ❌ | Số điện thoại |
| `Title` | `title` | VARCHAR(20) | ❌ | Danh xưng |
| `Role` | `role` | VARCHAR(255) | ❌ | Chức vụ |
| `Organization` | `organization` | VARCHAR(255) | ❌ | Tổ chức |
| `GroupTag` | `group_tag` | VARCHAR(50) | ❌ | Nhãn nhóm |
| `IsVIP` | `is_vip` | BOOLEAN | ❌ | VIP status |
| `RSVP` | `rsvp_status` | VARCHAR(20) | ❌ | Trạng thái RSVP |
| `Notes` | `notes` | TEXT | ❌ | Ghi chú |
| `EmailSubject` | `email_subject_last` | VARCHAR(255) | ❌ | Tiêu đề email |
| `Attachment` | `attach_file_name` | VARCHAR(255) | ❌ | File đính kèm |

### Guest Upsert Logic
1. **Lookup by email + event_id**: Tìm guest theo email và event
2. **If exists**: Update tất cả fields trừ `created_at`
3. **If not exists**: Tạo guest mới với:
   - `event_id`: ID của event tương ứng
   - `created_at`: Current timestamp
   - `updated_at`: Current timestamp

## Validation Rules

### Email Validation
```python
pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
```
- **Required**: Yes
- **Format**: Standard email format
- **Unique**: Per event
- **Normalization**: Convert to lowercase

### Phone Validation
```python
pattern = r"^[\+]?[0-9\s\-\(\)]{10,}$"
```
- **Required**: No
- **Format**: International format with +, digits, spaces, hyphens, parentheses
- **Normalization**: Remove non-numeric characters except +, -, (, ), spaces

### RSVP Status
```python
valid_values = ["pending", "accepted", "declined"]
```
- **Required**: No
- **Default**: `pending`
- **Normalization**: 
  - `yes` → `accepted`
  - `no` → `declined`
  - `maybe` → `pending`
  - `confirmed` → `accepted`
  - `cancelled` → `declined`

### Title
```python
valid_values = ["Mr", "Ms", "Dr", "Prof", "Mrs", "Miss"]
```
- **Required**: No
- **Case insensitive**: `mr.` → `Mr`
- **Normalization**: Capitalize first letter

### Group Tag
```python
valid_values = ["VIP", "Regular", "Partner", "Media", "Staff", "Speaker"]
```
- **Required**: No
- **Default**: `Regular`
- **Normalization**:
  - `vip:true` → `VIP`
  - `vip:false` → `Regular`
  - `regular` → `Regular`

### VIP Status
```python
valid_values = ["true", "false"]
```
- **Required**: No
- **Default**: `false`
- **Normalization**:
  - `true`, `1`, `yes`, `y`, `vip`, `vip:true` → `true`
  - Others → `false`

## Natural Keys for Upsert

### Guest Upsert Key
```python
unique_keys = ["email", "event_id"]
```
- **Primary**: `email` (unique per event)
- **Secondary**: `event_id` (from event lookup)

### Event Upsert Key
```python
unique_keys = ["name"]
```
- **Primary**: `name` (event name or code)

## Data Transformation

### String Normalization
```python
def normalize_string(value):
    return str(value).strip()
```

### Email Normalization
```python
def normalize_email(value):
    return str(value).strip().lower()
```

### Phone Normalization
```python
def normalize_phone(value):
    return re.sub(r'[^\d\+\-\(\)\s]', '', str(value).strip())
```

### Boolean Normalization
```python
def normalize_boolean(value):
    return str(value).lower().strip() in ['true', '1', 'yes', 'y', 'vip', 'vip:true']
```

## Error Handling

### Header Validation
- **Missing required columns**: Stop execution
- **Unknown columns**: Log warning, continue
- **Case sensitivity**: Case insensitive matching

### Row Validation
- **Invalid email format**: Skip row, log error
- **Missing required fields**: Skip row, log error
- **Invalid enum values**: Skip row, log error
- **Database constraints**: Rollback transaction

### Event Processing
- **Invalid event data**: Skip event, log warning
- **Event creation failure**: Stop execution
- **Event lookup failure**: Create new event

## Configuration

### Column Mapping Configuration
```python
COLUMN_MAP = {
    "FullName": "full_name",
    "Email": "email",
    # ... more mappings
}
```

### Required Fields
```python
REQUIRED = ["FullName", "Email", "EventCode"]
```

### Unique Keys
```python
UNIQUE_KEYS = ["Email"]
```

### Default Values
```python
DEFAULTS = {
    "rsvp_status": "pending",
    "is_vip": False,
    "group_tag": "Regular"
}
```

## Examples

### CSV Input
```csv
FullName,Email,Phone,Title,Role,Organization,GroupTag,IsVIP,EventCode,RSVP
Nguyễn Văn Cường,cuong.nguyen@abc.com,+84901234567,Mr,CEO,ABC Technology,VIP,true,EVT001,pending
Trần Thị Lan,lan.tran@xyz.com,0901234568,Ms,Director,XYZ Corporation,Regular,false,EVT001,accepted
```

### Database Output
```sql
-- Event
INSERT INTO events (name, start_datetime, location, status) 
VALUES ('EVT001', NOW(), '', 'upcoming');

-- Guests
INSERT INTO guests (full_name, email, phone, title, role, organization, group_tag, is_vip, rsvp_status, event_id)
VALUES ('Nguyễn Văn Cường', 'cuong.nguyen@abc.com', '+84901234567', 'Mr', 'CEO', 'ABC Technology', 'VIP', true, 'pending', 1);

INSERT INTO guests (full_name, email, phone, title, role, organization, group_tag, is_vip, rsvp_status, event_id)
VALUES ('Trần Thị Lan', 'lan.tran@xyz.com', '0901234568', 'Ms', 'Director', 'XYZ Corporation', 'Regular', false, 'accepted', 1);
```

## Troubleshooting

### Common Mapping Issues

#### 1. Column Not Found
```
Error: Column 'FullName' not found in CSV
Solution: Check CSV header, ensure exact spelling and case
```

#### 2. Invalid Email Format
```
Error: Row 5: Invalid email format: invalid-email
Solution: Check email format, ensure it matches regex pattern
```

#### 3. Event Not Found
```
Warning: Event 'EVT002' not found, creating new event
Solution: Check EventCode in CSV, ensure it matches existing events
```

#### 4. Database Constraint Violation
```
Error: Duplicate key value violates unique constraint
Solution: Check unique constraints, ensure proper upsert logic
```

### Debug Tips

1. **Use dry-run mode**: `--dry-run` để validate mà không ghi database
2. **Check logs**: Xem log để identify validation errors
3. **Validate CSV**: Kiểm tra CSV format trước khi chạy
4. **Test mapping**: Test với sample data nhỏ trước
5. **Check constraints**: Đảm bảo database constraints đúng
