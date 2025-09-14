# Hướng dẫn Deploy lên Cloudflare

## Tổng quan
Dự án này được cấu hình để deploy lên Cloudflare với:
- **Frontend**: Cloudflare Pages (Next.js)
- **Backend**: Cloudflare Workers (Python)

## Cách 1: Deploy thủ công

### Bước 1: Cài đặt Wrangler CLI
```bash
npm install -g wrangler
```

### Bước 2: Đăng nhập Cloudflare
```bash
wrangler login
```

### Bước 3: Chạy script deployment
```bash
# Deploy chỉ frontend
./deploy-cloudflare.sh

# Hoặc deploy cả frontend và backend
./deploy-full.sh
```

## Cách 2: Deploy tự động với GitHub Actions

### Bước 1: Tạo Cloudflare API Token
1. Đăng nhập vào [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Vào **My Profile** > **API Tokens**
3. Tạo token mới với quyền:
   - **Cloudflare Pages:Edit**
   - **Cloudflare Workers:Edit**
   - **Account:Read**

### Bước 2: Thêm Secrets vào GitHub
Vào repository GitHub > **Settings** > **Secrets and variables** > **Actions** và thêm:
- `CLOUDFLARE_API_TOKEN`: API token vừa tạo
- `CLOUDFLARE_ACCOUNT_ID`: Account ID từ Cloudflare Dashboard

### Bước 3: Push code lên main branch
```bash
git add .
git commit -m "Add Cloudflare deployment"
git push origin main
```

## Cấu trúc Deployment

### Frontend (Cloudflare Pages)
- **URL**: `https://exp-gest-system.pages.dev`
- **Build command**: `cd frontend && npm run build`
- **Output directory**: `frontend/out`
- **Static files**: `_headers`, `_redirects`

### Backend (Cloudflare Workers)
- **URL**: `https://exp-gest-system.your-subdomain.workers.dev`
- **Main file**: `backend/worker.py`
- **Runtime**: Python với Pyodide

## Cấu hình Domain tùy chỉnh

1. Vào Cloudflare Dashboard
2. Chọn domain của bạn
3. **Pages** > **Custom domains** > **Set up a custom domain**
4. Nhập domain mong muốn (ví dụ: `yourdomain.com`)

## Biến môi trường

Để cấu hình biến môi trường:

### Cloudflare Pages
1. Vào **Pages** > **exp-gest-system** > **Settings** > **Environment variables**
2. Thêm các biến cần thiết

### Cloudflare Workers
1. Vào **Workers & Pages** > **exp-gest-system** > **Settings** > **Variables**
2. Thêm các biến cần thiết

## Troubleshooting

### Lỗi build frontend
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Lỗi deploy backend
```bash
wrangler whoami  # Kiểm tra đăng nhập
wrangler deploy --compatibility-date 2024-01-01
```

### Kiểm tra logs
```bash
# Frontend logs
wrangler pages deployment list --project-name exp-gest-system

# Backend logs
wrangler tail exp-gest-system
```

## Monitoring

- **Cloudflare Analytics**: Xem traffic và performance
- **Cloudflare Logs**: Xem logs real-time
- **GitHub Actions**: Xem trạng thái deployment

## Liên kết hữu ích

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)

