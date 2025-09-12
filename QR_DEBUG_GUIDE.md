# Hướng dẫn Debug QR Scanner

## Vấn đề hiện tại
QR Scanner đã bật camera và hiển thị video nhưng không phản ứng khi quét QR code.

## Các bước debug

### 1. Kiểm tra Console Logs
1. Mở Developer Tools (F12)
2. Vào tab Console
3. Bật camera quét QR
4. Kiểm tra các log messages:
   - "Camera đã khởi động, đang bắt đầu quét..."
   - "Video đã sẵn sàng, bắt đầu quét QR..."
   - "Đang quét... (số lần)"
   - "QR Code detected: ..." (nếu tìm thấy)

### 2. Test với trang debug
1. Truy cập `/test-simple-scanner`
2. Nhấn "Bật camera quét QR"
3. Kiểm tra debug info hiển thị trên camera:
   - Scanning: Yes/No
   - Count: số lần quét
   - Video: readyState

### 3. Tạo QR code test
1. Truy cập `/test-simple-qr`
2. Tạo QR code với nội dung: `test-token-123`
3. Sử dụng QR code này để test

### 4. Kiểm tra các vấn đề có thể xảy ra

#### A. Camera không hoạt động
- **Triệu chứng**: Không có video hiển thị
- **Nguyên nhân**: Không có quyền truy cập camera
- **Giải pháp**: Cho phép quyền truy cập camera trong trình duyệt

#### B. jsQR không load được
- **Triệu chứng**: Console hiển thị "Error loading jsQR"
- **Nguyên nhân**: Lỗi kết nối internet hoặc CDN
- **Giải pháp**: Kiểm tra kết nối internet, thử refresh trang

#### C. QR code không được nhận diện
- **Triệu chứng**: Camera hoạt động nhưng không quét được QR
- **Nguyên nhân**: 
  - QR code không rõ nét
  - Ánh sáng không đủ
  - QR code quá nhỏ hoặc quá lớn
- **Giải pháp**: 
  - Đảm bảo QR code rõ nét
  - Cải thiện ánh sáng
  - Giữ camera ổn định

#### D. Video không sẵn sàng
- **Triệu chứng**: Debug info hiển thị "Video: N/A"
- **Nguyên nhân**: Video chưa load xong
- **Giải pháp**: Đợi thêm vài giây

### 5. Test từng bước

#### Bước 1: Test camera cơ bản
```javascript
// Mở console và chạy:
navigator.mediaDevices.getUserMedia({video: true})
  .then(stream => console.log('Camera OK:', stream))
  .catch(err => console.error('Camera Error:', err))
```

#### Bước 2: Test jsQR
```javascript
// Mở console và chạy:
import('jsqr').then(jsQR => console.log('jsQR OK:', jsQR))
  .catch(err => console.error('jsQR Error:', err))
```

#### Bước 3: Test QR detection
1. Tạo QR code với nội dung đơn giản: `test123`
2. Chụp ảnh QR code
3. Upload lên trang test QR online để kiểm tra

### 6. Các trang test có sẵn

1. **`/test-simple-qr`**: Tạo QR code test
2. **`/test-simple-scanner`**: Test QR scanner với debug info
3. **`/debug-qr`**: Test QR scanner chi tiết
4. **`/dashboard/checkin`**: Trang check-in chính

### 7. Logs cần kiểm tra

#### Console logs bình thường:
```
Camera đã khởi động, đang bắt đầu quét...
Video đã sẵn sàng, bắt đầu quét QR...
Đang quét... (1)
Đang quét... (2)
...
QR Code detected: test-token-123
```

#### Console logs có lỗi:
```
Error loading jsQR: [error message]
Lỗi quét: [error message]
Không thể truy cập camera: [error message]
```

### 8. Giải pháp khắc phục

#### Nếu jsQR không load được:
1. Kiểm tra kết nối internet
2. Thử refresh trang
3. Kiểm tra firewall/proxy

#### Nếu camera không hoạt động:
1. Cho phép quyền truy cập camera
2. Kiểm tra camera có đang được sử dụng bởi ứng dụng khác
3. Thử với trình duyệt khác

#### Nếu QR code không được nhận diện:
1. Đảm bảo QR code rõ nét
2. Cải thiện ánh sáng
3. Giữ camera ổn định
4. Thử với QR code khác

### 9. Test cuối cùng

1. Mở `/test-simple-qr`
2. Tạo QR code với nội dung: `test-token-123`
3. Mở `/test-simple-scanner`
4. Bật camera và quét QR code
5. Kiểm tra console logs và debug info

Nếu vẫn không hoạt động, hãy gửi thông tin debug từ console logs để tôi có thể hỗ trợ thêm.
