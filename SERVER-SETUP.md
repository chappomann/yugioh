# Yu-Gi-Oh Collection Manager - Server Deployment Guide

## 🖥️ Server Specifications
- **Hostname**: lapras
- **OS**: Debian
- **Storage**: 60GB root drive + 984GB data drive at `/mnt/data`
- **Data Location**: `/mnt/data/yugioh`
- **Application Location**: `/opt/yugioh`

## 🚀 Quick Deployment

### 1. One-Command Deployment
```bash
# Download and run deployment script
curl -sSL https://raw.githubusercontent.com/chappomann/yugioh/main/scripts/deploy-server.sh | bash
```

### 2. Manual Deployment
```bash
# Clone repository
sudo mkdir -p /opt/yugioh
git clone https://github.com/chappomann/yugioh.git /opt/yugioh
cd /opt/yugioh

# Run deployment script
./scripts/deploy-server.sh
```

## 📁 Directory Structure
```
/opt/yugioh/                 # Application code
├── backend/                 # Backend source
├── frontend/                # Frontend source
├── scripts/                 # Management scripts
└── docker-compose.prod.yml  # Production configuration

/mnt/data/yugioh/           # Data storage (on large drive)
├── database/               # Card data and SQLite
└── images/                 # Card images

/mnt/data/backups/yugioh/   # Backup storage
```

## 🔧 Management Commands

### Service Management
```bash
# Start service
sudo systemctl start yugioh

# Stop service  
sudo systemctl stop yugioh

# Restart service
sudo systemctl restart yugioh

# Check status
sudo systemctl status yugioh

# Enable auto-start on boot
sudo systemctl enable yugioh
```

### Docker Commands
```bash
cd /opt/yugioh

# View running containers
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Restart containers
docker compose -f docker-compose.prod.yml restart

# Stop containers
docker compose -f docker-compose.prod.yml down

# Start containers
docker compose -f docker-compose.prod.yml up -d
```

### Maintenance Scripts
```bash
cd /opt/yugioh

# Monitor system status
./scripts/monitor.sh

# Update application
./scripts/update.sh

# Create backup
./scripts/backup.sh

# Check Docker installation
./scripts/check-docker.sh
```

## 🌐 Access URLs

- **Frontend**: http://lapras (or http://server-ip)
- **Backend API**: http://lapras:3000 (internal only)
- **Health Check**: http://lapras/health

## 📊 Storage Usage

### Data Locations
- **Database**: `/mnt/data/yugioh/database/`
- **Images**: `/mnt/data/yugioh/images/`
- **Backups**: `/mnt/data/backups/yugioh/`

### Space Monitoring
```bash
# Check data usage
du -sh /mnt/data/yugioh

# Check available space
df -h /mnt/data

# Check Docker space usage
docker system df
```

## 🔄 Backup & Restore

### Automated Backups
```bash
# Manual backup
./scripts/backup.sh

# Setup daily backup cron job
echo "0 2 * * * /opt/yugioh/scripts/backup.sh >> /var/log/yugioh-backup.log 2>&1" | sudo crontab -
```

### Restore Process
```bash
# 1. Stop application
sudo systemctl stop yugioh

# 2. Extract backup
cd /mnt/data/backups/yugioh
tar -xzf yugioh-backup-YYYYMMDD-HHMMSS.tar.gz

# 3. Restore data
cp -r yugioh-backup-*/database/* /mnt/data/yugioh/database/
cp -r yugioh-backup-*/images/* /mnt/data/yugioh/images/

# 4. Start application
sudo systemctl start yugioh
```

## 🔒 Security Notes

### Firewall Configuration
```bash
# Allow HTTP traffic
sudo ufw allow 80/tcp

# Optional: Allow HTTPS
sudo ufw allow 443/tcp

# Backend port is internal only (127.0.0.1:3000)
```

### File Permissions
- Application files: `/opt/yugioh` (owned by user)
- Data files: `/mnt/data/yugioh` (owned by user)
- Docker containers run as non-root users

## 📝 Logs

### Application Logs
```bash
# Container logs
docker compose -f docker-compose.prod.yml logs -f

# System service logs
sudo journalctl -u yugioh -f

# Backup logs
tail -f /var/log/yugioh-backup.log
```

### Log Rotation
Logs are automatically rotated with a 10MB limit and 3 file retention.

## 🔧 Troubleshooting

### Common Issues

**Port 80 already in use:**
```bash
# Check what's using port 80
sudo ss -tulpn | grep :80
sudo systemctl stop apache2  # If Apache is running
```

**Containers won't start:**
```bash
# Check Docker status
sudo systemctl status docker

# Check logs
docker compose -f docker-compose.prod.yml logs

# Rebuild containers
docker compose -f docker-compose.prod.yml build --no-cache
```

**Data not persisting:**
```bash
# Check mount points
mount | grep /mnt/data

# Check permissions
ls -la /mnt/data/yugioh
```

### Health Checks
```bash
# Quick system check
./scripts/monitor.sh

# Manual health checks
curl http://localhost/health
curl http://localhost:3000/
```

## 📈 Performance Optimization

### Resource Limits
The containers are configured with:
- Log rotation (10MB max, 3 files)
- Health checks every 30 seconds
- Restart policies for high availability

### Monitoring
- Container health checks
- Resource usage monitoring
- Automatic log cleanup

## 🔄 Updates

### Automatic Updates
```bash
# Update to latest version
cd /opt/yugioh
./scripts/update.sh
```

### Manual Updates
```bash
# Pull latest code
cd /opt/yugioh
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 📞 Support

For issues or questions:
1. Check logs: `./scripts/monitor.sh`
2. Review troubleshooting section
3. Create GitHub issue: https://github.com/chappomann/yugioh/issues