# EXP Technology - Docker Setup

## 🐳 Docker Commands

### Development Mode
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up --build

# Stop development environment
docker-compose -f docker-compose.dev.yml down

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

### Production Mode
```bash
# Start production environment
docker-compose up --build

# Stop production environment
docker-compose down

# View logs
docker-compose logs -f
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
└── README-Docker.md         # This file
```

## 🔧 Environment Variables

### Frontend
- `NODE_ENV`: production/development

### Backend
- `FLASK_ENV`: production/development
- `FLASK_APP`: app.py
- `FLASK_DEBUG`: 1 (development only)

## 🚀 Quick Start

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd project
   ```

2. **Start development environment**
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

3. **Access the application**
   - Open http://localhost:3000 in your browser
   - API available at http://localhost:5001

## 🛠️ Troubleshooting

### Port already in use
```bash
# Check what's using the port
netstat -tulpn | grep :3000
netstat -tulpn | grep :5001

# Kill the process
sudo kill -9 <PID>
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
