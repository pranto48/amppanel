#!/bin/bash

# AMP Panel Docker Quick Start
# Usage: bash scripts/install-docker.sh

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}[*]${NC} Starting AMP Panel from: $PROJECT_DIR"

cd "$PROJECT_DIR"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}[!]${NC} Docker not found. Installing..."
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  rm get-docker.sh
fi

# Create directories
mkdir -p data sites backups

echo -e "${BLUE}[*]${NC} Building and starting containers..."
docker compose up --build -d

echo ""
echo -e "${GREEN}[✓]${NC} AMP Panel is starting!"
echo ""
echo "  Access: http://localhost"
echo "  Login:  admin_amp@localhost / Amp_Password"
echo ""
echo "  Commands:"
echo "    docker compose logs -f   # View logs"
echo "    docker compose down      # Stop"
echo ""
