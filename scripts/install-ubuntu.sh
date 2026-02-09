#!/bin/bash

# AMP Panel Installer for Ubuntu 22.04+
# Usage: sudo bash scripts/install-ubuntu.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[*]${NC} $1"; }
print_success() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  print_error "Please run as root: sudo bash scripts/install-ubuntu.sh"
  exit 1
fi

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

print_status "Installing AMP Panel from: $PROJECT_DIR"
echo ""

# Check Ubuntu version
if [ -f /etc/os-release ]; then
  . /etc/os-release
  if [ "$ID" != "ubuntu" ]; then
    print_warning "This script is designed for Ubuntu. Detected: $ID"
  fi
fi

# Update system
print_status "Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq

# Install dependencies
print_status "Installing dependencies..."
apt-get install -y -qq \
  curl \
  wget \
  git \
  gnupg2 \
  ca-certificates \
  lsb-release \
  apt-transport-https \
  software-properties-common

# Install Docker
print_status "Installing Docker..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh
  rm get-docker.sh
  systemctl enable docker
  systemctl start docker
  print_success "Docker installed"
else
  print_success "Docker already installed"
fi

# Install Docker Compose
print_status "Installing Docker Compose..."
if ! docker compose version &> /dev/null; then
  apt-get install -y -qq docker-compose-plugin
  print_success "Docker Compose installed"
else
  print_success "Docker Compose already installed"
fi

# Navigate to project directory
cd "$PROJECT_DIR"

# Generate random password
DB_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)

# Create .env file if not exists
if [ ! -f .env ]; then
  print_status "Creating environment configuration..."
  cat > .env << EOF
# AMP Panel Configuration
AMP_DOMAIN=$(hostname -f 2>/dev/null || echo "localhost")
AMP_ADMIN_EMAIL=admin_amp@localhost

# Database (auto-generated)
DB_PASSWORD=$DB_PASSWORD
EOF
fi

# Create directories
mkdir -p data sites backups

# Start services with Docker Compose
print_status "Building and starting AMP Panel..."
docker compose up --build -d

# Wait for services to start
print_status "Waiting for services to initialize..."
sleep 10

# Check if running
if docker compose ps | grep -q "amp-panel.*running\|amp-panel.*Up"; then
  print_success "AMP Panel is running!"
else
  print_warning "Checking container status..."
  docker compose ps
fi

# Get server IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
print_success "AMP Panel installation complete!"
echo ""
echo "  Access URL:   http://$SERVER_IP"
echo ""
echo "  Default Login:"
echo "    Email:      admin_amp@localhost"
echo "    Password:   Amp_Password"
echo ""
print_warning "Change the default password immediately after login!"
echo ""
echo "  Useful commands:"
echo "    docker compose logs -f      # View logs"
echo "    docker compose restart      # Restart services"
echo "    docker compose down         # Stop services"
echo ""
echo "═══════════════════════════════════════════════════════════════"
