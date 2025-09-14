# Hướng dẫn Deploy lên Cloudflare Pages

## Cách 1: Deploy trực tiếp từ GitHub (Khuyến nghị)

### Bước 1: Push code lên GitHub
```bash
git add .
git commit -m "Prepare for Cloudflare deployment"
git push origin main
```

### Bước 2: Kết nối với Cloudflare Pages
1. Đăng nhập vào [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Vào **Pages** > **Create a project**
3. Chọn **Connect to Git**
4. Chọn repository **Exp-Gest-System**
5. Cấu hình build settings:
   - **Framework preset**: Next.js
   - **Build command**: `cd frontend && npm run build`
   - **Build output directory**: `frontend/out`
   - **Root directory**: `/` (để trống)

### Bước 3: Cấu hình biến môi trường (nếu cần)
- Vào **Settings** > **Environment variables**
- Thêm các biến cần thiết

## Cách 2: Deploy thủ công với Wrangler

### Bước 1: Cài đặt Wrangler
```bash
npm install -g wrangler
```

### Bước 2: Đăng nhập
```bash
wrangler login
```

### Bước 3: Build và deploy
```bash
cd frontend
npm install
npm run build
cp ../_headers out/
cp ../_redirects out/
wrangler pages deploy out --project-name exp-gest-system
```

## Cách 3: Sử dụng script tự động

```bash
# Chạy script deploy
./cloudflare-deploy.sh
```

## Troubleshooting

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

### Kiểm tra deployment
- Frontend: https://exp-gest-system.pages.dev
- Logs: Cloudflare Dashboard > Pages > exp-gest-system > Functions > Logs
