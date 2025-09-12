# Hướng dẫn khắc phục lỗi QR Scanner

## Vấn đề đã xác định
Từ console logs, lỗi chính là: `AbortError: The play() request was interrupted by a new load request`

## Giải pháp đã áp dụng

### 1. BasicQRScanner - Version cải tiến
- ✅ Xử lý lỗi AbortError khi play video
- ✅ Sử dụng setInterval thay vì requestAnimationFrame
- ✅ Thêm autoPlay cho video element
- ✅ Cải thiện error handling
- ✅ Debug info chi tiết hơn

### 2. Các trang test mới
- `/test-basic-scanner` - Test BasicQRScanner
- `/test-simple-qr` - Tạo QR code test
- `/test-simple-scanner` - Test SimpleQRScanner

## Các bước test ngay

### Bước 1: Test BasicQRScanner
1. Truy cập `http://localhost:3000/test-basic-scanner`
2. Nhấn "Bật camera quét QR"
3. Kiểm tra debug info hiển thị:
   - Scanning: Yes
   - Count: tăng dần
   - Video: 4 (HAVE_ENOUGH_DATA)

### Bước 2: Tạo QR code test
1. Truy cập `http://localhost:3000/test-simple-qr`
2. Tạo QR code với nội dung: `test-token-123`
3. Sử dụng QR code này để test

### Bước 3: Test tích hợp
1. Truy cập `http://localhost:3000/dashboard/checkin`
2. Nhấn "Bật camera quét QR"
3. Quét QR code đã tạo ở bước 2

## Kiểm tra console logs

### Logs bình thường:
```
Video đã phát thành công
Camera đã khởi động, đang bắt đầu quét...
Video đã sẵn sàng, bắt đầu quét QR...
Đang quét... (1) - Video: 640x480
Đang quét... (2) - Video: 640x480
...
QR Code detected: test-token-123
```

### Logs có lỗi:
```
Video play warning: [AbortError message]
Error loading jsQR: [error message]
Lỗi quét: [error message]
```

## Các cải tiến chính

### 1. Xử lý lỗi video play
```javascript
try {
  await videoRef.current.play()
  setDebugInfo("Video đã phát thành công")
} catch (playError) {
  console.warn('Video play warning:', playError)
  setDebugInfo("Video play warning nhưng vẫn tiếp tục")
}
```

### 2. Sử dụng setInterval
```javascript
scanIntervalRef.current = setInterval(async () => {
  // Quét QR code
}, 100) // Quét mỗi 100ms
```

### 3. Thêm autoPlay
```javascript
<video
  ref={videoRef}
  className="w-full h-64 object-cover"
  playsInline
  muted
  autoPlay
/>
```

## Troubleshooting

### Nếu vẫn không hoạt động:

1. **Kiểm tra console logs**
   - Mở Developer Tools (F12)
   - Xem tab Console
   - Tìm lỗi liên quan đến jsQR hoặc camera

2. **Kiểm tra camera permissions**
   - Đảm bảo đã cho phép quyền truy cập camera
   - Thử refresh trang và cho phép lại

3. **Kiểm tra kết nối internet**
   - jsQR library cần tải từ CDN
   - Thử refresh trang nếu mạng chậm

4. **Thử với QR code khác**
   - Sử dụng QR code từ ứng dụng khác
   - Đảm bảo QR code rõ nét và đủ ánh sáng

5. **Thử với trình duyệt khác**
   - Chrome (khuyến nghị)
   - Firefox
   - Edge

## Test cuối cùng

1. Mở `http://localhost:3000/test-basic-scanner`
2. Nhấn "Bật camera quét QR"
3. Tạo QR code từ `http://localhost:3000/test-simple-qr`
4. Quét QR code
5. Kiểm tra kết quả

Nếu vẫn không hoạt động, hãy gửi:
- Console logs chi tiết
- Debug info hiển thị trên camera
- Loại trình duyệt và version
