#!/bin/bash

# Production Deployment Script
# Usage: ./scripts/deploy/prod.sh [start|stop|restart|logs]

CONFIG_BASE="docker/compose/active/docker-compose.yml"
CONFIG_OVERRIDE="docker/compose/active/docker-compose.prod.yml"

case "$1" in
    start)
        echo "🚀 Starting production environment..."
        docker-compose -f $CONFIG_BASE -f $CONFIG_OVERRIDE up -d
        echo "✅ Production environment started!"
        ;;
    stop)
        echo "🛑 Stopping production environment..."
        docker-compose -f $CONFIG_BASE -f $CONFIG_OVERRIDE down
        echo "✅ Production environment stopped!"
        ;;
    restart)
        echo "🔄 Restarting production environment..."
        docker-compose -f $CONFIG_BASE -f $CONFIG_OVERRIDE restart
        echo "✅ Production environment restarted!"
        ;;
    logs)
        echo "📋 Showing production logs..."
        docker-compose -f $CONFIG_BASE -f $CONFIG_OVERRIDE logs -f
        ;;
    status)
        echo "📊 Production environment status..."
        docker-compose -f $CONFIG_BASE -f $CONFIG_OVERRIDE ps
        ;;
    *)
        echo "❌ Usage: $0 [start|stop|restart|logs|status]"
        exit 1
        ;;
esac
