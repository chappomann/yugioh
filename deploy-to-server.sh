#!/bin/bash
# Usage: ./deploy-to-server.sh (run directly on server)

DEPLOY_DIR="/home/chappo/docker"
GITHUB_RAW_BASE="https://raw.githubusercontent.com/chappomann/yugioh/refs/heads/develop"

echo "🚀 Deploying Yu-Gi-Oh app..."

# Create deployment directory structure
mkdir -p $DEPLOY_DIR

# Download files directly from GitHub
echo "📄 Downloading environment configuration from GitHub..."
curl -s -o $DEPLOY_DIR/.env.production $GITHUB_RAW_BASE/backend/.env.production

# echo "� Downloading docker-compose.yml from GitHub..."
# curl -s -o $DEPLOY_DIR/docker-compose.yml https://raw.githubusercontent.com/chappomann/chappie-server/refs/heads/develop/docker/laprass/docker-compose.yml?token=GHSAT0AAAAAADMHWZWJM5HTR33MICT63OQK2HKQH3A

echo "📋 Downloading Dockerfile from GitHub..."
curl -s -o $DEPLOY_DIR/Dockerfile.yugioh $GITHUB_RAW_BASE/Dockerfile.yugioh

# Set proper permissions
chmod 600 $DEPLOY_DIR/.env.production

echo "✅ Deployment files ready!"
echo ""
echo "🔧 To start the stack, run:"
echo "   cd $DEPLOY_DIR"
echo "   docker-compose up -d yugioh-app"
echo ""
echo "📁 Files deployed:"
# echo "   $DEPLOY_DIR/docker-compose.yml (from GitHub)"
echo "   $DEPLOY_DIR/.env.production (from GitHub)"
echo "   $DEPLOY_DIR/Dockerfile.yugioh (from GitHub)"