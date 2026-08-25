#!/bin/bash
set -euo pipefail
BACKUP_DIR=/var/backups/comino-world
DATA_DIR=/var/lib/comino-world
STAMP=$(date +%Y%m%d-%H%M%S)
mkdir -p "$BACKUP_DIR"
sqlite3 "$DATA_DIR/database.sqlite" ".backup '$BACKUP_DIR/database-$STAMP.sqlite'"
tar -czf "$BACKUP_DIR/uploads-$STAMP.tar.gz" -C "$DATA_DIR" uploads
find "$BACKUP_DIR" -type f -mtime +14 -delete
