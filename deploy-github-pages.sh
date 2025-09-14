#!/bin/bash

echo "🚀 Deploy lên GitHub Pages..."

# Kiểm tra git
if ! command -v git &> /dev/null; then
    echo "❌ Git chưa được cài đặt"
    exit 1
fi

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

# Tạo branch gh-pages
echo "📝 Tạo branch gh-pages..."
cd out

# Khởi tạo git nếu chưa có
if [ ! -d ".git" ]; then
    git init
    git remote add origin https://github.com/$(git config user.name)/Exp-Gest-System.git
fi

# Thêm tất cả file
git add .

# Commit
git commit -m "Deploy to GitHub Pages - $(date)"

# Push lên branch gh-pages
git branch -M gh-pages
git push -f origin gh-pages

echo "🎉 Deploy hoàn tất!"
echo "🔗 Truy cập tại: https://$(git config user.name).github.io/Exp-Gest-System"
