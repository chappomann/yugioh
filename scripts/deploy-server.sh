#!/bin/bash

# Yu-Gi-Oh Collection Manager - Server Deployment Script
# For Debian/Ubuntu servers with Docker

set -e  # Exit on any error

# Configuration
REPO_URL="https://github.com/chappomann/yugioh.git"
DEPLOY_DIR="/opt/yugioh"
DATA_DIR="/mnt/data/yugioh"
COMPOSE_FILE="docker-compose.prod.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    error "This script should not be run as root. Please run as a regular user with sudo privileges."
fi

log "🚀 Starting Yu-Gi-Oh Collection Manager deployment..."

# Check system requirements
log "📋 Checking system requirements..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    error "Docker is not installed. Please install Docker first: https://docs.docker.com/engine/install/debian/"
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
    error "Docker Compose is not available. Please install Docker Compose."
fi

# Set compose command
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

log "✅ Docker and Docker Compose are available"

# Check if user is in docker group
if ! groups $USER | grep -q docker; then
    warn "User is not in docker group. You may need to run Docker commands with sudo."
    warn "To fix this, run: sudo usermod -aG docker $USER && newgrp docker"
fi

# Create deployment directory
log "📁 Setting up deployment directory..."
sudo mkdir -p $DEPLOY_DIR
sudo mkdir -p $DATA_DIR/{database,images}
sudo chown -R $USER:$USER $DEPLOY_DIR
sudo chown -R $USER:$USER $DATA_DIR

# Clone or update repository
if [ -d "$DEPLOY_DIR/.git" ]; then
    log "📥 Updating existing repository..."
    cd $DEPLOY_DIR
    git fetch origin
    git reset --hard origin/develop  # Using develop branch
else
    log "📥 Cloning repository..."
    git clone -b develop $REPO_URL $DEPLOY_DIR  # Clone develop branch
    cd $DEPLOY_DIR
fi

# Stop existing containers if running
log "🛑 Stopping existing containers..."
$COMPOSE_CMD -f $COMPOSE_FILE down 2>/dev/null || true

# Build and start containers
log "🔨 Building Docker containers..."
$COMPOSE_CMD -f $COMPOSE_FILE build --no-cache

log "🚀 Starting containers..."
$COMPOSE_CMD -f $COMPOSE_FILE up -d

# Wait for services to be healthy
log "🏥 Waiting for services to be healthy..."
timeout=300  # 5 minutes
elapsed=0
while [ $elapsed -lt $timeout ]; do
    if $COMPOSE_CMD -f $COMPOSE_FILE ps | grep -q "healthy"; then
        break
    fi
    sleep 5
    elapsed=$((elapsed + 5))
    echo -n "."
done
echo

if [ $elapsed -ge $timeout ]; then
    error "Services failed to become healthy within 5 minutes"
fi

# Show status
log "📊 Deployment Status:"
$COMPOSE_CMD -f $COMPOSE_FILE ps

# Show URLs
log "🌐 Application URLs:"
echo "  Frontend: http://$(hostname -I | awk '{print $1}')"
echo "  Backend API: http://$(hostname -I | awk '{print $1}'):3000"
echo "  Health Check: http://$(hostname -I | awk '{print $1}')/health"

# Setup log rotation
log "📝 Setting up log rotation..."
sudo tee /etc/logrotate.d/yugioh > /dev/null <<EOF
/var/lib/docker/containers/*/*.log {
    daily
    missingok
    rotate 7
    compress
    notifempty
    create 0644 root root
    postrotate
        /bin/kill -USR1 \$(cat /var/run/docker.pid 2>/dev/null) 2>/dev/null || true
    endscript
}
EOF

# Create systemd service for auto-start
log "⚙️ Creating systemd service..."
sudo tee /etc/systemd/system/yugioh.service > /dev/null <<EOF
[Unit]
Description=Yu-Gi-Oh Collection Manager
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$DEPLOY_DIR
ExecStart=$COMPOSE_CMD -f $COMPOSE_FILE up -d
ExecStop=$COMPOSE_CMD -f $COMPOSE_FILE down
TimeoutStartSec=0
User=$USER

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable yugioh

log "✅ Deployment completed successfully!"
log "🔧 Management commands:"
echo "  Start:   sudo systemctl start yugioh"
echo "  Stop:    sudo systemctl stop yugioh"
echo "  Restart: sudo systemctl restart yugioh"
echo "  Status:  sudo systemctl status yugioh"
echo "  Logs:    cd $DEPLOY_DIR && $COMPOSE_CMD -f $COMPOSE_FILE logs -f"

log "📚 Data is stored in: $DATA_DIR"
log "🔄 To update: cd $DEPLOY_DIR && git pull && $COMPOSE_CMD -f $COMPOSE_FILE up -d --build"

echo ""
log "📥 Optional: Download card images (this may take a while and use significant space):"
echo "  cd $DEPLOY_DIR && $COMPOSE_CMD -f $COMPOSE_FILE exec backend npm run get-images"