#!/bin/bash

# Script để kiểm tra trạng thái services
echo "🔍 Checking services status..."

# Check Backend
if [ -f logs/backend.pid ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "✅ Backend is running (PID: $BACKEND_PID)"
        echo "   URL: http://192.168.1.135:5008"
    else
        echo "❌ Backend is not running"
    fi
else
    echo "❌ Backend PID file not found"
fi

# Check Frontend
if [ -f logs/frontend.pid ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "✅ Frontend is running (PID: $FRONTEND_PID)"
        echo "   URL: http://192.168.1.135:3000"
    else
        echo "❌ Frontend is not running"
    fi
else
    echo "❌ Frontend PID file not found"
fi

# Check logs
echo ""
echo "📋 Recent logs:"
echo "Backend logs:"
tail -5 logs/backend.log 2>/dev/null || echo "No backend logs found"
echo ""
echo "Frontend logs:"
tail -5 logs/frontend.log 2>/dev/null || echo "No frontend logs found"
