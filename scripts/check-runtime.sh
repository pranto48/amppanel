#!/bin/bash

# AMP Panel runtime diagnostics for Linux + Docker deployments
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

ok(){ echo -e "${GREEN}[OK]${NC} $1"; }
warn(){ echo -e "${YELLOW}[WARN]${NC} $1"; }
fail(){ echo -e "${RED}[FAIL]${NC} $1"; }
info(){ echo -e "${BLUE}[*]${NC} $1"; }

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

[ -f .env ] && { set -a; source .env; set +a; }

HTTP_PORT="${AMP_HTTP_PORT:-8880}"
HTTPS_PORT="${AMP_HTTPS_PORT:-8443}"

info "Checking Docker CLI"
if command -v docker >/dev/null 2>&1; then ok "docker found"; else fail "docker not found"; exit 1; fi

info "Checking Docker Compose"
if docker compose version >/dev/null 2>&1; then ok "docker compose found"; else fail "docker compose not found"; exit 1; fi

info "Validating compose config"
if docker compose config >/dev/null; then ok "docker-compose.yml is valid"; else fail "docker compose config validation failed"; exit 1; fi

info "Checking core containers"
RUNNING_SERVICES="$(docker compose ps --services --status running || true)"
for svc in amp-panel postgres redis pg-backup; do
  if echo "$RUNNING_SERVICES" | grep -qx "$svc"; then
    ok "$svc is running"
  else
    warn "$svc is not running"
  fi
done

info "Probing HTTP endpoint"
if curl -fsS "http://localhost:${HTTP_PORT}" >/dev/null 2>&1; then
  ok "Panel reachable at http://localhost:${HTTP_PORT}"
else
  warn "Panel not reachable at http://localhost:${HTTP_PORT}"
fi

info "Probing HTTPS endpoint"
if curl -kfsS "https://localhost:${HTTPS_PORT}" >/dev/null 2>&1; then
  ok "Panel reachable at https://localhost:${HTTPS_PORT}"
else
  warn "Panel not reachable at https://localhost:${HTTPS_PORT}"
fi

info "Recent amp-panel logs"
docker compose logs --tail=20 amp-panel || true

ok "Runtime diagnostics complete"
