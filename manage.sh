#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT="/home/hung/Exp-Gest-System"
BACKEND_VENV="$PROJECT_ROOT/backend/.venv/bin"
HOSTIP="$(hostname -I 2>/dev/null | awk '{print $1}')"
HOSTIP="${HOSTIP:-127.0.0.1}"

http_ok () {
  local url="$1"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || true)
  if [[ "$code" =~ ^[23][0-9]{2}$ || "$code" =~ ^3[0-9]{2}$ ]]; then
    echo "$code"; return 0
  else
    echo "$code"; return 1
  fi
}

case "${1:-}" in
  build)
    echo "🏗️  Build Frontend..."
    cd "$PROJECT_ROOT/frontend"
    if [ -f package-lock.json ]; then
      npm ci
    else
      npm install
    fi
    npm run build
    echo "✅ Build xong."
    ;;

  start)
    # đảm bảo FE đã build
    if [ ! -d "$PROJECT_ROOT/frontend/.next" ]; then
      echo "❌ Chưa có build '.next'. Chạy: ./manage.sh build"
      exit 1
    fi

    echo "🚀 Start Backend (Gunicorn)..."
    cd "$PROJECT_ROOT"
    nohup "$BACKEND_VENV/gunicorn" -w 4 -b 0.0.0.0:5001 backend.app:app \
      > "$PROJECT_ROOT/backend.log" 2>&1 &

    echo "🚀 Start Frontend (Next.js)..."
    cd "$PROJECT_ROOT/frontend"
    nohup npm start -- -p 3000 -H 0.0.0.0 \
      > "$PROJECT_ROOT/frontend.log" 2>&1 &

    echo "🔗 Reload Nginx..."
    if ! sudo -n systemctl reload nginx 2>/dev/null; then
      echo "ℹ️  Nginx cần mật khẩu: sudo systemctl reload nginx"
    fi

    echo "🩺 Health check..."
    sleep 1
    FE_CODE=$(http_ok "http://127.0.0.1:3000/" || true)
    BE_CODE=$(http_ok "http://127.0.0.1:5001/" || true)
    echo "Frontend http://127.0.0.1:3000 => $FE_CODE"
    echo "Backend  http://127.0.0.1:5001 => $BE_CODE"

    echo "🌐 Truy cập từ máy khác:"
    echo "   Frontend: http://$HOSTIP"
    echo "   API:      http://$HOSTIP/api/"
    ;;

  stop)
    echo "🛑 Stop Backend + Frontend..."
    pkill -f "$BACKEND_VENV/gunicorn -w 4 -b 0.0.0.0:5001 backend.app:app" || true
    pkill -f "next start" || true
    ;;

  status)
    echo "📡 Listening ports:"
    ss -ltnp | egrep '(:80|:3000|:5001)' || true
    echo "🩺 HTTP check:"
    echo -n "FE / => "; http_ok "http://127.0.0.1:3000/" || true
    echo -n "BE / => "; http_ok "http://127.0.0.1:5001/" || true
    echo "🧾 Nginx errors (tail):"
    sudo tail -n 30 /var/log/nginx/error.log || true
    ;;

  restart)
    "$0" stop
    "$0" start
    ;;

  backend)
    echo "⚙️  Start-only backend..."
    cd "$PROJECT_ROOT"
    nohup "$BACKEND_VENV/gunicorn" -w 4 -b 0.0.0.0:5001 backend.app:app \
      > "$PROJECT_ROOT/backend.log" 2>&1 &
    ;;

  frontend)
    echo "⚙️  Start-only frontend..."
    cd "$PROJECT_ROOT/frontend"
    nohup npm start -- -p 3000 -H 0.0.0.0 \
      > "$PROJECT_ROOT/frontend.log" 2>&1 &
    ;;

  stop-backend)
    pkill -f "$BACKEND_VENV/gunicorn -w 4 -b 0.0.0.0:5001 backend.app:app" || true
    ;;

  stop-frontend)
    pkill -f "next start" || true
    ;;

  *)
    echo "Usage: ./manage.sh {build|start|stop|restart|status|backend|frontend|stop-backend|stop-frontend}"
    exit 1
    ;;
esac
