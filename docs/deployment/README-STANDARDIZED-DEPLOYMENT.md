# 🚀 Exp-Gest-System - Standardized Deployment Guide

## 📁 Cấu trúc thư mục mới

Dự án đã được tổ chức lại theo chuẩn quốc tế:

```
Exp-Gest-System/
├── docker/compose/
│   ├── active/              # ✅ Configs đang sử dụng
│ ├── archive/              # 📦 Legacy configs
│ └── deprecated/           # 🗑️ Deprecated configs
├── config/nginx/
│   ├── active/              # ✅ Nginx active configs
│ ├── archive/              # 📦 Legacy nginx configs
│ └── templates/             # 📋 Configuration templates
├── scripts/
│   ├── deploy/              # 🚀 Deployment scripts
│   └── maintenance/         # 🔧 Maintenance scripts
└── docs/deployment/         # 📚 Deployment documentation
```

## 🎯 Files đang được sử dụng (Active)

### Docker Compose Files
- `docker/compose/active/docker-compose.yml` - **Base configuration**
- `docker/compose/active/docker-compose.prod.yml` - **Production overrides**
- `docker/compose/active/docker-compose.dev.yml` - **Development overrides**

### Nginx Configurations
- `config/nginx/active/default.conf` - **Main nginx config**
- `config/nginx/active/nginx.dev.conf` - **Development nginx config**

## 🚀 Quick Deployment

### Development
```bash
# Automatic setup
./scripts/deploy/setup.sh

# Start dev environment
./scripts/deploy/dev.sh start

# Check logs
./scripts/deploy/dev.sh logs
```

### Production
```bash
# Start production environment
./scripts/deploy/prod.sh start

# Check status
./scripts/deploy/prod.sh status
```

### Manual Commands
```bash
# Development
docker-compose -f docker/compose/active/docker-compose.yml -f docker/compose/active/docker-compose.dev.yml up -d

# Production
docker-compose -f docker/compose/active/docker-compose.yml -f docker/compose/active/docker-compose.prod.yml up -d
```

## 📂 Archive Files Reference

### Legacy Docker Compose Files
Các file này được lưu trữ để tham khảo:

- `docker/compose/archive/docker-compose.domain.yml` - Domain-based deployment
- `docker/compose/archive/docker-compose.domain-prod.yml` - Domain + Production
- `docker/compose/archive/docker-compose.http-only.yml` - HTTP only configuration
- `docker/compose/archive/docker-compose.simple*.yml` - Simple configurations
- `docker/compose/archive/docker-compose.dev-local.yml` - Local development variant

### Deprecated Files
- `docker/compose/deprecated/docker-compose.ip-mapping.yml` - IP mapping (không còn dùng domain)

### Legacy Nginx Configs
- `config/nginx/archive/nginx-domain.conf` - Domain configuration
- `config/nginx/archive/nginx.ip-mapping.conf` - IP mapping config
- `config/nginx/archive/nginx-http-only.conf.backup` - HTTP only backup

## 🔄 Migration từ cấu trúc cũ

### Từ multiple files sang organized structure:

**Trước:**
```
deploy/
├── nginx-*.conf (15 files)
docker-compose/
├── docker-compose.*.yml (10 files)
```

**Sau:**
```
config/nginx/
├── active/ (2 files)
├── archive/ (13 files)
docker/compose/
├── active/ (3 files)
├── archive/ (7 files)
```

## 🎉 Lợi ích của cấu trúc mới

1. **✅ Clear Separation**: Active vs Archive files
2. **📋 Easy Management**: Scripts tự động cho deployment
3. **🔄 Version Control**: Dễ track changes trong active configs
4. **📚 Documentation**: Rõ ràng mục đích từng file
5. **🚀 User-friendly**: Commands đơn giản hơn nhiều

## 🎯 Next Steps

1. **Test** các script deployment mới
2. **Update** documentation cho team members
3. **Clean up** các file thừa trong root directory
4. **Implement** CI/CD pipeline với cấu trúc mới

## 📞 Support

Nếu cần hỗ trợ về deployment với cấu trúc mới, tham khảo:
- `docs/deployment/README-STANDARDIZED-DEPLOYMENT.md` (this file)
- `docs/README-Docker.md` (detailed docker guide)
- `scripts/deploy/` (deployment scripts)
