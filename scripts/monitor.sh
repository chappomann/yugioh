#!/bin/bash

# Yu-Gi-Oh Collection Manager - Monitoring Script
# Check service health and resource usage

# Configuration
DEPLOY_DIR="/opt/yugioh"
COMPOSE_FILE="docker-compose.prod.yml"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}$1${NC}"
}

warn() {
    echo -e "${YELLOW}$1${NC}"
}

error() {
    echo -e "${RED}$1${NC}"
}

info() {
    echo -e "${BLUE}$1${NC}"
}

# Check if we're in the right directory
if [ ! -f "$DEPLOY_DIR/$COMPOSE_FILE" ]; then
    error "❌ Deployment directory not found: $DEPLOY_DIR"
    exit 1
fi

cd $DEPLOY_DIR

# Determine compose command
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

echo "🔍 Yu-Gi-Oh Collection Manager - System Status"
echo "=============================================="

# Service Status
info "📊 Service Status:"
$COMPOSE_CMD -f $COMPOSE_FILE ps

echo ""

# Health Checks
info "🏥 Health Status:"
if curl -s http://localhost/health > /dev/null; then
    log "✅ Frontend health check: PASS"
else
    error "❌ Frontend health check: FAIL"
fi

if curl -s http://localhost:3000/ > /dev/null; then
    log "✅ Backend health check: PASS"
else
    error "❌ Backend health check: FAIL"
fi

echo ""

# Resource Usage
info "💾 Resource Usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}" $(docker ps --format "{{.Names}}" | grep yugioh)

echo ""

# Disk Usage
info "💽 Disk Usage:"
echo "Data directory: $(du -sh /mnt/data/yugioh 2>/dev/null || echo 'N/A')"
echo "Docker images: $(docker images --format 'table {{.Repository}}\t{{.Tag}}\t{{.Size}}' | grep yugioh || echo 'No yugioh images found')"

echo ""

# Recent Logs (last 10 lines)
info "📝 Recent Logs (last 10 lines):"
echo "Backend:"
$COMPOSE_CMD -f $COMPOSE_FILE logs --tail=5 backend 2>/dev/null || echo "No backend logs"
echo ""
echo "Frontend:"
$COMPOSE_CMD -f $COMPOSE_FILE logs --tail=5 frontend 2>/dev/null || echo "No frontend logs"

echo ""

# Uptime
info "⏰ Container Uptime:"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep yugioh

echo ""

# Quick network test
info "🌐 Network Connectivity:"
if ping -c 1 google.com > /dev/null 2>&1; then
    log "✅ Internet connectivity: OK"
else
    warn "⚠️ Internet connectivity: Limited"
fi

# Check if ports are open
if ss -tuln | grep -q :80; then
    log "✅ Port 80 (HTTP): Open"
else
    error "❌ Port 80 (HTTP): Not listening"
fi

if ss -tuln | grep -q :3000; then
    log "✅ Port 3000 (Backend): Open"
else
    error "❌ Port 3000 (Backend): Not listening"
fi

echo ""
echo "🔧 Quick Commands:"
echo "  View logs:     $COMPOSE_CMD -f $COMPOSE_FILE logs -f"
echo "  Restart:       $COMPOSE_CMD -f $COMPOSE_FILE restart"
echo "  Update:        ./scripts/update.sh"
echo "  Stop:          $COMPOSE_CMD -f $COMPOSE_FILE down"
echo "  Start:         $COMPOSE_CMD -f $COMPOSE_FILE up -d"