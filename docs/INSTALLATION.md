# AMP Panel Installation Guide

AMP Panel is a modern server control panel for managing web hosting services. This guide covers installation on both Ubuntu Server and Docker.

## Prerequisites

- A server with at least 2GB RAM, 20GB disk space
- Root or sudo access
- Domain name pointed to your server (recommended)

---

## Option 1: Docker Installation (Recommended)

Docker provides the fastest and most consistent installation experience.

### Step 1: Install Docker

```bash
# Install Docker (if not already installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get install docker-compose-plugin -y

# Add your user to docker group (optional, for non-root usage)
sudo usermod -aG docker $USER
```

### Step 2: Create Installation Directory

```bash
mkdir -p /opt/amp-panel
cd /opt/amp-panel
```

### Step 3: Create Docker Compose File

Create a file named `docker-compose.yml`:

```yaml
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
      - AMP_ADMIN_EMAIL=${AMP_ADMIN_EMAIL:-admin_amp@localhost}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
    networks:
      - amp-network

  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: amp-postgres
    restart: unless-stopped
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=amp
      - POSTGRES_PASSWORD=${DB_PASSWORD:-changeme}
      - POSTGRES_DB=amp_panel
    networks:
      - amp-network

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: amp-redis
    restart: unless-stopped
    volumes:
      - redis_data:/data
    networks:
      - amp-network

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: amp-nginx
    restart: unless-stopped
    ports:
      - "8080:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./sites:/var/www:ro
    networks:
      - amp-network

volumes:
  postgres_data:
  redis_data:

networks:
  amp-network:
    driver: bridge
```

### Step 4: Create Environment File

Create a `.env` file:

```bash
# AMP Panel Configuration
AMP_DOMAIN=your-domain.com
AMP_ADMIN_EMAIL=admin_amp@localhost

# Database
DB_PASSWORD=your-secure-password-here

# Supabase (provided by your AMP Panel license)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### Step 5: Start AMP Panel

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f amp-panel

# Check status
docker compose ps
```

### Step 6: Access AMP Panel

Open your browser and navigate to:
- `http://your-server-ip` or `http://your-domain.com`

Default login credentials:
- **Email:** `admin_amp@localhost`
- **Password:** `Amp_Password`

> **Important:** Change these credentials immediately after first login!

---

## Option 2: Ubuntu Server Installation

For direct installation on Ubuntu 22.04 LTS or newer.

### Step 1: Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### Step 2: Install Dependencies

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Bun (faster package manager)
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Install other dependencies
sudo apt-get install -y \
  git \
  nginx \
  certbot \
  python3-certbot-nginx \
  postgresql \
  redis-server \
  supervisor
```

### Step 3: Clone and Build AMP Panel

```bash
# Clone repository
cd /opt
sudo git clone https://github.com/amp-panel/amp-panel.git
cd amp-panel

# Install dependencies
bun install

# Build for production
bun run build
```

### Step 4: Configure PostgreSQL

```bash
# Create database and user
sudo -u postgres psql << EOF
CREATE USER amp WITH PASSWORD 'your-secure-password';
CREATE DATABASE amp_panel OWNER amp;
GRANT ALL PRIVILEGES ON DATABASE amp_panel TO amp;
EOF
```

### Step 5: Configure Nginx

Create `/etc/nginx/sites-available/amp-panel`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/amp-panel /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 6: Configure SSL (Optional but Recommended)

```bash
sudo certbot --nginx -d your-domain.com
```

### Step 7: Create Systemd Service

Create `/etc/systemd/system/amp-panel.service`:

```ini
[Unit]
Description=AMP Panel
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/amp-panel
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node /opt/amp-panel/dist/server.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable amp-panel
sudo systemctl start amp-panel
```

### Step 8: Access AMP Panel

Open your browser and navigate to your domain. Use the Setup Admin button to create your admin account.

---

## Plugin System

AMP Panel features a powerful plugin system for installing server services on-demand.

### Available Core Plugins

| Category | Plugins |
|----------|---------|
| Web Servers | Nginx, Apache |
| FTP | VSFTPD, ProFTPD |
| Email | Postfix, Dovecot |
| DNS | BIND9, PowerDNS |
| Databases | MySQL, MariaDB, PostgreSQL, Redis |
| Backup | Restic, Duplicity |
| Security | Fail2Ban, Certbot |
| Monitoring | Netdata, Prometheus, Grafana |
| File Manager | File Browser |

### Installing Plugins

1. Navigate to **Plugins** → **Marketplace**
2. Browse or search for the service you need
3. Click **Install** to begin installation
4. Monitor progress in the **Installed** tab

### Plugin Installation Methods

Plugins support two installation modes:

1. **Docker Mode** (Recommended)
   - Plugins run in isolated containers
   - Easy updates and rollbacks
   - No system conflicts

2. **Native Mode**
   - Direct apt-get installation
   - Lower overhead
   - Full system integration

---

## Post-Installation Checklist

- [ ] Change default admin password
- [ ] Configure 2FA for admin accounts
- [ ] Set up SSL certificates
- [ ] Install required service plugins
- [ ] Create additional user accounts
- [ ] Configure backup schedules
- [ ] Set up monitoring alerts

---

## Troubleshooting

### Docker Issues

```bash
# View container logs
docker compose logs amp-panel

# Restart services
docker compose restart

# Reset everything
docker compose down -v
docker compose up -d
```

### Ubuntu Issues

```bash
# Check service status
sudo systemctl status amp-panel

# View logs
sudo journalctl -u amp-panel -f

# Restart service
sudo systemctl restart amp-panel
```

### Common Problems

1. **Port 80/443 in use**
   - Check: `sudo lsof -i :80`
   - Stop conflicting service or use different ports

2. **Database connection failed**
   - Verify PostgreSQL is running: `sudo systemctl status postgresql`
   - Check credentials in `.env` file

3. **Plugins not installing**
   - Ensure Docker socket is mounted (Docker mode)
   - Check user has sudo privileges (Native mode)

---

## Support

- GitHub Issues: [github.com/amp-panel/amp-panel/issues](https://github.com/amp-panel/amp-panel/issues)
- Documentation: [docs.amp-panel.io](https://docs.amp-panel.io)
- Community Discord: [discord.gg/amp-panel](https://discord.gg/amp-panel)

---

## License

AMP Panel is open-source software licensed under the MIT License.
