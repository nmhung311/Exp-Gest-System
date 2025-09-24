#!/bin/bash

# Domain Setup Script for EXP Guest System
# Usage: ./setup-domain.sh yourdomain.com

DOMAIN=$1

if [ -z "$DOMAIN" ]; then
    echo "Usage: $0 <domain>"
    echo "Example: $0 example.com"
    exit 1
fi

echo "🌐 Setting up domain: $DOMAIN"

# 1. Install Certbot
echo "📦 Installing Certbot..."
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# 2. Stop nginx temporarily
echo "⏹️ Stopping nginx..."
sudo systemctl stop nginx

# 3. Get SSL certificate
echo "🔒 Getting SSL certificate for $DOMAIN..."
sudo certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

# 4. Update nginx configuration
echo "⚙️ Updating nginx configuration..."
sed -i "s|yourdomain.com|$DOMAIN|g" deploy/nginx-ssl.conf

# 5. Update docker-compose configuration
echo "🐳 Updating docker-compose configuration..."
sed -i "s|yourdomain.com|$DOMAIN|g" docker-compose.domain.yml

# 6. Update frontend environment
echo "🔧 Updating frontend environment..."
echo "NEXT_PUBLIC_API_BASE_URL=https://$DOMAIN/api" > frontend/.env.local
echo "NEXT_PUBLIC_FRONTEND_URL=https://$DOMAIN" >> frontend/.env.local

# 7. Update backend environment
echo "🔧 Updating backend environment..."
echo "FLASK_ENV=production" > backend/.env
echo "FLASK_DEBUG=False" >> backend/.env
echo "CORS_ORIGINS=https://$DOMAIN,https://www.$DOMAIN" >> backend/.env

# 8. Start services with domain configuration
echo "🚀 Starting services with domain configuration..."
docker-compose -f docker-compose.yml -f docker-compose.domain.yml up -d

# 9. Setup auto-renewal
echo "🔄 Setting up SSL auto-renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

echo "✅ Domain setup completed!"
echo "🌐 Your application is now available at: https://$DOMAIN"
echo "📊 Health check: https://$DOMAIN/health"
echo ""
echo "📝 Next steps:"
echo "1. Verify DNS propagation: nslookup $DOMAIN"
echo "2. Test SSL certificate: curl -I https://$DOMAIN"
echo "3. Monitor logs: docker-compose logs -f"
