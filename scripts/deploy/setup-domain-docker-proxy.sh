#!/bin/bash

# Simple domain setup - direct port 80 mapping
# Usage: ./setup-domain-direct.sh

DOMAIN="event.expsolution.io"

echo "🔍 Auto-detecting server IP..."
SERVER_IP=$(curl -4 -s ifconfig.me)

if [ -z "$SERVER_IP" ]; then
    echo "❌ Cannot detect server IP. Please check internet connection."
    exit 1
fi

echo "🌐 Setting up domain: $DOMAIN"
echo "📍 Detected Server IP: $SERVER_IP"

echo "📋 DNS Configuration needed:"
echo "Type: A"
echo "Name: event"
echo "Value: $SERVER_IP"
echo "TTL: 300"
echo ""
echo "⚠️  Please update DNS records above before continuing!"
echo "⏳ Press Enter when DNS is updated (or Ctrl+C to cancel)..."
read -p "Press Enter to continue..."

# Stop current services
echo "⏹️ Stopping current services..."
docker-compose -f docker-compose.no-port.yml down 2>/dev/null || true
docker-compose -f docker-compose.simple-prod.yml down 2>/dev/null || true

# Create nginx config for direct port 80
echo "⚙️ Creating nginx configuration for direct port 80..."
cat > deploy/nginx-direct.conf << EOF
upstream frontend {
    server frontend:3000;
    keepalive 32;
}

upstream backend {
    server backend:5008;
    keepalive 32;
}

server {
    listen 80;
    server_name event.expsolution.io www.event.expsolution.io;
    
    # Basic settings
    client_max_body_size 10M;
    client_body_timeout 60s;
    client_header_timeout 60s;
    keepalive_timeout 65s;
    send_timeout 60s;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Backend API routes
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Connection "";
        proxy_http_version 1.1;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
        
        # Cache settings
        proxy_cache_bypass \$http_upgrade;
        proxy_no_cache \$http_upgrade;
    }

    # Frontend routes
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Connection "";
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
        
        # Cache settings
        proxy_cache_bypass \$http_upgrade;
        proxy_no_cache \$http_upgrade;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Create docker-compose for direct port 80
echo "🐳 Creating docker-compose configuration for direct port 80..."
cat > docker-compose.direct.yml << EOF
version: '3.8'

# Direct port 80 configuration for event.expsolution.io
services:
  frontend:
    build: 
      context: ./frontend
      dockerfile: Dockerfile
      target: deps
    environment:
      - NODE_ENV=production
      - NEXT_TELEMETRY_DISABLED=1
      - NEXT_PUBLIC_API_BASE_URL=http://event.expsolution.io/api
      - NEXT_PUBLIC_FRONTEND_URL=http://event.expsolution.io
    command: sh -c "npm run build && npm run start"
    networks:
      - app-network
    restart: unless-stopped

  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
      target: production
    environment:
      - FLASK_ENV=production
      - FLASK_DEBUG=False
      - FLASK_RUN_HOST=0.0.0.0
      - FLASK_RUN_PORT=5008
      - CORS_ORIGINS=http://event.expsolution.io,http://www.event.expsolution.io
    volumes:
      - ./backend:/app
      - backend_data:/app/instance
    command: python app.py
    networks:
      - app-network
    restart: unless-stopped

  nginx:
    image: nginx:stable-alpine
    ports:
      - "80:80"
      # - "443:443"  # Comment out until SSL is configured
    volumes:
      - ./deploy/nginx-direct.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - frontend
      - backend
    networks:
      - app-network
    restart: unless-stopped

networks:
  app-network:
    driver: bridge

volumes:
  backend_data:
    driver: local
EOF

# Start services
echo "🚀 Starting services with direct port 80 mapping..."
docker-compose -f docker-compose.direct.yml up -d

echo "✅ Domain setup completed!"
echo "🌐 Your application is now available at: http://$DOMAIN"
echo "📊 Health check: http://$DOMAIN/health"
echo ""
echo "🎯 Direct port 80 mapping - no port needed in URL!"
echo "📝 Next steps:"
echo "1. Test application: http://$DOMAIN"
echo "2. Monitor logs: docker-compose -f docker-compose.direct.yml logs -f"
echo "3. For SSL certificate, contact server administrator"
echo ""
echo "🔒 SSL Setup (when ready):"
echo "1. Uncomment port 443 in docker-compose.direct.yml"
echo "2. Add SSL config to nginx-direct.conf:"
echo "   server {"
echo "     listen 443 ssl;"
echo "     ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;"
echo "     ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;"
echo "     # ... rest of config"
echo "   }"
echo "3. Use certbot to generate certificates"
echo ""
echo "🚀 Production optimizations applied:"
echo "✅ Frontend: npm run build && npm run start (production mode)"
echo "✅ No dev volumes (clean build)"
echo "✅ Port 443 commented until SSL ready"
