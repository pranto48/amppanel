#!/bin/bash

# AMP Panel Quick Install Script for Ubuntu 22.04+
# Usage: curl -fsSL https://install.amp-panel.io | bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored message
print_status() { echo -e "${BLUE}[*]${NC} $1"; }
print_success() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  print_error "Please run as root (sudo)"
  exit 1
fi

# Check Ubuntu version
if [ -f /etc/os-release ]; then
  . /etc/os-release
  if [ "$ID" != "ubuntu" ]; then
    print_warning "This script is designed for Ubuntu. Detected: $ID"
  fi
fi

print_status "Starting AMP Panel installation..."
echo ""

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

# Create installation directory
AMP_DIR="/opt/amp-panel"
print_status "Creating installation directory at $AMP_DIR..."
mkdir -p $AMP_DIR
cd $AMP_DIR

# Create docker-compose.yml
print_status "Creating Docker Compose configuration..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  amp-panel:
    image: ghcr.io/amp-panel/amp-panel:latest
    container_name: amp-panel
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./data:/app/data
      - ./sites:/var/www
      - ./backups:/backups
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - AMP_DOMAIN=${AMP_DOMAIN:-localhost}
    networks:
      - amp-network

  postgres:
    image: postgres:16-alpine
    container_name: amp-postgres
    restart: unless-stopped
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=amp
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=amp_panel
    networks:
      - amp-network

  redis:
    image: redis:7-alpine
    container_name: amp-redis
    restart: unless-stopped
    volumes:
      - redis_data:/data
    networks:
      - amp-network

volumes:
  postgres_data:
  redis_data:

networks:
  amp-network:
    driver: bridge
EOF

# Generate random password
DB_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)

# Create .env file
print_status "Creating environment configuration..."
cat > .env << EOF
# AMP Panel Configuration
AMP_DOMAIN=$(hostname -f 2>/dev/null || echo "localhost")

# Database (auto-generated)
DB_PASSWORD=$DB_PASSWORD
EOF

# Create directories
mkdir -p data sites backups

# Start services
print_status "Starting AMP Panel services..."
docker compose up -d

# Wait for services to start
print_status "Waiting for services to initialize..."
sleep 10

# Check if running
if docker compose ps | grep -q "amp-panel.*running"; then
  print_success "AMP Panel is running!"
else
  print_error "Failed to start AMP Panel"
  docker compose logs amp-panel
  exit 1
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
echo "    cd $AMP_DIR"
echo "    docker compose logs -f      # View logs"
echo "    docker compose restart      # Restart services"
echo "    docker compose down         # Stop services"
echo ""
echo "═══════════════════════════════════════════════════════════════"
