#!/bin/bash

# Simple domain setup without DNS check
# Usage: ./quick-setup-domain.sh

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
echo "Type: A"
echo "Name: www.event"
echo "Value: $SERVER_IP"
echo "TTL: 300"
echo ""
echo "⚠️  Please update DNS records above before continuing!"
echo "⏳ Press Enter when DNS is updated (or Ctrl+C to cancel)..."
read -p "Press Enter to continue..."

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
