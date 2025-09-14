#!/bin/bash

# Script deployment đầy đủ cho Cloudflare
echo "🚀 Bắt đầu deployment đầy đủ lên Cloudflare..."

# Kiểm tra và cài đặt Wrangler CLI
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI chưa được cài đặt. Đang cài đặt..."
    npm install -g wrangler
fi

# Kiểm tra đăng nhập Cloudflare
if ! wrangler whoami &> /dev/null; then
    echo "🔐 Vui lòng đăng nhập vào Cloudflare:"
    wrangler login
fi

# 1. Deploy Frontend (Cloudflare Pages)
echo "📦 Đang deploy frontend lên Cloudflare Pages..."

cd frontend

# Cài đặt dependencies
if [ ! -d "node_modules" ]; then
    echo "📥 Đang cài đặt dependencies frontend..."
    npm install
fi

# Build frontend
echo "🔨 Đang build frontend..."
npm run build

# Copy file cấu hình
cp ../_headers out/
cp ../_redirects out/

# Deploy frontend
echo "🌐 Đang deploy frontend..."
wrangler pages deploy out --project-name exp-gest-system

cd ..

# 2. Deploy Backend (Cloudflare Workers)
echo "🔧 Đang deploy backend lên Cloudflare Workers..."

# Cài đặt dependencies cho backend nếu cần
if [ ! -d "backend/node_modules" ]; then
    echo "📥 Đang cài đặt dependencies backend..."
    cd backend
    npm init -y
    npm install pyodide
    cd ..
fi

# Deploy backend worker
echo "⚙️ Đang deploy backend worker..."
wrangler deploy

echo "✅ Deployment hoàn tất!"
echo "🔗 Frontend: https://exp-gest-system.pages.dev"
echo "🔗 Backend API: https://exp-gest-system.your-subdomain.workers.dev"
echo ""
echo "📋 Các bước tiếp theo:"
echo "1. Cấu hình domain tùy chỉnh trong Cloudflare Dashboard"
echo "2. Thiết lập biến môi trường cho database"
echo "3. Cấu hình CORS cho API"

