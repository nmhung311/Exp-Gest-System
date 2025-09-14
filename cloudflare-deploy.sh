#!/bin/bash

echo "🚀 Deploy lên Cloudflare Pages..."

# Kiểm tra Wrangler
if ! command -v wrangler &> /dev/null; then
    echo "📥 Cài đặt Wrangler CLI..."
    npm install -g wrangler
fi

# Đăng nhập Cloudflare (nếu chưa)
echo "🔐 Kiểm tra đăng nhập Cloudflare..."
if ! wrangler whoami &> /dev/null; then
    echo "Vui lòng đăng nhập Cloudflare:"
    wrangler login
fi

# Build frontend
echo "🔨 Build frontend..."
cd frontend

# Cài đặt dependencies
npm install

# Build Next.js
echo "📦 Building Next.js app..."
npm run build

# Copy file cấu hình Cloudflare
echo "📋 Copy file cấu hình..."
cp ../_headers out/
cp ../_redirects out/

echo "✅ Build hoàn tất!"

# Deploy lên Cloudflare Pages
echo "🌐 Deploy lên Cloudflare Pages..."
wrangler pages deploy out --project-name exp-gest-system

echo "🎉 Deploy hoàn tất!"
echo "🔗 Truy cập tại: https://exp-gest-system.pages.dev"
