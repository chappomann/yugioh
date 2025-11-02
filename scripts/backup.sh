#!/bin/bash

# Yu-Gi-Oh Collection Manager - Backup Script
# Creates backups of data and configurations

set -e

# Configuration
DATA_DIR="/mnt/data/yugioh"
BACKUP_DIR="/mnt/data/backups/yugioh"
DEPLOY_DIR="/opt/yugioh"
COMPOSE_FILE="docker-compose.prod.yml"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
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

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Create backup directory
mkdir -p $BACKUP_DIR

# Generate backup filename with timestamp
BACKUP_NAME="yugioh-backup-$(date +%Y%m%d-%H%M%S)"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

log "🗄️ Starting backup: $BACKUP_NAME"

# Create backup directory
mkdir -p $BACKUP_PATH

# Determine compose command
cd $DEPLOY_DIR
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

# Stop containers for consistent backup
log "⏸️ Stopping containers for backup..."
$COMPOSE_CMD -f $COMPOSE_FILE stop

# Backup data
log "📦 Backing up database..."
if [ -d "$DATA_DIR/database" ]; then
    cp -r "$DATA_DIR/database" "$BACKUP_PATH/"
    log "✅ Database backup completed"
else
    warn "Database directory not found: $DATA_DIR/database"
fi

log "🖼️ Backing up images..."
if [ -d "$DATA_DIR/images" ]; then
    cp -r "$DATA_DIR/images" "$BACKUP_PATH/"
    log "✅ Images backup completed"
else
    warn "Images directory not found: $DATA_DIR/images"
fi

# Backup configuration
log "⚙️ Backing up configuration..."
cp -r "$DEPLOY_DIR" "$BACKUP_PATH/config"
log "✅ Configuration backup completed"

# Create backup info file
cat > "$BACKUP_PATH/backup-info.txt" << EOF
Yu-Gi-Oh Collection Manager Backup
==================================
Backup Date: $(date)
Backup Name: $BACKUP_NAME
Server: $(hostname)
User: $(whoami)

Data Directory: $DATA_DIR
Deploy Directory: $DEPLOY_DIR
Backup Directory: $BACKUP_PATH

Contents:
- database/     Card data and SQLite database
- images/       Card images
- config/       Application code and configuration

To restore:
1. Stop the application: cd /opt/yugioh && docker compose -f docker-compose.prod.yml down
2. Restore data: cp -r $BACKUP_PATH/database/* $DATA_DIR/database/
3. Restore images: cp -r $BACKUP_PATH/images/* $DATA_DIR/images/
4. Restore config: cp -r $BACKUP_PATH/config/* $DEPLOY_DIR/
5. Start application: cd /opt/yugioh && docker compose -f docker-compose.prod.yml up -d
EOF

# Calculate backup size
BACKUP_SIZE=$(du -sh "$BACKUP_PATH" | cut -f1)

# Restart containers
log "▶️ Restarting containers..."
$COMPOSE_CMD -f $COMPOSE_FILE start

# Create compressed archive
log "🗜️ Creating compressed archive..."
cd $BACKUP_DIR
tar -czf "$BACKUP_NAME.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_NAME"

ARCHIVE_SIZE=$(du -sh "$BACKUP_NAME.tar.gz" | cut -f1)

log "✅ Backup completed successfully!"
info "📊 Backup Details:"
echo "  Location: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
echo "  Size: $ARCHIVE_SIZE"
echo "  Contains: Database, Images, Configuration"

# Clean up old backups (keep last 7 days)
log "🧹 Cleaning up old backups..."
find $BACKUP_DIR -name "yugioh-backup-*.tar.gz" -mtime +7 -delete 2>/dev/null || true

# Show remaining backups
REMAINING_BACKUPS=$(find $BACKUP_DIR -name "yugioh-backup-*.tar.gz" | wc -l)
info "📦 Total backups retained: $REMAINING_BACKUPS"

log "🔄 Application is running again"
info "🌐 Application URL: http://$(hostname -I | awk '{print $1}')"