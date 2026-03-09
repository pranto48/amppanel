#!/bin/bash

# AMP Panel - PostgreSQL Backup Restore Script
# Usage: bash scripts/pg-restore.sh <backup_file>

set -euo pipefail

BACKUP_FILE="${1:-}"
PG_HOST="${PGHOST:-postgres}"
PG_PORT="${PGPORT:-5432}"
PG_USER="${PGUSER:-amp}"
PG_DB="${PGDATABASE:-amp_panel}"

log_info()  { echo "[$(date +'%Y-%m-%d %H:%M:%S')] [INFO]  $*"; }
log_error() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] [ERROR] $*" >&2; }
log_ok()    { echo "[$(date +'%Y-%m-%d %H:%M:%S')] [OK]    $*"; }

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file>"
  echo ""
  echo "Available backups:"
  echo "--- Daily ---"
  ls -lh /backups/postgres/daily/*.sql.gz 2>/dev/null || echo "  (none)"
  echo "--- Weekly ---"
  ls -lh /backups/postgres/weekly/*.sql.gz 2>/dev/null || echo "  (none)"
  echo "--- Monthly ---"
  ls -lh /backups/postgres/monthly/*.sql.gz 2>/dev/null || echo "  (none)"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  log_error "Backup file not found: $BACKUP_FILE"
  exit 1
fi

log_info "Restoring database '${PG_DB}' from: ${BACKUP_FILE}"
echo ""
echo "⚠️  WARNING: This will overwrite the current database!"
echo "   Press Ctrl+C to cancel, or wait 5 seconds to continue..."
sleep 5

log_info "Dropping and recreating database..."
psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d postgres -c "
  SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${PG_DB}' AND pid <> pg_backend_pid();
"
dropdb -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" --if-exists "$PG_DB"
createdb -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" "$PG_DB"

log_info "Restoring from backup..."
if pg_restore -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" \
  --verbose --clean --if-exists "$BACKUP_FILE" 2>/tmp/pg_restore.log; then
  log_ok "Database restored successfully!"
else
  log_error "Restore completed with warnings. Check details:"
  cat /tmp/pg_restore.log
fi
