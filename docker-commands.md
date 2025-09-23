# 🐳 DOCKER COMMANDS - Exp-Gest-System

## 📋 **CÁC LỆNH DOCKER CƠ BẢN**

### **1. Kiểm tra trạng thái containers**
```bash
# Xem tất cả containers đang chạy
sudo docker ps

# Xem tất cả containers (bao gồm đã dừng)
sudo docker ps -a

# Xem trạng thái với format đẹp
sudo docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### **2. Dừng containers**
```bash
# Dừng tất cả containers
sudo docker-compose -f docker-compose.ip-mapping.yml down

# Dừng chỉ một service
sudo docker-compose -f docker-compose.ip-mapping.yml stop frontend
sudo docker-compose -f docker-compose.ip-mapping.yml stop backend
sudo docker-compose -f docker-compose.ip-mapping.yml stop nginx
```

### **3. Khởi động containers**
```bash
# Khởi động tất cả containers
sudo docker-compose -f docker-compose.ip-mapping.yml up -d

# Khởi động chỉ một service
sudo docker-compose -f docker-compose.ip-mapping.yml up -d frontend
sudo docker-compose -f docker-compose.ip-mapping.yml up -d backend
sudo docker-compose -f docker-compose.ip-mapping.yml up -d nginx
```

### **4. Rebuild containers**
```bash
# Rebuild tất cả containers
sudo docker-compose -f docker-compose.ip-mapping.yml build --no-cache

# Rebuild chỉ frontend
sudo docker-compose -f docker-compose.ip-mapping.yml build --no-cache frontend

# Rebuild chỉ backend
sudo docker-compose -f docker-compose.ip-mapping.yml build --no-cache backend
```

### **5. Restart containers**
```bash
# Restart tất cả containers
sudo docker-compose -f docker-compose.ip-mapping.yml restart

# Restart chỉ một service
sudo docker-compose -f docker-compose.ip-mapping.yml restart frontend
sudo docker-compose -f docker-compose.ip-mapping.yml restart backend
sudo docker-compose -f docker-compose.ip-mapping.yml restart nginx
```

## 🔄 **CÁC LỆNH CẬP NHẬT**

### **1. Cập nhật toàn bộ (khuyến nghị)**
```bash
# Dừng → Rebuild → Khởi động
sudo docker-compose -f docker-compose.ip-mapping.yml down
sudo docker-compose -f docker-compose.ip-mapping.yml build --no-cache
sudo docker-compose -f docker-compose.ip-mapping.yml up -d
```

### **2. Cập nhật nhanh (chỉ frontend)**
```bash
# Rebuild và restart chỉ frontend
sudo docker-compose -f docker-compose.ip-mapping.yml build --no-cache frontend
sudo docker-compose -f docker-compose.ip-mapping.yml up -d frontend
```

### **3. Cập nhật nhanh (chỉ backend)**
```bash
# Rebuild và restart chỉ backend
sudo docker-compose -f docker-compose.ip-mapping.yml build --no-cache backend
sudo docker-compose -f docker-compose.ip-mapping.yml up -d backend
```

## 📊 **CÁC LỆNH KIỂM TRA**

### **1. Xem logs**
```bash
# Xem logs tất cả services
sudo docker-compose -f docker-compose.ip-mapping.yml logs

# Xem logs chỉ frontend
sudo docker-compose -f docker-compose.ip-mapping.yml logs frontend

# Xem logs chỉ backend
sudo docker-compose -f docker-compose.ip-mapping.yml logs backend

# Xem logs chỉ nginx
sudo docker-compose -f docker-compose.ip-mapping.yml logs nginx

# Xem logs real-time
sudo docker-compose -f docker-compose.ip-mapping.yml logs -f
```

### **2. Kiểm tra sức khỏe containers**
```bash
# Xem health status
sudo docker ps --format "table {{.Names}}\t{{.Status}}"

# Kiểm tra health check
sudo docker inspect exp-gest-system_frontend_1 | grep -A 10 "Health"
```

### **3. Test API**
```bash
# Test frontend
curl -s -o /dev/null -w "%{http_code}" http://192.168.1.135:9009/

# Test backend
curl -s -X POST http://192.168.1.135:9009/api/auth/login -H "Content-Type: application/json" -d '{"username": "test", "password": "test"}'

# Test QR API
curl -s -X POST http://192.168.1.135:9009/api/guests/36/qr -H "Content-Type: application/json"
```

## 🧹 **CÁC LỆNH DỌN DẸP**

### **1. Dọn dẹp containers**
```bash
# Xóa containers đã dừng
sudo docker container prune -f

# Xóa tất cả containers
sudo docker rm -f $(sudo docker ps -aq)
```

### **2. Dọn dẹp images**
```bash
# Xóa images không sử dụng
sudo docker image prune -f

# Xóa tất cả images
sudo docker rmi -f $(sudo docker images -q)
```

### **3. Dọn dẹp toàn bộ**
```bash
# Dọn dẹp tất cả (containers, images, networks, volumes)
sudo docker system prune -a -f

# Dọn dẹp volumes
sudo docker volume prune -f
```

## 🚀 **CÁC LỆNH QUAN TRỌNG NHẤT**

### **Khi chỉnh sửa code:**
```bash
# Cập nhật toàn bộ
sudo docker-compose -f docker-compose.ip-mapping.yml down
sudo docker-compose -f docker-compose.ip-mapping.yml build --no-cache
sudo docker-compose -f docker-compose.ip-mapping.yml up -d
```

### **Khi chỉ sửa frontend:**
```bash
# Cập nhật nhanh frontend
sudo docker-compose -f docker-compose.ip-mapping.yml build --no-cache frontend
sudo docker-compose -f docker-compose.ip-mapping.yml up -d frontend
```

### **Khi gặp lỗi:**
```bash
# Xem logs để debug
sudo docker-compose -f docker-compose.ip-mapping.yml logs -f

# Restart tất cả
sudo docker-compose -f docker-compose.ip-mapping.yml restart
```

## 📝 **LƯU Ý**

- **Luôn sử dụng `sudo`** trước các lệnh docker
- **`--no-cache`** để rebuild hoàn toàn
- **`-d`** để chạy ở background
- **`-f`** để force (không hỏi xác nhận)
- **File compose**: `docker-compose.ip-mapping.yml`

## 🌐 **URLs**

- **Frontend**: http://192.168.1.135:9009
- **Login**: http://192.168.1.135:9009/login
- **Dashboard**: http://192.168.1.135:9009/dashboard
- **Guests**: http://192.168.1.135:9009/dashboard/guests
