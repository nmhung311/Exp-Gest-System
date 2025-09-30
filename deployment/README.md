# Event Services Deployment

This folder contains the event services that will be integrated with your main nginx configuration.

## Files

- **`docker-compose.yml`** - Event services Docker Compose configuration
- **`nginx.conf`** - Reference nginx configuration (already integrated in your main nginx)

## Prerequisites

- Your main nginx must be running with the provided configuration
- The `exp-tech-nexus_exp-network` network must exist (created by your main nginx project)

## Quick Start

1. **Deploy the event services:**
   ```bash
   docker-compose up -d
   ```

2. **Check status:**
   ```bash
   docker-compose ps
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f
   ```

## Configuration Details

### Docker Compose
- **Services**: `event-frontend` and `event-backend` (with fixed container names)
- **Optimized resource limits** for single-server deployment
- **Health checks** for all services
- **Automatic restart** policies
- **Log rotation** configured
- **External network integration** with your main nginx project

### External Nginx Integration
- **Event service routing** (configured in your main nginx):
  - `event.expsolution.io` → `event-frontend:3000`
  - `apievent.expsolution.io` → `event-backend:5008`
- **Container names** match nginx upstream configuration
- **Security headers** and **CORS support** included
- **No port exposure** - nginx handles all external access

## Resource Usage

- **event-frontend**: 512MB memory, 0.3 CPU
- **event-backend**: 1.5GB memory, 0.6 CPU  
- **Total**: ~2.0GB memory, ~0.9 CPU cores

## Ports

- **3000** - Event Frontend (internal only, accessed via nginx)
- **5008** - Event Backend API (internal only, accessed via nginx)

## Volumes

- `backend_logs` - Application logs
- `backend_backups` - Database backups
- `backend_data` - Application data
- `../exp_guest.db:/app/exp_guest.db` - Root database file mounted to container

## Network

- **External network**: `exp-tech-nexus_exp-network`
- **Container names**: `event-frontend` and `event-backend`
- **No external port exposure** - all traffic routed through your main nginx

## Testing

Test the services through your nginx:
```bash
# Test event frontend
curl -H "Host: event.expsolution.io" http://localhost/health

# Test event backend API
curl -H "Host: apievent.expsolution.io" http://localhost/health
```
