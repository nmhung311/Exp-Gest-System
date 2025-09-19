#!/bin/bash

# Script để chạy services trong screen sessions
echo "🚀 Starting services in screen sessions..."

# Kill existing screen sessions
screen -S backend -X quit 2>/dev/null
screen -S frontend -X quit 2>/dev/null

# Start Backend in screen
echo "📡 Starting Backend in screen session..."
cd /home/hung/Exp-Gest-System/backend
screen -dmS backend python3 app.py

# Wait a bit for backend to start
sleep 3

# Start Frontend in screen
echo "🌐 Starting Frontend in screen session..."
cd /home/hung/Exp-Gest-System/frontend
screen -dmS frontend npm run dev:ip

echo "✅ Services started in screen sessions!"
echo "Backend: http://192.168.1.135:5008"
echo "Frontend: http://192.168.1.135:3000"
echo ""
echo "To attach to sessions:"
echo "  screen -r backend   # Attach to backend"
echo "  screen -r frontend  # Attach to frontend"
echo "  screen -ls          # List all sessions"
