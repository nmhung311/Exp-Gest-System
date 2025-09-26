# Multi-Domain Nginx Configuration

## Tổng quan
File này cấu hình Nginx để hỗ trợ cả 2 domain chạy song song trong Docker:

- **expsolution.io**: Site gốc (đã chạy ổn định từ trước)
- **event.expsolution.io**: Site phụ (mới setup)

## Cấu trúc Config

### 1. Upstream Services
```nginx
upstream frontend {
    server frontend:3000;
    keepalive 32;
}

upstream backend {
    server backend:5008;
    keepalive 32;
}
```

### 2. Server Blocks

#### Site gốc: expsolution.io
- `server_name expsolution.io www.expsolution.io`
- Proxy đến cùng frontend/backend services
- Giữ nguyên cấu hình cũ

#### Site phụ: event.expsolution.io  
- `server_name event.expsolution.io www.event.expsolution.io`
- Proxy đến cùng frontend/backend services
- Clone giao diện từ site gốc

## Files liên quan

- `deploy/nginx-multi-domain.conf`: Config tổng hợp cho cả 2 domain
- `deploy/nginx-http-only.conf`: File được Docker sử dụng (copy từ multi-domain)
- `deploy/nginx-http-only.conf.backup`: Backup của config cũ

## Lưu ý quan trọng

✅ **Không động chạm** đến sites-available trên host system
✅ **Config chỉ trong Docker** để tránh ảnh hưởng site gốc
✅ **Tách riêng server blocks** cho từng domain
✅ **Cùng upstream services** để tái sử dụng resources

## Test Commands

```bash
# Test site gốc
curl -I -H "Host: expsolution.io" http://104.21.43.253

# Test site phụ  
curl -I -H "Host: event.expsolution.io" http://104.21.43.253
```

## Restart Services

```bash
# Restart Nginx để áp dụng config mới
docker-compose -f docker-compose.http-only.yml restart nginx

# Restart toàn bộ stack nếu cần
docker-compose -f docker-compose.http-only.yml restart
```
