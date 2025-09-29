#!/bin/bash

# Environment Setup Script
# Usage: ./scripts/deploy/setup.sh

echo "🔧 Setting up Exp-Gest-System environment..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are available"

# Create environment files if they don't exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating backend/.env from example..."
    cp backend/env.example backend/.env
    echo "⚠️  Please edit backend/.env with your configuration"
fi

if [ ! -f frontend/.env.local ]; then
    echo "📝 Creating frontend/.env.local from example..."
    cp frontend/env.example frontend/.env.local
    echo "⚠️  Please edit frontend/.env.local with your configuration"
fi

# Make scripts executable
echo "🔧 Making deployment scripts executable..."
chmod +x scripts/deploy/*.sh

echo "✅ Environment setup complete!"
echo ""
echo "🚀 Next steps:"
echo "1. Edit backend/.env and frontend/.env.local"
echo "2. Run: ./scripts/deploy/dev.sh start"
echo "3. Check status: ./scripts/deploy/dev.sh status"
