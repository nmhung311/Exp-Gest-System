#!/bin/bash

# Auto-detect server IP and setup domain
# Usage: ./auto-setup-domain.sh

DOMAIN="event.expsolution.io"

echo "🔍 Auto-detecting server IP..."
SERVER_IP=$(curl -4 -s ifconfig.me)

if [ -z "$SERVER_IP" ]; then
    echo "❌ Cannot detect server IP. Please check internet connection."
    exit 1
fi

echo "🌐 Setting up domain: $DOMAIN"
echo "📍 Detected Server IP: $SERVER_IP"

# Update docker-compose with detected IP
echo "⚙️ Updating configuration with server IP..."
sed -i "s|NEXT_PUBLIC_API_BASE_URL=https://event.expsolution.io/api|NEXT_PUBLIC_API_BASE_URL=https://event.expsolution.io/api|g" docker-compose.domain-prod.yml
sed -i "s|NEXT_PUBLIC_FRONTEND_URL=https://event.expsolution.io|NEXT_PUBLIC_FRONTEND_URL=https://event.expsolution.io|g" docker-compose.domain-prod.yml
sed -i "s|CORS_ORIGINS=https://event.expsolution.io,https://www.event.expsolution.io|CORS_ORIGINS=https://event.expsolution.io,https://www.event.expsolution.io|g" docker-compose.domain-prod.yml

echo "📋 DNS Configuration needed:"
echo "Type: A"
echo "Name: event"
echo "Value: $SERVER_IP"
echo "TTL: 300"
echo ""
echo "Type: A"
echo "Name: www.event"
echo "Value: $SERVER_IP"
echo "TTL: 300"
echo ""
echo "⏳ Please update DNS records above, then press Enter to continue..."
read -p "Press Enter when DNS is updated..."

# Check DNS propagation
echo "🔍 Checking DNS propagation..."
CURRENT_IP=$(nslookup $DOMAIN | grep "Address:" | tail -1 | awk '{print $2}')
echo "Current DNS IP: $CURRENT_IP"
echo "Required IP: $SERVER_IP"

if [ "$CURRENT_IP" != "$SERVER_IP" ]; then
    echo "⚠️  DNS not yet propagated. Waiting 30 seconds..."
    sleep 30
    CURRENT_IP=$(nslookup $DOMAIN | grep "Address:" | tail -1 | awk '{print $2}')
    if [ "$CURRENT_IP" != "$SERVER_IP" ]; then
        echo "❌ DNS still not propagated. Please check DNS settings."
        exit 1
    fi
fi

echo "✅ DNS propagated successfully!"

# Install Certbot
echo "📦 Installing Certbot..."
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Stop current services
echo "⏹️ Stopping current services..."
docker-compose -f docker-compose.simple-prod.yml down 2>/dev/null || true

# Get SSL certificate
echo "🔒 Getting SSL certificate for $DOMAIN..."
sudo certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

# Start services
echo "🚀 Starting services with domain configuration..."
docker-compose -f docker-compose.domain-prod.yml up -d

# Setup auto-renewal
echo "🔄 Setting up SSL auto-renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

echo "✅ Domain setup completed!"
echo "🌐 Your application is now available at: https://$DOMAIN"
echo "📊 Health check: https://$DOMAIN/health"
echo ""
echo "📝 Next steps:"
echo "1. Verify SSL certificate: curl -I https://$DOMAIN"
echo "2. Test application: https://$DOMAIN"
echo "3. Monitor logs: docker-compose -f docker-compose.domain-prod.yml logs -f"
