# 🚀 Hướng dẫn Deploy EXP Guest Management System

## 📋 Yêu cầu hệ thống

### Server Requirements:
- **OS**: Ubuntu 20.04+ hoặc CentOS 7+
- **RAM**: Tối thiểu 1GB, khuyến nghị 2GB+
- **CPU**: 1 core, khuyến nghị 2 cores+
- **Disk**: Tối thiểu 5GB trống
- **Network**: Port 5001 mở cho API

### Software Requirements:
- Python 3.8+
- pip3
- systemd (có sẵn trên Ubuntu/CentOS)

## 🚀 Cách Deploy

### 1. Deploy tự động (Khuyến nghị)

```bash
# Cấp quyền thực thi
chmod +x deploy.sh

# Deploy lên server
./deploy.sh <server_ip> <username>

# Ví dụ:
./deploy.sh 192.168.1.100 root
./deploy.sh your-domain.com ubuntu
```

### 2. Deploy thủ công

#### Bước 1: Chuẩn bị server
```bash
# SSH vào server
ssh username@your-server-ip

# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Cài đặt Python và pip
sudo apt install -y python3 python3-pip python3-venv

# Tạo thư mục ứng dụng
sudo mkdir -p /opt/exp-gest-system
sudo chown $USER:$USER /opt/exp-gest-system
```

#### Bước 2: Upload code
```bash
# Từ máy local, tạo package
tar -czf exp-gest-deploy.tar.gz \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='out' \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    .

# Upload lên server
scp exp-gest-deploy.tar.gz username@your-server-ip:/tmp/
```

#### Bước 3: Cài đặt trên server
```bash
# SSH vào server
ssh username@your-server-ip

# Giải nén
cd /opt/exp-gest-system
tar -xzf /tmp/exp-gest-deploy.tar.gz
rm /tmp/exp-gest-deploy.tar.gz

# Cài đặt dependencies
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Tạo database
python3 -c "from app import create_app, db; app = create_app(); app.app_context().push(); db.create_all()"
```

#### Bước 4: Cấu hình systemd service
```bash
# Tạo service file
sudo tee /etc/systemd/system/exp-gest-backend.service > /dev/null << 'EOF'
[Unit]
Description=EXP Guest Management Backend
After=network.target

[Service]
Type=exec
User=your-username
Group=your-username
WorkingDirectory=/opt/exp-gest-system/backend
Environment=PATH=/opt/exp-gest-system/backend/venv/bin
ExecStart=/opt/exp-gest-system/backend/venv/bin/gunicorn --config gunicorn.conf.py app:app
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Tạo thư mục log
sudo mkdir -p /var/log/exp-gest
sudo chown your-username:your-username /var/log/exp-gest

# Khởi động service
sudo systemctl daemon-reload
sudo systemctl enable exp-gest-backend
sudo systemctl start exp-gest-backend
```

## 🔧 Quản lý Service

### Kiểm tra trạng thái
```bash
sudo systemctl status exp-gest-backend
```

### Xem logs
```bash
# Logs realtime
sudo journalctl -u exp-gest-backend -f

# Logs gần đây
sudo journalctl -u exp-gest-backend --since "1 hour ago"
```

### Khởi động/Dừng/Restart
```bash
sudo systemctl start exp-gest-backend
sudo systemctl stop exp-gest-backend
sudo systemctl restart exp-gest-backend
```

### Cập nhật ứng dụng
```bash
# Upload code mới
scp exp-gest-deploy.tar.gz username@server:/tmp/

# Trên server
cd /opt/exp-gest-system
tar -xzf /tmp/exp-gest-deploy.tar.gz
sudo systemctl restart exp-gest-backend
```

## 🌐 Cấu hình Nginx (Tùy chọn)

### Cài đặt Nginx
```bash
sudo apt install nginx
```

### Cấu hình reverse proxy
```bash
sudo tee /etc/nginx/sites-available/exp-gest > /dev/null << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location /api/ {
        proxy_pass http://127.0.0.1:5001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Kích hoạt site
sudo ln -s /etc/nginx/sites-available/exp-gest /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🔒 Cấu hình Firewall

```bash
# Mở port 5001
sudo ufw allow 5001

# Hoặc mở port 80 nếu dùng Nginx
sudo ufw allow 80
sudo ufw allow 443
```

## 📊 Monitoring

### Kiểm tra API
```bash
curl http://your-server-ip:5001/
curl http://your-server-ip:5001/api/guests
```

### Kiểm tra tài nguyên
```bash
# CPU và RAM
htop

# Disk usage
df -h

# Service status
sudo systemctl status exp-gest-backend
```

## 🚨 Troubleshooting

### Service không khởi động
```bash
# Xem logs chi tiết
sudo journalctl -u exp-gest-backend -n 50

# Kiểm tra cấu hình
sudo systemctl cat exp-gest-backend
```

### Port đã được sử dụng
```bash
# Tìm process đang dùng port 5001
sudo lsof -i :5001

# Kill process
sudo kill -9 <PID>
```

### Database lỗi
```bash
# Xóa database cũ và tạo lại
cd /opt/exp-gest-system/backend
rm exp_guest.db
python3 -c "from app import create_app, db; app = create_app(); app.app_context().push(); db.create_all()"
```

## 📞 Hỗ trợ

Nếu gặp vấn đề, vui lòng kiểm tra:
1. Logs: `sudo journalctl -u exp-gest-backend -f`
2. Service status: `sudo systemctl status exp-gest-backend`
3. Port availability: `sudo lsof -i :5001`
4. API response: `curl http://localhost:5001/`
