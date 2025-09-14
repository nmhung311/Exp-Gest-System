#!/bin/bash

echo "🚀 Bắt đầu build và deploy..."

# Build frontend
echo "📦 Building frontend..."
cd frontend

# Xóa thư mục .next cũ
sudo rm -rf .next

# Build với NODE_ENV=production
NODE_ENV=production npm run build

# Kiểm tra thư mục out
if [ -d "out" ]; then
    echo "✅ Build thành công! Thư mục out đã được tạo."
    ls -la out/
    
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
    echo "https://nmhung311.github.io/Exp-Gest-System"
else
    echo "❌ Build thất bại! Không tìm thấy thư mục out."
    echo "Hãy kiểm tra logs build để xem lỗi gì."
fi

