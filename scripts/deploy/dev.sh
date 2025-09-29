#!/bin/bash

# Development Deployment Script
# Usage: ./scripts/deploy/dev.sh [start|stop|restart|logs]

CONFIG_BASE="docker/compose/active/docker-compose.yml"
CONFIG_OVERRIDE="docker/compose/active/docker-compose.dev.yml"

case "$1" in
    start)
        echo "🔧 Starting development environment..."
        docker-compose -f $CONFIG_BASE -f $CONFIG_OVERRIDE up -d
        echo "✅ Development environment started!"
        echo "🌐 Frontend: http://localhost:3000"
        echo "🔗 Backend API: http://localhost:5008"
        ;;
    stop)
        echo "🛑 Stopping development environment..."
        docker-compose -f $CONFIG_BASE -f $CONFIG_OVERRIDE down
        echo "✅ Development environment stopped!"
        ;;
    restart)
        echo "🔄 Restarting development environment..."
        docker-compose -f $CONFIG_BASE -f $CONFIG_OVERRIDE restart
        echo "✅ Development environment restarted!"
        ;;
    logs)
        echo "📋 Showing development logs..."
        docker-compose -f $CONFIG_BASE -f $CONFIG_OVERRIDE logs -f
        ;;
    status)
        echo "📊 Development environment status..."
        docker-compose -f $CONFIG_BASE -f $CONFIG_OVERRIDE ps
        ;;
    build)
        echo "🔨 Building development images..."
        docker-compose -f $CONFIG_BASE -f $CONFIG_OVERRIDE build --no-cache
        echo "✅ Development images built!"
        ;;
    *)
        echo "❌ Usage: $0 [start|stop|restart|logs|status|build]"
        exit 1
        ;;
esac
