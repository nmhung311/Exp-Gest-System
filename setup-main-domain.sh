#!/bin/bash

# Domain Setup Script for event.expsolution.io
# Usage: ./setup-main-domain.sh

DOMAIN="event.expsolution.io"
SERVER_IP=$(curl -4 -s ifconfig.me)

echo "🌐 Setting up main domain: $DOMAIN"
echo "📍 Server IP: $SERVER_IP"

# 1. Check DNS configuration
echo "🔍 Checking DNS configuration..."
CURRENT_IP=$(nslookup $DOMAIN | grep "Address:" | tail -1 | awk '{print $2}')
echo "Current DNS IP: $CURRENT_IP"
echo "Required IP: $SERVER_IP"

if [ "$CURRENT_IP" != "$SERVER_IP" ]; then
    echo "⚠️  DNS needs to be updated!"
    echo "Please update DNS records:"
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
    echo "Waiting for DNS propagation... (Press Enter when DNS is updated)"
    read -p "Press Enter to continue..."
fi

# 2. Install Certbot if not installed
echo "📦 Installing Certbot..."
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# 3. Stop current services
echo "⏹️ Stopping current services..."
docker-compose -f docker-compose.simple-prod.yml down 2>/dev/null || true

# 4. Get SSL certificate
echo "🔒 Getting SSL certificate for $DOMAIN..."
sudo certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

# 5. Start services with domain configuration
echo "🚀 Starting services with domain configuration..."
docker-compose -f docker-compose.domain-prod.yml up -d

# 6. Setup auto-renewal
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
