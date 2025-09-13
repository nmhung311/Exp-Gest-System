# 🐳 Docker Setup Guide for EXP Technology

## 📋 Prerequisites

### 1. Install Docker Desktop
1. Download Docker Desktop from: https://www.docker.com/products/docker-desktop/
2. Install Docker Desktop for Windows
3. Restart your computer after installation
4. Open Docker Desktop and ensure it's running

### 2. Verify Installation
```bash
docker --version
docker-compose --version
```

## 🚀 Quick Start Commands

### Development Mode (Recommended)
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up --build

# Or use the batch file
start-dev.bat
```

### Production Mode
```bash
# Start production environment
docker-compose up --build

# Or use the batch file
start-prod.bat
```

### Stop All Containers
```bash
# Stop all containers
docker-compose -f docker-compose.dev.yml down
docker-compose down

# Or use the batch file
stop-docker.bat
```

## 🌐 Access URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **Login**: http://localhost:3000/login
- **Register**: http://localhost:3000/register

## 📁 Project Structure

```
project/
├── frontend/                 # Next.js Frontend
│   ├── Dockerfile           # Production Dockerfile
│   ├── Dockerfile.dev       # Development Dockerfile
│   ├── .dockerignore        # Docker ignore file
│   └── ...
├── backend/                 # Flask Backend
│   ├── Dockerfile           # Production Dockerfile
│   ├── Dockerfile.dev       # Development Dockerfile
│   └── ...
├── docker-compose.yml       # Production compose
├── docker-compose.dev.yml   # Development compose
├── start-dev.bat            # Start development
├── start-prod.bat           # Start production
├── stop-docker.bat          # Stop all containers
└── README-Docker.md         # Docker documentation
```

## 🔧 Environment Variables

### Frontend
- `NODE_ENV`: production/development

### Backend
- `FLASK_ENV`: production/development
- `FLASK_APP`: app.py
- `FLASK_DEBUG`: 1 (development only)

## 🛠️ Troubleshooting

### Docker not found
- Install Docker Desktop from the official website
- Restart your computer after installation
- Ensure Docker Desktop is running

### Port already in use
```bash
# Check what's using the port
netstat -tulpn | grep :3000
netstat -tulpn | grep :5001

# Kill the process
taskkill /PID <PID> /F
```

### Rebuild containers
```bash
# Rebuild without cache
docker-compose -f docker-compose.dev.yml up --build --force-recreate

# Remove all containers and volumes
docker-compose -f docker-compose.dev.yml down -v
docker system prune -a
```

### View container logs
```bash
# All services
docker-compose -f docker-compose.dev.yml logs

# Specific service
docker-compose -f docker-compose.dev.yml logs frontend
docker-compose -f docker-compose.dev.yml logs backend
```

## 📝 Notes

- Development mode includes hot reload for both frontend and backend
- Production mode is optimized for performance
- Database files are persisted in `./backend/instance/`
- All containers run in the same network for communication
- Use `start-dev.bat` for development
- Use `start-prod.bat` for production
- Use `stop-docker.bat` to stop all containers

## 🎯 Next Steps

1. Install Docker Desktop
2. Run `start-dev.bat` to start development
3. Open http://localhost:3000 in your browser
4. Test the login/register functionality
