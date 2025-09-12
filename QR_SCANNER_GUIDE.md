# Hướng dẫn sử dụng chức năng QR Scanner

## Tổng quan
Chức năng QR Scanner cho phép quét mã QR của khách mời để thực hiện check-in tự động. Hệ thống hỗ trợ cả quét bằng camera và nhập mã thủ công.

## Các tính năng chính

### 1. Quét QR Code bằng Camera
- **Vị trí**: Trang Check-in (`/dashboard/checkin`)
- **Cách sử dụng**:
  1. Nhấn nút "Bật camera quét QR"
  2. Cho phép truy cập camera khi được yêu cầu
  3. Đưa mã QR vào khung quét
  4. Hệ thống sẽ tự động nhận diện và xử lý

### 2. Nhập mã QR thủ công
- **Vị trí**: Trang Check-in (`/dashboard/checkin`)
- **Cách sử dụng**:
  1. Nhập mã QR vào ô "Nhập mã QR hoặc mã dự phòng..."
  2. Nhấn nút "Ghi nhận" hoặc phím Enter

### 3. Tạo QR Code cho khách mời
- **Vị trí**: Trang Quản lý khách mời (`/dashboard/guests`)
- **Cách sử dụng**:
  1. Tìm khách mời trong danh sách
  2. Nhấn nút "QR" (màu tím) trong cột "Thao tác"
  3. QR code sẽ được tải xuống dưới dạng file PNG

## Cấu trúc QR Code

QR code chứa URL có định dạng:
```
http://localhost:3000/invite/{token}
```

Trong đó `{token}` là mã token duy nhất được tạo cho mỗi khách mời.

## API Endpoints

### 1. Tạo QR Code cho khách mời
```
POST /api/guests/{guest_id}/qr
```
**Response**: `{"guest_id": 123, "token": "abc123..."}`

### 2. Tải QR Code dưới dạng hình ảnh
```
GET /api/guests/{guest_id}/qr-image
```
**Response**: File PNG chứa QR code

### 3. Check-in qua QR Code
```
POST /api/checkin
Content-Type: application/json

{
  "qr_code": "token_string",
  "gate": "QR Scanner",
  "staff": "System"
}
```

### 4. Xác thực QR Code
```
GET /api/qr/validate?token={token}
```
**Response**: `{"valid": true, "guest": {...}}`

## Cài đặt và yêu cầu

### Frontend Dependencies
```bash
npm install jsqr
```

### Backend Dependencies
```bash
pip install qrcode
```

## Xử lý lỗi

### Lỗi Camera
- **Nguyên nhân**: Không có quyền truy cập camera hoặc camera không khả dụng
- **Giải pháp**: Cho phép quyền truy cập camera trong trình duyệt

### Lỗi QR Code không hợp lệ
- **Nguyên nhân**: QR code không đúng định dạng hoặc token đã hết hạn
- **Giải pháp**: Tạo QR code mới cho khách mời

### Lỗi đã check-in
- **Nguyên nhân**: Khách mời đã check-in trước đó
- **Giải pháp**: Kiểm tra danh sách khách đã check-in

## Test chức năng

### 1. Test QR Generator
Truy cập `/test-qr-generator` để tạo QR code test

### 2. Test QR Scanner
Truy cập `/test-qr-scanner` để test chức năng quét QR

### 3. Test tích hợp
1. Tạo khách mời mới trong trang quản lý
2. Tải QR code cho khách mời
3. Sử dụng QR code để check-in trong trang check-in

## Bảo mật

- Mỗi token chỉ có thể sử dụng một lần để check-in
- Token có thể bị thu hồi (revoke) bất cứ lúc nào
- QR code chứa URL công khai, cần bảo mật token

## Troubleshooting

### Camera không hoạt động
1. Kiểm tra quyền truy cập camera
2. Đảm bảo sử dụng HTTPS (trong production)
3. Kiểm tra camera có đang được sử dụng bởi ứng dụng khác

### QR Code không được nhận diện
1. Đảm bảo QR code rõ nét và đủ ánh sáng
2. Giữ camera ổn định
3. Thử quét từ các góc độ khác nhau

### Lỗi kết nối API
1. Kiểm tra backend có đang chạy không
2. Kiểm tra URL API trong code
3. Kiểm tra CORS settings
