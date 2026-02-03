#!/bin/bash

# AMP Panel Docker Quick Start
# Usage: ./install-docker.sh

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}[*]${NC} Creating AMP Panel directory..."
mkdir -p amp-panel && cd amp-panel

echo -e "${BLUE}[*]${NC} Downloading configuration..."
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
      - POSTGRES_PASSWORD=amp_secure_password_2024
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

echo -e "${BLUE}[*]${NC} Starting containers..."
docker compose up -d

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
