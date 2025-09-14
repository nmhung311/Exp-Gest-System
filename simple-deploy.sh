#!/bin/bash

echo "🚀 Deploy đơn giản lên Cloudflare Pages..."

# Cài đặt Wrangler nếu chưa có
if ! command -v wrangler &> /dev/null; then
    echo "📥 Cài đặt Wrangler CLI..."
    npm install -g wrangler
fi

# Đăng nhập Cloudflare
echo "🔐 Đăng nhập Cloudflare..."
wrangler login

# Build frontend
echo "🔨 Build frontend..."
cd frontend

# Xóa cache cũ
rm -rf .next out

# Cài đặt dependencies
npm install

# Build
npm run build

# Copy file cấu hình
cp ../_headers out/
cp ../_redirects out/

echo "✅ Build hoàn tất!"

# Deploy
echo "🌐 Deploy lên Cloudflare Pages..."
wrangler pages deploy out --project-name exp-gest-system

echo "🎉 Deploy hoàn tất!"
echo "🔗 Truy cập tại: https://exp-gest-system.pages.dev"
