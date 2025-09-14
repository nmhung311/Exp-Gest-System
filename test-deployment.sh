#!/bin/bash

# Script test deployment
echo "🧪 Kiểm tra deployment..."

# Kiểm tra Wrangler CLI
if command -v wrangler &> /dev/null; then
    echo "✅ Wrangler CLI đã được cài đặt"
    wrangler --version
else
    echo "❌ Wrangler CLI chưa được cài đặt"
    echo "Chạy: npm install -g wrangler"
fi

# Kiểm tra đăng nhập
if wrangler whoami &> /dev/null; then
    echo "✅ Đã đăng nhập Cloudflare"
    wrangler whoami
else
    echo "❌ Chưa đăng nhập Cloudflare"
    echo "Chạy: wrangler login"
fi

# Kiểm tra frontend build
echo "🔨 Kiểm tra frontend build..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "📥 Cài đặt dependencies frontend..."
    npm install
fi

echo "🔨 Build frontend..."
if npm run build; then
    echo "✅ Frontend build thành công"
else
    echo "❌ Frontend build thất bại"
    exit 1
fi

cd ..

# Kiểm tra file cấu hình
echo "📋 Kiểm tra file cấu hình..."
if [ -f "_headers" ] && [ -f "_redirects" ] && [ -f "wrangler.toml" ]; then
    echo "✅ Tất cả file cấu hình đã sẵn sàng"
else
    echo "❌ Thiếu file cấu hình"
    exit 1
fi

echo "🎉 Tất cả kiểm tra đã hoàn tất! Sẵn sàng deploy."
echo ""
echo "Để deploy, chạy một trong các lệnh sau:"
echo "  npm run deploy:frontend  # Chỉ deploy frontend"
echo "  npm run deploy:full      # Deploy cả frontend và backend"

