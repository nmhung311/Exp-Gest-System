#!/bin/bash

# Script để khởi động cả frontend và backend cho development
echo "🚀 Starting Development Environment..."

# Dừng các process cũ nếu có
echo "🛑 Stopping existing processes..."
pkill -f "next dev" 2>/dev/null
pkill -f "python.*app.py" 2>/dev/null

# Đợi một chút
sleep 2

# Khởi động backend
echo "🔧 Starting Backend on port 5001..."
cd backend
python3 app.py &
BACKEND_PID=$!
cd ..

# Đợi backend khởi động
echo "⏳ Waiting for backend to start..."
sleep 3

# Kiểm tra backend
if curl -s http://localhost:5001/api/events > /dev/null; then
    echo "✅ Backend is running on http://localhost:5001"
else
    echo "❌ Backend failed to start"
    exit 1
fi

# Khởi động frontend
echo "🎨 Starting Frontend on port 3001..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Đợi frontend khởi động
echo "⏳ Waiting for frontend to start..."
sleep 5

# Kiểm tra frontend (có thể chạy trên port 3000 hoặc 3001)
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is running on http://localhost:3000"
elif curl -s http://localhost:3001 > /dev/null; then
    echo "✅ Frontend is running on http://localhost:3001"
else
    echo "❌ Frontend failed to start"
    exit 1
fi

echo ""
echo "🎉 Development Environment Started Successfully!"
echo "📱 Frontend: http://localhost:3001"
echo "🔧 Backend API: http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop all services"

# Function để cleanup khi dừng
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    pkill -f "next dev" 2>/dev/null
    pkill -f "python.*app.py" 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT

# Đợi cho đến khi user dừng
wait
