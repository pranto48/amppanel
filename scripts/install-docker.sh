#!/bin/bash

# AMP Panel Docker Quick Start
# Compatibility: Linux only. Run with Bash.
# Usage: bash scripts/install-docker.sh

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[*]${NC} $1"; }
print_success() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }

check_port_in_use() {
  local port="$1"

  if command -v ss &> /dev/null && ss -ltn "( sport = :$port )" 2>/dev/null | tail -n +2 | grep -q .; then
    return 0
  fi

  if command -v lsof &> /dev/null && lsof -iTCP:"$port" -sTCP:LISTEN -Pn 2>/dev/null | tail -n +2 | grep -q .; then
    return 0
  fi

  if command -v netstat &> /dev/null && netstat -ltn 2>/dev/null | awk '{print $4}' | grep -Eq "(^|:)$port$"; then
    return 0
  fi

  return 1
}

print_port_conflict_guidance() {
  local http_port="$1"
  local https_port="$2"

  echo ""
  print_error "Port conflict detected. AMP Panel will not start until ports are free."
  echo "    Configure available ports in .env and retry."
  echo ""
  echo "    Suggested .env configuration:"
  echo "      AMP_HTTP_PORT=$http_port"
  echo "      AMP_HTTPS_PORT=$https_port"
  echo ""
  echo "    Then run:"
  echo "      docker compose up --build -d"
}

# Early environment compatibility checks
if [ -z "${BASH_VERSION:-}" ]; then
  echo -e "${RED}[✗]${NC} Unsupported shell. Please run this script with Bash:"
  echo "    bash scripts/install-docker.sh"
  exit 1
fi

OS_NAME="$(uname -s)"
if [ "$OS_NAME" != "Linux" ]; then
  case "$OS_NAME" in
    MINGW*|MSYS*|CYGWIN*)
      echo -e "${RED}[✗]${NC} Unsupported operating system (Windows)."
      echo "    Use WSL2 + Docker Desktop and run from WSL."
      ;;
    *)
      echo -e "${RED}[✗]${NC} Unsupported operating system: $OS_NAME."
      echo "    This installer currently supports Linux only."
      ;;
  esac
  exit 1
fi

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

print_status "Starting AMP Panel from: $PROJECT_DIR"

cd "$PROJECT_DIR"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  print_warning "Docker not found. Installing..."
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  rm get-docker.sh
  sudo usermod -aG docker $USER
  print_warning "Please log out and back in for Docker permissions to take effect."
fi

# Check if docker compose is available
if ! docker compose version &> /dev/null; then
  print_error "Docker Compose not found. Please install Docker Compose v2."
  exit 1
fi

# Create directories
mkdir -p data sites backups

# Copy .env.example to .env if it doesn't exist
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    print_status "Created .env file from .env.example"
  fi
fi

# Load .env so configured ports are reflected in output
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

# Load port configuration from .env or use defaults
HTTP_PORT=${AMP_HTTP_PORT:-8880}
HTTPS_PORT=${AMP_HTTPS_PORT:-8443}

# Preflight host port checks to provide actionable guidance
CONFLICT=0
if check_port_in_use "$HTTP_PORT"; then
  print_warning "HTTP port $HTTP_PORT is already in use."
  CONFLICT=1
fi

if check_port_in_use "$HTTPS_PORT"; then
  print_warning "HTTPS port $HTTPS_PORT is already in use."
  CONFLICT=1
fi

if [ "$CONFLICT" -eq 1 ]; then
  ALT_HTTP_PORT=8881
  ALT_HTTPS_PORT=8444

  while check_port_in_use "$ALT_HTTP_PORT"; do
    ALT_HTTP_PORT=$((ALT_HTTP_PORT + 1))
  done
  while check_port_in_use "$ALT_HTTPS_PORT"; do
    ALT_HTTPS_PORT=$((ALT_HTTPS_PORT + 1))
  done

  print_port_conflict_guidance "$ALT_HTTP_PORT" "$ALT_HTTPS_PORT"
  exit 1
fi

print_status "Building and starting containers..."
docker compose up --build -d

# Wait for services to be healthy
print_status "Waiting for services to start..."
sleep 10

# Check container health
print_status "Checking container status..."
docker compose ps

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC}              AMP Panel Started Successfully!               ${GREEN}║${NC}"
echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║${NC}                                                            ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  Access Panel:  http://localhost:${HTTP_PORT}                      ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  HTTPS Port:    https://localhost:${HTTPS_PORT}                     ${GREEN}║${NC}"
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
