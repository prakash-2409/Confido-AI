#!/bin/bash

# Career AI SaaS - Database Backup Script
# Usage: ./scripts/backup-db.sh

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$PROJECT_DIR/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_NAME="career-ai-backup-$TIMESTAMP"

echo "🗄️  Starting database backup..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Check if MongoDB container is running
if ! docker ps | grep -q career-ai-mongodb; then
    echo "❌ MongoDB container is not running!"
    exit 1
fi

# Create backup inside container
echo "📦 Creating backup..."
docker exec career-ai-mongodb mongodump --db=career-ai-saas --out=/tmp/backup

# Copy backup to host
docker cp career-ai-mongodb:/tmp/backup "$BACKUP_DIR/$BACKUP_NAME"

# Cleanup inside container
docker exec career-ai-mongodb rm -rf /tmp/backup

# Compress backup
echo "🗜️  Compressing backup..."
cd "$BACKUP_DIR"
tar -czf "$BACKUP_NAME.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_NAME"

# Remove old backups (keep last 7)
echo "🧹 Cleaning old backups..."
ls -t "$BACKUP_DIR"/*.tar.gz 2>/dev/null | tail -n +8 | xargs -r rm

echo ""
echo "✅ Backup completed: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
echo ""

# Show backup size
ls -lh "$BACKUP_DIR/$BACKUP_NAME.tar.gz"
