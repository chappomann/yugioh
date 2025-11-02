#!/bin/bash

# Script to sync local images to production server
# Usage: ./scripts/sync-images.sh [server-user@server-host]

SERVER=${1:-"your-user@lapras"}
LOCAL_IMAGES_DIR="./frontend/public/images/cards"
REMOTE_IMAGES_DIR="/mnt/data/yugioh/images/cards"

echo "🚀 Syncing images to production server..."
echo "Local: $LOCAL_IMAGES_DIR"
echo "Remote: $SERVER:$REMOTE_IMAGES_DIR"

# Check if local images directory exists
if [ ! -d "$LOCAL_IMAGES_DIR" ]; then
    echo "❌ Local images directory not found: $LOCAL_IMAGES_DIR"
    exit 1
fi

# Count local images
LOCAL_COUNT=$(find "$LOCAL_IMAGES_DIR" -name "*.jpg" | wc -l)
echo "📊 Found $LOCAL_COUNT images locally"

# Create remote directory if it doesn't exist
ssh "$SERVER" "sudo mkdir -p $REMOTE_IMAGES_DIR"

# Sync images using rsync
echo "📤 Starting rsync..."
rsync -avz --progress \
    "$LOCAL_IMAGES_DIR/" \
    "$SERVER:$REMOTE_IMAGES_DIR/" \
    --rsync-path="sudo rsync"

# Verify sync
echo "✅ Sync complete! Verifying..."
REMOTE_COUNT=$(ssh "$SERVER" "find $REMOTE_IMAGES_DIR -name '*.jpg' | wc -l")
echo "📊 Remote images count: $REMOTE_COUNT"

if [ "$LOCAL_COUNT" -eq "$REMOTE_COUNT" ]; then
    echo "✅ All images synced successfully!"
else
    echo "⚠️  Image count mismatch. Local: $LOCAL_COUNT, Remote: $REMOTE_COUNT"
fi