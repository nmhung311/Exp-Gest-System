#!/bin/bash

# Script deployment cho Cloudflare Pages
echo "🚀 Bắt đầu deployment lên Cloudflare..."

# Kiểm tra xem wrangler đã được cài đặt chưa
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI chưa được cài đặt. Đang cài đặt..."
    npm install -g wrangler
fi

# Kiểm tra xem đã đăng nhập Cloudflare chưa
if ! wrangler whoami &> /dev/null; then
    echo "🔐 Vui lòng đăng nhập vào Cloudflare:"
    wrangler login
fi

# Build frontend
echo "📦 Đang build frontend..."
cd frontend

# Cài đặt dependencies nếu cần
if [ ! -d "node_modules" ]; then
    echo "📥 Đang cài đặt dependencies..."
    npm install
fi

# Build Next.js app
echo "🔨 Đang build Next.js app..."
npm run build

# Copy các file cấu hình Cloudflare
echo "📋 Đang copy file cấu hình..."
cp ../_headers out/
cp ../_redirects out/

# Quay lại thư mục gốc
cd ..

# Deploy lên Cloudflare Pages
echo "🌐 Đang deploy lên Cloudflare Pages..."
wrangler pages deploy frontend/out --project-name exp-gest-system

echo "✅ Deployment hoàn tất!"
echo "🔗 Ứng dụng của bạn sẽ có sẵn tại: https://exp-gest-system.pages.dev"

