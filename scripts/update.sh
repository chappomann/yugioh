#!/bin/bash

# Yu-Gi-Oh Collection Manager - Update Script
# Quick update script for production deployments

set -e

# Configuration
DEPLOY_DIR="/opt/yugioh"
COMPOSE_FILE="docker-compose.prod.yml"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Check if we're in the right directory
if [ ! -f "$DEPLOY_DIR/$COMPOSE_FILE" ]; then
    error "Not in deployment directory or compose file not found"
fi

cd $DEPLOY_DIR

# Determine compose command
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

log "🔄 Updating Yu-Gi-Oh Collection Manager..."

# Backup current state
log "💾 Creating backup..."
$COMPOSE_CMD -f $COMPOSE_FILE logs > "logs-backup-$(date +%Y%m%d-%H%M%S).log" 2>/dev/null || true

# Pull latest changes
log "📥 Pulling latest changes..."
git fetch origin
git pull origin main  # Change to 'develop' if needed

# Rebuild and restart
log "🔨 Rebuilding containers..."
$COMPOSE_CMD -f $COMPOSE_FILE down
$COMPOSE_CMD -f $COMPOSE_FILE build --no-cache
$COMPOSE_CMD -f $COMPOSE_FILE up -d

# Wait for health check
log "🏥 Waiting for services to be healthy..."
sleep 30

# Check status
if $COMPOSE_CMD -f $COMPOSE_FILE ps | grep -q "healthy"; then
    log "✅ Update completed successfully!"
    $COMPOSE_CMD -f $COMPOSE_FILE ps
else
    warn "⚠️ Services may not be fully healthy yet. Check logs:"
    echo "$COMPOSE_CMD -f $COMPOSE_FILE logs"
fi

log "🌐 Application should be available at: http://$(hostname -I | awk '{print $1}')"