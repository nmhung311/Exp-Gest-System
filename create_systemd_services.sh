#!/bin/bash

# Script để tạo systemd services
echo "🔧 Creating systemd services..."

# Create backend service
sudo tee /etc/systemd/system/exp-gest-backend.service > /dev/null << 'BACKEND_EOF'
[Unit]
Description=Exp-Gest Backend Service
After=network.target

[Service]
Type=simple
User=hung
WorkingDirectory=/home/hung/Exp-Gest-System/backend
ExecStart=/usr/bin/python3 app.py
Restart=always
RestartSec=10
Environment=PATH=/usr/bin:/usr/local/bin
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
BACKEND_EOF

# Create frontend service
sudo tee /etc/systemd/system/exp-gest-frontend.service > /dev/null << 'FRONTEND_EOF'
[Unit]
Description=Exp-Gest Frontend Service
After=network.target
Requires=exp-gest-backend.service

[Service]
Type=simple
User=hung
WorkingDirectory=/home/hung/Exp-Gest-System/frontend
ExecStart=/usr/bin/npm run dev:ip
Restart=always
RestartSec=10
Environment=PATH=/usr/bin:/usr/local/bin:/home/hung/.nvm/versions/node/v18.17.0/bin
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
FRONTEND_EOF

# Reload systemd
sudo systemctl daemon-reload

echo "✅ Systemd services created!"
echo ""
echo "To use systemd services:"
echo "  sudo systemctl start exp-gest-backend"
echo "  sudo systemctl start exp-gest-frontend"
echo "  sudo systemctl enable exp-gest-backend"
echo "  sudo systemctl enable exp-gest-frontend"
echo "  sudo systemctl status exp-gest-backend"
echo "  sudo systemctl status exp-gest-frontend"
