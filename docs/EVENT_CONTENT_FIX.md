# Hướng dẫn khắc phục vấn đề nội dung thiệp mời bị mất

## Vấn đề
Nội dung thiệp mời (`event_content`) của khách mời bị mất sau một thời gian sử dụng.

## Nguyên nhân
1. **Frontend polling quá thường xuyên**: Frontend gọi API `/api/guests` mỗi 30 giây và khi user focus vào trang
2. **Race condition**: Có thể có nhiều requests đồng thời gây xung đột dữ liệu
3. **Logic cập nhật không an toàn**: Dữ liệu từ server có thể ghi đè lên `event_content` hiện tại

## Giải pháp đã triển khai

### 1. Giảm tần suất polling
- Thay đổi từ 30 giây xuống 60 giây
- Thêm cơ chế throttle để tránh check quá thường xuyên khi focus

### 2. Bảo vệ dữ liệu event_content
- Chỉ cập nhật `event_content` khi có giá trị hợp lệ từ server
- Không ghi đè nội dung hiện tại nếu server trả về null/empty
- Sử dụng backup từ localStorage khi cần

### 3. Backup và khôi phục
- Tự động backup `event_content` vào localStorage
- Script khôi phục dữ liệu bị mất
- Script monitor để cảnh báo khi có vấn đề

## Cách sử dụng

### Kiểm tra dữ liệu hiện tại
```bash
cd /home/hung/Exp-Gest-System/backend
python3 -c "
from app import create_app
from models import db, Guest
app = create_app()
with app.app_context():
    guests = Guest.query.all()
    guests_with_content = [g for g in guests if g.event_content and g.event_content.strip()]
    print(f'Total guests: {len(guests)}')
    print(f'Guests with event_content: {len(guests_with_content)}')
"
```

### Khôi phục dữ liệu bị mất
```bash
cd /home/hung/Exp-Gest-System/backend
python3 fix_event_content.py
```

### Monitor dữ liệu (tùy chọn)
```bash
cd /home/hung/Exp-Gest-System/backend
python3 monitor_event_content.py
```

## Các thay đổi trong code

### Frontend (`frontend/app/invite/[token]/page.tsx`)
1. **Giảm tần suất polling**: Từ 30s xuống 60s
2. **Thêm throttle**: Tối thiểu 10s giữa các lần check khi focus
3. **Bảo vệ event_content**: Logic kiểm tra nghiêm ngặt hơn
4. **Backup localStorage**: Tự động lưu và khôi phục từ localStorage

### Backend
1. **Script khôi phục**: `fix_event_content.py`
2. **Script monitor**: `monitor_event_content.py`

## Khuyến nghị

1. **Kiểm tra định kỳ**: Chạy script kiểm tra dữ liệu định kỳ
2. **Backup database**: Thường xuyên backup database để tránh mất dữ liệu
3. **Monitor logs**: Theo dõi logs để phát hiện vấn đề sớm
4. **Test kỹ lưỡng**: Test các thay đổi trên môi trường dev trước khi deploy

## Liên hệ hỗ trợ
Nếu vấn đề vẫn tiếp tục xảy ra, hãy:
1. Chạy script monitor để theo dõi
2. Kiểm tra logs của backend và frontend
3. Liên hệ team phát triển để hỗ trợ thêm
