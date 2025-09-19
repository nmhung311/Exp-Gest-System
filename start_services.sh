#!/bin/bash

echo "🚀 Starting EXP Gest System Services..."

# Start Backend
echo "📡 Starting Backend..."
cd /home/hung/Exp-Gest-System/backend
nohup python -m uvicorn main:app --host 0.0.0.0 --port 5008 > ../logs/backend.log 2>&1 &
echo $! > ../logs/backend.pid
echo "✅ Backend started (PID: $(cat ../logs/backend.pid))"

# Start Frontend
echo "🎨 Starting Frontend..."
cd /home/hung/Exp-Gest-System/frontend
nohup npm run dev > ../logs/frontend.log 2>&1 &
echo $! > ../logs/frontend.pid
echo "✅ Frontend started (PID: $(cat ../logs/frontend.pid))"

echo "🎉 All services started successfully!"
echo "📊 Backend: http://localhost:5008"
echo "🌐 Frontend: http://localhost:3000"
echo ""
echo "📝 Logs:"
echo "   Backend: tail -f logs/backend.log"
echo "   Frontend: tail -f logs/frontend.log"
echo ""
echo "🛑 To stop: ./stop_services.sh"
