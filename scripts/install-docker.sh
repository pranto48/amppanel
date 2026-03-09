#!/bin/bash

# AMP Panel Docker Quick Start
# Usage: bash scripts/install-docker.sh

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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
  sudo usermod -aG docker $USER
  echo -e "${YELLOW}[!]${NC} Please log out and back in for Docker permissions to take effect."
fi

# Check if docker compose is available
if ! docker compose version &> /dev/null; then
  echo -e "${RED}[✗]${NC} Docker Compose not found. Please install Docker Compose v2."
  exit 1
fi

# Create directories
mkdir -p data sites backups

# Copy .env.example to .env if it doesn't exist
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    echo -e "${BLUE}[*]${NC} Created .env file from .env.example"
  fi
fi

# Load port configuration from .env or use defaults
HTTP_PORT=${AMP_HTTP_PORT:-8880}
HTTPS_PORT=${AMP_HTTPS_PORT:-8443}

echo -e "${BLUE}[*]${NC} Building and starting containers..."
docker compose up --build -d

# Wait for services to be healthy
echo -e "${BLUE}[*]${NC} Waiting for services to start..."
sleep 10

# Check container health
echo -e "${BLUE}[*]${NC} Checking container status..."
docker compose ps

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC}              AMP Panel Started Successfully!               ${GREEN}║${NC}"
echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║${NC}                                                            ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  Access Panel:  http://localhost:${HTTP_PORT}                      ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}                                                            ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  Default Credentials:                                      ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}    Email:     admin_amp@localhost                          ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}    Password:  Amp_Password                                 ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}                                                            ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  ${YELLOW}⚠ Change password after first login!${NC}                     ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}                                                            ${GREEN}║${NC}"
echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║${NC}  Useful Commands:                                          ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}    docker compose logs -f      # View logs                 ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}    docker compose ps           # Check status              ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}    docker compose down         # Stop all                  ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}    docker compose restart      # Restart all               ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}    docker stats                # Resource usage            ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}                                                            ${GREEN}║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
