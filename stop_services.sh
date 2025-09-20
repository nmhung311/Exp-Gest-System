#!/bin/bash

# Script để dừng tất cả services
echo "🛑 Stopping all services..."

# Read PIDs from files
if [ -f logs/backend.pid ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    echo "Stopping Backend (PID: $BACKEND_PID)..."
    kill $BACKEND_PID 2>/dev/null
    rm logs/backend.pid
fi

if [ -f logs/frontend.pid ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    echo "Stopping Frontend (PID: $FRONTEND_PID)..."
    kill $FRONTEND_PID 2>/dev/null
    rm logs/frontend.pid
fi

# Kill any remaining processes
pkill -f "python3 app.py" 2>/dev/null
pkill -f "next dev" 2>/dev/null
pkill -f "next start" 2>/dev/null

echo "✅ All services stopped!"

