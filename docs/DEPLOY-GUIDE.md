# 🚀 Deploy Guide for event.expsolution.io

## 📋 Prerequisites

1. **Server Requirements:**
   - Ubuntu 20.04+ or similar Linux distribution
   - Docker & Docker Compose installed
   - At least 2GB RAM, 10GB disk space
   - Internet connection

2. **Domain Setup:**
   - Domain `event.expsolution.io` registered
   - DNS management access

## 🔧 Quick Deploy (Recommended)

### Step 1: Clone Repository
```bash
git clone https://github.com/nmhung311/Exp-Gest-System.git
cd Exp-Gest-System
```

### Step 2: Auto Setup Domain
```bash
./auto-setup-domain.sh
```

**Script sẽ tự động:**
- ✅ Detect server IP
- ✅ Show DNS configuration needed
- ✅ Wait for DNS propagation
- ✅ Install SSL certificate
- ✅ Deploy application
- ✅ Setup auto-renewal

## 🔧 Manual Deploy

### Step 1: Get Server IP
```bash
curl -4 -s ifconfig.me
```

### Step 2: Configure DNS
In your DNS management panel, add:
```
Type: A
Name: event
Value: [YOUR_SERVER_IP]
TTL: 300

Type: A
Name: www.event
Value: [YOUR_SERVER_IP]
TTL: 300
```

### Step 3: Install Dependencies
```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
```

### Step 4: Get SSL Certificate
```bash
sudo certbot certonly --standalone -d event.expsolution.io -d www.event.expsolution.io
```

### Step 5: Deploy Application
```bash
docker-compose -f docker-compose.domain-prod.yml up -d
```

### Step 6: Setup Auto-renewal
```bash
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
```

## 🌐 Access Points

After successful deployment:
- **Main Application**: https://event.expsolution.io
- **Health Check**: https://event.expsolution.io/health
- **API Endpoint**: https://event.expsolution.io/api

## 🔍 Troubleshooting

### Check Service Status
```bash
docker-compose -f docker-compose.domain-prod.yml ps
```

### View Logs
```bash
docker-compose -f docker-compose.domain-prod.yml logs -f
```

### Check SSL Certificate
```bash
curl -I https://event.expsolution.io
```

### Restart Services
```bash
docker-compose -f docker-compose.domain-prod.yml restart
```

## 📊 Monitoring

### Health Check
```bash
curl https://event.expsolution.io/health
```

### SSL Certificate Status
```bash
sudo certbot certificates
```

### Renew SSL Certificate
```bash
sudo certbot renew
```

## 🔒 Security Features

- ✅ HTTPS with SSL/TLS encryption
- ✅ Security headers (HSTS, CSP, etc.)
- ✅ CORS configuration
- ✅ Non-root Docker users
- ✅ Automatic SSL renewal

## 📝 Notes

- Script automatically detects server IP
- DNS propagation may take 5-30 minutes
- SSL certificate auto-renews every 90 days
- Application runs on ports 80 (HTTP) and 443 (HTTPS)
- Internal services communicate via Docker network
