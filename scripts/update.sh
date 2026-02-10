#!/bin/bash

# AMP Panel Auto-Update Script
# Usage: sudo bash scripts/update.sh

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo ""
echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       AMP Panel Auto-Updater         ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
echo ""

cd "$PROJECT_DIR"

# Check if git is available
if ! command -v git &> /dev/null; then
  echo -e "${RED}[✗]${NC} Git is not installed. Please install git first."
  exit 1
fi

# Check if this is a git repo
if [ ! -d ".git" ]; then
  echo -e "${RED}[✗]${NC} Not a git repository. Please clone the repo first:"
  echo "    git clone https://github.com/pranto48/amppanel.git"
  exit 1
fi

# Get current version
CURRENT_COMMIT=$(git rev-parse --short HEAD)
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo -e "${BLUE}[*]${NC} Current branch: $CURRENT_BRANCH"
echo -e "${BLUE}[*]${NC} Current commit: $CURRENT_COMMIT"

# Check for local changes
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
  echo -e "${YELLOW}[!]${NC} Local changes detected. Stashing..."
  git stash
fi

# Pull latest code
echo -e "${BLUE}[*]${NC} Pulling latest code..."
git pull origin "$CURRENT_BRANCH"

NEW_COMMIT=$(git rev-parse --short HEAD)

if [ "$CURRENT_COMMIT" = "$NEW_COMMIT" ]; then
  echo -e "${GREEN}[✓]${NC} Already up to date."
  exit 0
fi

echo -e "${BLUE}[*]${NC} Updated: $CURRENT_COMMIT → $NEW_COMMIT"

# Rebuild based on environment
if [ -f "docker-compose.yml" ] && command -v docker &> /dev/null; then
  echo -e "${BLUE}[*]${NC} Rebuilding Docker containers..."
  docker compose up --build -d
  echo -e "${GREEN}[✓]${NC} Docker containers rebuilt and restarted."
else
  echo -e "${YELLOW}[!]${NC} Docker not found. Please rebuild manually."
fi

echo ""
echo -e "${GREEN}[✓]${NC} AMP Panel updated successfully!"
echo "    $CURRENT_COMMIT → $NEW_COMMIT"
echo ""
