# Exp-Gest-System

Hệ thống quản lý sự kiện và khách mời hiện đại.

## Cấu trúc thư mục

```
├── backend/                    # Server Flask/FastAPI
│   ├── app.py
│   ├── models.py
│   ├── db.py
│   ├── requirements.txt
│   └── migrations/
├── frontend/                   # React/Next.js Frontend
│   ├── app/
│   ├── components/
│   ├── public/
│   ├── package.json
│   └── package-lock.json
├── docker/                     # Docker configurations
│   └── compose/                # All Docker Compose files
│       ├── active/            # Currently used configs
│       │   ├── docker-compose.yml
│       │   ├── docker-compose.prod.yml
│       │   └── docker-compose.dev.yml
│       ├── archive/            # Legacy configs for reference
│       └── deprecated/         # Deprecated configs
├── config/                     # Configuration files
│   └── nginx/                 # Nginx configurations
│       ├── active/            # Currently used configs
│       ├── archive/            # Legacy configs
│       └── templates/          # Configuration templates
├── scripts/                   # Utility scripts
│   ├── deploy/               # Deployment scripts
│   │   ├── prod.sh           # Production deployment
│   │   ├── dev.sh            # Development deployment
│   │   └── setup.sh          # Environment setup
│   └── maintenance/          # Maintenance scripts
├── docs/                      # Documentation
│   ├── deployment/           # Deployment guides
│   └── v1.0/                 # Version documentation
├── assets/                   # Static assets
│   └── images/
├── backup/                   # Backup files
└── deploy/                   # Temporary deployment files
```

## Cài đặt nhanh

### 1. Setup Environment
```bash
# Chạy script tự động setup
./scripts/deploy/setup.sh
```

### 2. Development
```bash
# Khởi động môi trường dev
./scripts/deploy/dev.sh start

# Xem logs
./scripts/deploy/dev.sh logs

# Kiểm tra status
./scripts/deploy/dev.sh status
```

### 3. Production
```bash
# Khởi động môi trường production
./scripts/deploy/prod.sh start

# Kiểm tra status
./scripts/deploy/prod.sh status
```

### 📋 Manual Commands
Nếu bạn thích chạy lệnh thủ công:

```bash
# Development với Docker Compose
docker-compose -f docker/compose/active/docker-compose.yml -f docker/compose/active/docker-compose.dev.yml up -d

# Production với Docker Compose  
docker-compose -f docker/compose/active/docker-compose.yml -f docker/compose/active/docker-compose.prod.yml up -d
```

## Triển khai

Tham khảo file trong thư mục `docs/` để được hướng dẫn chi tiết về triển khai.

## Đóng góp

Vui lòng đọc tài liệu trong thư mục `docs/` trước khi đóng góp vào dự án.
