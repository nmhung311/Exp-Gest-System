#!/bin/bash

# Deploy script for EXP Guest Management System
# Usage: ./deploy.sh [server_ip] [username]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP=${1:-"27.72.246.67"}
USERNAME=${2:-"root"}
APP_NAME="exp-gest-system"
APP_DIR="/opt/$APP_NAME"
SERVICE_NAME="exp-gest-backend"
PORT=3000

echo -e "${GREEN}🚀 Bắt đầu deploy EXP Guest Management System...${NC}"

# Check if server IP is provided
if [ "$SERVER_IP" = "27.72.246.67" ]; then
    echo -e "${GREEN}✅ Sử dụng server mặc định: $SERVER_IP${NC}"
fi

echo -e "${YELLOW}📦 Chuẩn bị files để deploy...${NC}"

# Create deployment package
tar -czf exp-gest-deploy.tar.gz \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='out' \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='.env' \
    --exclude='*.log' \
    .

echo -e "${YELLOW}📤 Upload files lên server...${NC}"

# Upload to server
scp exp-gest-deploy.tar.gz $USERNAME@$SERVER_IP:/tmp/

echo -e "${YELLOW}🔧 Cài đặt trên server...${NC}"

# Deploy on server
ssh $USERNAME@$SERVER_IP << EOF
set -e

echo "📁 Tạo thư mục ứng dụng..."
sudo mkdir -p $APP_DIR
sudo chown $USERNAME:$USERNAME $APP_DIR

echo "📦 Giải nén files..."
cd $APP_DIR
tar -xzf /tmp/exp-gest-deploy.tar.gz
rm /tmp/exp-gest-deploy.tar.gz

echo "🐍 Cài đặt Python dependencies..."
cd backend
sudo apt update
sudo apt install -y python3 python3-pip python3-venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

echo "📊 Tạo database..."
python3 -c "from app import create_app, db; app = create_app(); app.app_context().push(); db.create_all(); print('Database created successfully')"

echo "🔧 Cài đặt systemd service..."
sudo tee /etc/systemd/system/$SERVICE_NAME.service > /dev/null << 'EOL'
[Unit]
Description=EXP Guest Management Backend
After=network.target

[Service]
Type=exec
User=$USERNAME
Group=$USERNAME
WorkingDirectory=$APP_DIR/backend
Environment=PATH=$APP_DIR/backend/venv/bin
ExecStart=$APP_DIR/backend/venv/bin/gunicorn --config gunicorn.conf.py app:app
ExecReload=/bin/kill -s HUP \$MAINPID
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOL

echo "📝 Tạo thư mục log..."
sudo mkdir -p /var/log/exp-gest
sudo chown $USERNAME:$USERNAME /var/log/exp-gest

echo "🔄 Khởi động service..."
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME
sudo systemctl start $SERVICE_NAME

echo "✅ Kiểm tra trạng thái service..."
sudo systemctl status $SERVICE_NAME --no-pager

echo "🌐 Kiểm tra API..."
sleep 5
curl -shttp://localhost:$PORT/ || echo "API chưa sẵn sàng"

echo "✅ Deploy hoàn tất!"
echo "🌐 Backend API: http://$SERVER_IP:$PORT"
echo "📊 Logs: sudo journalctl -u $SERVICE_NAME -f"
echo "🔄 Restart: sudo systemctl restart $SERVICE_NAME"

EOF

# Cleanup
rm exp-gest-deploy.tar.gz

echo -e "${GREEN}✅ Deploy hoàn tất!${NC}"
echo -e "${GREEN}🌐 Backend API: http://$SERVER_IP:$PORT${NC}"
echo -e "${GREEN}📊 Kiểm tra logs: ssh $USERNAME@$SERVER_IP 'sudo journalctl -u $SERVICE_NAME -f'${NC}"