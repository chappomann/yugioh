#!/bin/bash

# Docker Check Script for Yu-Gi-Oh Collection Manager

echo "🔍 Checking Docker installation..."

# Check if Docker is installed
if command -v docker &> /dev/null; then
    echo "✅ Docker is installed: $(docker --version)"
else
    echo "❌ Docker is not installed"
    echo "📥 Please install Docker from: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker is running
if docker info &> /dev/null; then
    echo "✅ Docker daemon is running"
else
    echo "❌ Docker daemon is not running"
    echo "🚀 Please start Docker and try again"
    exit 1
fi

# Check for Docker Compose
if command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose is available: $(docker-compose --version)"
    COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    echo "✅ Docker Compose (plugin) is available: $(docker compose version)"
    COMPOSE_CMD="docker compose"
else
    echo "❌ Docker Compose is not available"
    echo "📥 Please install Docker Compose"
    exit 1
fi

echo ""
echo "🐳 Docker setup is ready!"
echo ""
echo "Available commands:"
echo "  Production:"
echo "    npm run docker:up:build    # Build and start production containers"
echo "    npm run docker:logs        # View logs"
echo "    npm run docker:down        # Stop containers"
echo ""
echo "  Development:"
echo "    npm run docker:dev:build   # Build and start dev containers (hot-reload)"
echo "    npm run docker:dev:down    # Stop dev containers"
echo ""
echo "  Cleanup:"
echo "    npm run docker:clean       # Remove containers and cleanup"
echo ""
echo "🌐 Once running:"
echo "  Production:  http://localhost"
echo "  Development: http://localhost:5173 (frontend), http://localhost:3000 (backend)"