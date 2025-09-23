# EXP Guest System - Docker Deployment Guide

## 🐳 Docker Setup Overview

This project has been fully containerized with Docker for production-ready deployment. The setup includes:

- **Multi-stage builds** for optimized image sizes
- **Health checks** for all services
- **Resource limits** and monitoring
- **Security best practices** (non-root users, minimal images)
- **Production-ready nginx configuration**
- **Automated deployment scripts**

## 📁 Project Structure

```
Exp-Gest-System/
├── backend/
│   ├── Dockerfile              # Multi-stage backend build
│   ├── .dockerignore           # Backend build context optimization
│   └── env.example             # Backend environment template
├── frontend/
│   ├── Dockerfile              # Multi-stage frontend build
│   ├── .dockerignore           # Frontend build context optimization
│   ├── next.config.mjs         # Next.js config with standalone output
│   └── env.example             # Frontend environment template
├── deploy/
│   ├── nginx.conf              # Production nginx configuration
│   └── nginx.dev.conf          # Development nginx configuration
├── scripts/
│   ├── deploy.sh               # Production deployment script
│   ├── dev.sh                  # Development environment script
│   └── monitor.sh              # Monitoring and health check script
├── docker-compose.yml          # Base docker-compose configuration
├── docker-compose.prod.yml     # Production overrides
├── docker-compose.dev.yml      # Development overrides
└── .dockerignore               # Root build context optimization
```

## 🚀 Quick Start

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- At least 4GB RAM
- At least 10GB free disk space

### 1. Clone and Setup

```bash
git clone <your-repo>
cd Exp-Gest-System

# Copy environment files
cp backend/env.example backend/.env
cp frontend/env.example frontend/.env.local

# Edit environment files with your configuration
nano backend/.env
nano frontend/.env.local
```

### 2. Development Environment

```bash
# Start development environment
./scripts/dev.sh start

# View logs
./scripts/dev.sh logs

# Stop development environment
./scripts/dev.sh stop
```

### 3. Production Deployment

```bash
# Full production deployment
./scripts/deploy.sh deploy

# Check deployment status
./scripts/deploy.sh status

# View logs
./scripts/deploy.sh logs
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///instance/app.db
CORS_ORIGINS=http://localhost:3000,http://localhost:9009
```

#### Frontend (.env.local)
```bash
NODE_ENV=production
NEXT_PUBLIC_API_BASE_URL=http://localhost:5008/api
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

### Docker Compose Overrides

#### Production (docker-compose.prod.yml)
- Resource limits and reservations
- Multiple replicas for high availability
- Production logging configuration
- Persistent volumes for data

#### Development (docker-compose.dev.yml)
- Volume mounts for live code editing
- Development-specific nginx config
- Hot reloading enabled

## 📊 Monitoring

### Health Checks

All services include health checks:

```bash
# Check service health
./scripts/monitor.sh health

# Continuous monitoring
./scripts/monitor.sh monitor

# Generate health report
./scripts/monitor.sh report
```

### Service Endpoints

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5008
- **Nginx Proxy**: http://localhost:9009
- **Health Check**: http://localhost:9009/health

## 🛠️ Management Commands

### Deployment Script (./scripts/deploy.sh)

```bash
./scripts/deploy.sh deploy      # Full deployment
./scripts/deploy.sh backup      # Create backup
./scripts/deploy.sh status      # Show status
./scripts/deploy.sh logs        # View logs
./scripts/deploy.sh stop        # Stop services
./scripts/deploy.sh restart     # Restart services
./scripts/deploy.sh cleanup     # Clean up old images
```

### Development Script (./scripts/dev.sh)

```bash
./scripts/dev.sh start          # Start dev environment
./scripts/dev.sh stop           # Stop dev environment
./scripts/dev.sh restart        # Restart dev environment
./scripts/dev.sh status         # Show status
./scripts/dev.sh logs           # Follow logs
./scripts/dev.sh setup          # Setup environment
./scripts/dev.sh install        # Install dependencies
./scripts/dev.sh clean          # Clean environment
```

### Monitoring Script (./scripts/monitor.sh)

```bash
./scripts/monitor.sh status     # Service status
./scripts/monitor.sh health     # Health checks
./scripts/monitor.sh stats      # Container statistics
./scripts/monitor.sh disk       # Disk usage
./scripts/monitor.sh memory     # Memory usage
./scripts/monitor.sh logs       # Service logs
./scripts/monitor.sh monitor    # Continuous monitoring
./scripts/monitor.sh report     # Health report
./scripts/monitor.sh resources  # Resource usage
./scripts/monitor.sh all        # All information
```

## 🔒 Security Features

### Container Security
- Non-root users in all containers
- Minimal base images (Alpine Linux)
- Multi-stage builds to reduce attack surface
- No unnecessary packages or services

### Network Security
- Internal Docker network isolation
- Nginx as reverse proxy with security headers
- CORS configuration
- Rate limiting and timeout settings

### Data Security
- Environment variables for sensitive data
- Volume mounts for persistent data
- Regular backup capabilities
- Log rotation and management

## 📈 Performance Optimizations

### Image Optimization
- Multi-stage builds reduce final image size
- Layer caching for faster builds
- .dockerignore files reduce build context
- Alpine Linux base images

### Runtime Optimization
- Resource limits and reservations
- Health checks for automatic recovery
- Nginx gzip compression
- Static file caching
- Connection pooling

### Monitoring
- Container resource monitoring
- Health check endpoints
- Log aggregation
- Performance metrics

## 🚨 Troubleshooting

### Common Issues

#### Services won't start
```bash
# Check logs
./scripts/deploy.sh logs

# Check resource usage
./scripts/monitor.sh resources

# Restart services
./scripts/deploy.sh restart
```

#### High resource usage
```bash
# Check resource usage
./scripts/monitor.sh all

# Clean up old images
./scripts/deploy.sh cleanup

# Scale down if needed
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --scale frontend=1 --scale backend=1
```

#### Database issues
```bash
# Check backend logs
./scripts/monitor.sh logs backend

# Restart backend
docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart backend
```

### Log Locations

- **Application logs**: `docker-compose logs [service]`
- **Nginx logs**: Volume `nginx_logs`
- **Backend logs**: Volume `backend_logs`
- **Deployment logs**: `./deploy.log`
- **Monitoring logs**: `./monitor.log`

## 🔄 Backup and Recovery

### Backup
```bash
# Create backup
./scripts/deploy.sh backup

# Manual backup
docker run --rm -v exp-gest-system_backend_data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/backup-$(date +%Y%m%d).tar.gz -C /data .
```

### Recovery
```bash
# Stop services
./scripts/deploy.sh stop

# Restore from backup
docker run --rm -v exp-gest-system_backend_data:/data -v $(pwd)/backups:/backup alpine tar xzf /backup/backup-YYYYMMDD.tar.gz -C /data

# Start services
./scripts/deploy.sh deploy
```

## 📚 Additional Resources

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
- [Flask Docker Deployment](https://flask.palletsprojects.com/en/2.0.x/deploying/docker/)

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section
2. Review logs with monitoring scripts
3. Check Docker and Docker Compose documentation
4. Create an issue in the project repository
