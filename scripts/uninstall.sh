#!/bin/bash

# AMP Panel Uninstaller
# Usage: sudo bash scripts/uninstall.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${RED}╔══════════════════════════════════════╗${NC}"
echo -e "${RED}║      AMP Panel Uninstaller           ║${NC}"
echo -e "${RED}╚══════════════════════════════════════╝${NC}"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${YELLOW}⚠  WARNING: This will permanently remove AMP Panel and all associated data.${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo -e "${BLUE}[*]${NC} Uninstall cancelled."
  exit 0
fi

echo ""
echo -e "${YELLOW}Do you want to keep site data and backups? (yes/no)${NC}"
read -p "> " KEEP_DATA

# --- Stop & remove Docker containers ---
if command -v docker &> /dev/null; then
  echo -e "${BLUE}[*]${NC} Stopping Docker containers..."
  cd "$PROJECT_DIR"
  if [ -f "docker-compose.yml" ]; then
    docker compose down --remove-orphans 2>/dev/null || true
    if [ "$KEEP_DATA" != "yes" ]; then
      echo -e "${BLUE}[*]${NC} Removing Docker volumes..."
      docker compose down -v 2>/dev/null || true
    fi
  fi
  # Remove built image
  docker rmi amp-panel 2>/dev/null || true
  echo -e "${GREEN}[✓]${NC} Docker containers removed."
fi

# --- Stop systemd service (Ubuntu install) ---
if systemctl is-active --quiet amp-panel 2>/dev/null; then
  echo -e "${BLUE}[*]${NC} Stopping systemd service..."
  sudo systemctl stop amp-panel
  sudo systemctl disable amp-panel
  sudo rm -f /etc/systemd/system/amp-panel.service
  sudo systemctl daemon-reload
  echo -e "${GREEN}[✓]${NC} Systemd service removed."
fi

# --- Remove Nginx config ---
if [ -f "/etc/nginx/sites-enabled/amp-panel" ]; then
  echo -e "${BLUE}[*]${NC} Removing Nginx configuration..."
  sudo rm -f /etc/nginx/sites-enabled/amp-panel
  sudo rm -f /etc/nginx/sites-available/amp-panel
  sudo nginx -t 2>/dev/null && sudo systemctl reload nginx
  echo -e "${GREEN}[✓]${NC} Nginx config removed."
fi

# --- Remove data directories ---
if [ "$KEEP_DATA" != "yes" ]; then
  echo -e "${BLUE}[*]${NC} Removing data directories..."
  rm -rf "$PROJECT_DIR/data"
  rm -rf "$PROJECT_DIR/sites"
  rm -rf "$PROJECT_DIR/backups"
  echo -e "${GREEN}[✓]${NC} Data directories removed."
else
  echo -e "${BLUE}[*]${NC} Keeping site data and backups."
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   AMP Panel uninstalled successfully ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
echo ""
if [ "$KEEP_DATA" = "yes" ]; then
  echo "  Site data preserved in: $PROJECT_DIR/sites"
  echo "  Backups preserved in:   $PROJECT_DIR/backups"
  echo ""
fi
echo "  To fully remove, delete the project folder:"
echo "    rm -rf $PROJECT_DIR"
echo ""
