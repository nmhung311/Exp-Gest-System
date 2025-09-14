#!/bin/bash

# Quick deploy script for your server: 27.72.246.67:3000
# Usage: ./deploy-to-server.sh [username]

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
SERVER_IP="27.72.246.67"
USERNAME=${1:-"root"}
PORT=3000

echo -e "${GREEN}🚀 Deploy lên server $SERVER_IP:$PORT...${NC}"

# Create deployment package
echo -e "${YELLOW}📦 Tạo package...${NC}"
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

# Upload and deploy
echo -e "${YELLOW}📤 Upload và deploy...${NC}"
scp exp-gest-deploy.tar.gz $USERNAME@$SERVER_IP:/tmp/

ssh $USERNAME@$SERVER_IP << EOF
set -e

echo "📁 Cập nhật ứng dụng..."
cd /opt/exp-gest-system
tar -xzf /tmp/exp-gest-deploy.tar.gz
rm /tmp/exp-gest-deploy.tar.gz

echo "🐍 Cập nhật dependencies..."
cd backend
source venv/bin/activate
pip install -r requirements.txt

echo "🔄 Restart service..."
sudo systemctl restart exp-gest-backend

echo "🌐 Kiểm tra API..."
sleep 3
curl -s http://localhost:$PORT/ || echo "API chưa sẵn sàng"

echo "✅ Deploy hoàn tất!"
echo "🌐 Backend API: http://$SERVER_IP:$PORT"
EOF

# Cleanup
rm exp-gest-deploy.tar.gz

echo -e "${GREEN}✅ Deploy hoàn tất!${NC}"
echo -e "${GREEN}🌐 Backend API: http://$SERVER_IP:$PORT${NC}"
echo -e "${GREEN}📊 Kiểm tra logs: ssh $USERNAME@$SERVER_IP 'sudo journalctl -u exp-gest-backend -f'${NC}"
