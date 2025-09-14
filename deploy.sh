#!/bin/bash

echo "🚀 Bắt đầu deploy lên GitHub Pages..."

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm run build

# Kiểm tra thư mục out
if [ -d "out" ]; then
    echo "✅ Build thành công! Thư mục out đã được tạo."
    ls -la out/
else
    echo "❌ Build thất bại! Không tìm thấy thư mục out."
    exit 1
fi

# Copy files ra ngoài để deploy
echo "📋 Copying files..."
cd ..
mkdir -p docs
cp -r frontend/out/* docs/

# Commit và push
echo "📤 Pushing to GitHub..."
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main

echo "🎉 Deploy hoàn thành! Ứng dụng sẽ có sẵn tại:"
echo "https://your-username.github.io/Exp-Gest-System"
