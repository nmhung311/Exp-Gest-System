# Hướng dẫn Deploy lên Cloudflare - Từng bước chi tiết

## 🚀 Cách 1: Deploy trực tiếp với Wrangler CLI

### Bước 1: Cài đặt Wrangler CLI
```bash
npm install -g wrangler
```

### Bước 2: Đăng nhập Cloudflare
```bash
wrangler login
```
- Mở trình duyệt và đăng nhập vào Cloudflare
- Cho phép Wrangler truy cập tài khoản của bạn

### Bước 3: Build ứng dụng
```bash
cd frontend

# Xóa cache cũ
rm -rf .next out

# Cài đặt dependencies
npm install

# Build ứng dụng
npm run build

# Copy file cấu hình
cp ../_headers out/
cp ../_redirects out/
```

### Bước 4: Deploy
```bash
wrangler pages deploy out --project-name exp-gest-system
```

## 🌐 Cách 2: Deploy từ Cloudflare Dashboard

### Bước 1: Chuẩn bị file build
```bash
cd frontend
npm run build
cp ../_headers out/
cp ../_redirects out/
```

### Bước 2: Upload thủ công
1. Đăng nhập [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Vào **Pages** > **Create a project**
3. Chọn **Upload assets**
4. Kéo thả thư mục `frontend/out` vào
5. Đặt tên project: `exp-gest-system`

## 🔧 Cách 3: Deploy từ GitHub (Sau khi push thành công)

### Bước 1: Push code lên GitHub
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Bước 2: Kết nối Cloudflare Pages
1. Vào [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. **Pages** > **Create a project** > **Connect to Git**
3. Chọn repository: `nmhung311/Exp-Gest-System`
4. Cấu hình:
   - **Framework preset**: Next.js
   - **Build command**: `cd frontend && npm run build`
   - **Build output directory**: `frontend/out`
   - **Root directory**: `/` (để trống)

## 🐛 Khắc phục lỗi thường gặp

### Lỗi quyền truy cập file
```bash
sudo chown -R $USER:$USER /home/hung/Exp-Gest-System/frontend
rm -rf /home/hung/Exp-Gest-System/frontend/.next
rm -rf /home/hung/Exp-Gest-System/frontend/out
```

### Lỗi build Next.js
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Lỗi Wrangler
```bash
wrangler logout
wrangler login
```

## 📱 Kiểm tra kết quả

Sau khi deploy thành công, truy cập:
- **URL**: `https://exp-gest-system.pages.dev`
- **Logs**: Cloudflare Dashboard > Pages > exp-gest-system > Functions > Logs

## 💡 Lưu ý quan trọng

1. **Đảm bảo build thành công** trước khi deploy
2. **Kiểm tra file cấu hình** `_headers` và `_redirects`
3. **Đăng nhập Cloudflare** trước khi chạy wrangler
4. **Kiểm tra logs** nếu có lỗi

## 🆘 Nếu vẫn gặp vấn đề

1. Thử **Cách 2** (upload thủ công) - đơn giản nhất
2. Kiểm tra **logs** trong Cloudflare Dashboard
3. Đảm bảo **Next.js config** đúng với `output: 'export'`
