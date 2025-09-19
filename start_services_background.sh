#!/bin/bash

# Script để chạy frontend và backend ngầm
echo "🚀 Starting services in background..."

# Kill existing processes if any
pkill -f "python3 app.py" 2>/dev/null
pkill -f "next dev" 2>/dev/null
pkill -f "next start" 2>/dev/null

# Start Backend
echo "📡 Starting Backend..."
cd /home/hung/Exp-Gest-System/backend
nohup python3 app.py > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait a bit for backend to start
sleep 3

# Start Frontend
echo "🌐 Starting Frontend..."
cd /home/hung/Exp-Gest-System/frontend
nohup npm run dev:ip > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Save PIDs to file
echo "$BACKEND_PID" > ../logs/backend.pid
echo "$FRONTEND_PID" > ../logs/frontend.pid

echo "✅ Services started successfully!"
echo "Backend: http://192.168.1.135:5008"
echo "Frontend: http://192.168.1.135:3000"
echo "Logs: /home/hung/Exp-Gest-System/logs/"
