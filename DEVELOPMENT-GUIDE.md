# 🚀 Hướng dẫn Development

## ✅ **Đã cấu hình xong!**

Hệ thống API tự động chuyển đổi URLs đã được cấu hình hoàn chỉnh:

- **Backend**: Chạy trên port 5001
- **Frontend**: Chạy trên port 3001  
- **API**: Tự động chuyển đổi giữa development và production

## 🎯 **Cách sử dụng**

### 1. Khởi động Development (Cả Frontend + Backend)
```bash
# Từ thư mục gốc
npm run dev

# Hoặc
./start-dev.sh
```

### 2. Khởi động riêng lẻ
```bash
# Backend only
npm run dev:backend

# Frontend only  
npm run dev:frontend
```

### 3. Production Deploy
```bash
# Set domain và build
cd frontend
npm run build:prod your-domain.com
```

## 🌐 **URLs**

| Service | Development | Production |
|---------|-------------|------------|
| Frontend | http://localhost:3001 | https://your-domain.com |
| Backend API | http://localhost:5001 | https://your-domain.com/api |

## 🔧 **API Configuration**

### Development
- Tự động sử dụng `http://localhost:5001`
- Không cần thay đổi code

### Production  
- Tự động sử dụng `https://your-domain.com`
- Chỉ cần chạy `npm run build:prod your-domain.com`

## 📁 **Files quan trọng**

- `lib/config.ts` - Cấu hình API URLs
- `lib/api.ts` - API utility functions
- `start-dev.sh` - Script khởi động development
- `API-CONFIG-GUIDE.md` - Hướng dẫn chi tiết

## 🎉 **Kết quả**

✅ **Vấn đề đã được giải quyết hoàn toàn!**

- Không cần thay đổi API URLs thủ công
- Tự động chuyển đổi giữa dev/prod
- Một lệnh để khởi động toàn bộ hệ thống
- Một lệnh để deploy production

**Bây giờ bạn có thể focus vào code thay vì lo về cấu hình!** 🎊
