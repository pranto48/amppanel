#!/bin/bash

# AMP Panel - PostgreSQL Automated Backup Script
# Runs inside the pg-backup container on a cron schedule
# Supports: full dumps, compression, retention, and restore

set -euo pipefail

# Configuration (from environment variables)
BACKUP_DIR="${BACKUP_DIR:-/backups/postgres}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
RETENTION_WEEKLY="${BACKUP_RETENTION_WEEKLY:-4}"
RETENTION_MONTHLY="${BACKUP_RETENTION_MONTHLY:-6}"
PG_HOST="${PGHOST:-postgres}"
PG_PORT="${PGPORT:-5432}"
PG_USER="${PGUSER:-amp}"
PG_DB="${PGDATABASE:-amp_panel}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DAY_OF_WEEK=$(date +%u)
DAY_OF_MONTH=$(date +%d)

# Colors for logging
log_info()  { echo "[$(date +'%Y-%m-%d %H:%M:%S')] [INFO]  $*"; }
log_error() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] [ERROR] $*" >&2; }
log_ok()    { echo "[$(date +'%Y-%m-%d %H:%M:%S')] [OK]    $*"; }

# Create backup directories
mkdir -p "${BACKUP_DIR}/daily" "${BACKUP_DIR}/weekly" "${BACKUP_DIR}/monthly"

# Wait for PostgreSQL to be ready
log_info "Checking PostgreSQL connection..."
for i in $(seq 1 30); do
  if pg_isready -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" > /dev/null 2>&1; then
    break
  fi
  if [ "$i" -eq 30 ]; then
    log_error "PostgreSQL is not ready after 30 attempts. Aborting."
    exit 1
  fi
  sleep 2
done

log_info "Starting backup of database '${PG_DB}'..."

# Perform the backup
BACKUP_FILE="${BACKUP_DIR}/daily/${PG_DB}_${TIMESTAMP}.sql.gz"
if pg_dump -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" \
  --format=custom --compress=6 --verbose \
  -f "${BACKUP_FILE}" 2>/tmp/pg_dump.log; then
  
  BACKUP_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
  log_ok "Daily backup created: ${BACKUP_FILE} (${BACKUP_SIZE})"
else
  log_error "Backup failed! Check logs:"
  cat /tmp/pg_dump.log >&2
  exit 1
fi

# Weekly backup (every Sunday)
if [ "$DAY_OF_WEEK" -eq 7 ]; then
  WEEKLY_FILE="${BACKUP_DIR}/weekly/${PG_DB}_weekly_${TIMESTAMP}.sql.gz"
  cp "$BACKUP_FILE" "$WEEKLY_FILE"
  log_ok "Weekly backup created: ${WEEKLY_FILE}"
fi

# Monthly backup (1st of each month)
if [ "$DAY_OF_MONTH" -eq "01" ]; then
  MONTHLY_FILE="${BACKUP_DIR}/monthly/${PG_DB}_monthly_${TIMESTAMP}.sql.gz"
  cp "$BACKUP_FILE" "$MONTHLY_FILE"
  log_ok "Monthly backup created: ${MONTHLY_FILE}"
fi

# --- Retention cleanup ---

# Daily: remove backups older than RETENTION_DAYS
log_info "Cleaning daily backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}/daily" -name "*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete -print | while read f; do
  log_info "Removed old daily backup: $f"
done

# Weekly: keep only last RETENTION_WEEKLY weeks
log_info "Cleaning weekly backups, keeping last ${RETENTION_WEEKLY}..."
WEEKLY_RETENTION_DAYS=$((RETENTION_WEEKLY * 7))
find "${BACKUP_DIR}/weekly" -name "*.sql.gz" -type f -mtime +${WEEKLY_RETENTION_DAYS} -delete -print | while read f; do
  log_info "Removed old weekly backup: $f"
done

# Monthly: keep only last RETENTION_MONTHLY months
log_info "Cleaning monthly backups, keeping last ${RETENTION_MONTHLY}..."
MONTHLY_RETENTION_DAYS=$((RETENTION_MONTHLY * 31))
find "${BACKUP_DIR}/monthly" -name "*.sql.gz" -type f -mtime +${MONTHLY_RETENTION_DAYS} -delete -print | while read f; do
  log_info "Removed old monthly backup: $f"
done

# Summary
DAILY_COUNT=$(find "${BACKUP_DIR}/daily" -name "*.sql.gz" -type f | wc -l)
WEEKLY_COUNT=$(find "${BACKUP_DIR}/weekly" -name "*.sql.gz" -type f | wc -l)
MONTHLY_COUNT=$(find "${BACKUP_DIR}/monthly" -name "*.sql.gz" -type f | wc -l)
TOTAL_SIZE=$(du -sh "${BACKUP_DIR}" | cut -f1)

log_ok "Backup complete! Summary:"
log_info "  Daily backups:   ${DAILY_COUNT}"
log_info "  Weekly backups:  ${WEEKLY_COUNT}"
log_info "  Monthly backups: ${MONTHLY_COUNT}"
log_info "  Total size:      ${TOTAL_SIZE}"
