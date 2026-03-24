# AMP Panel Installation Guide

AMP Panel is a modern server control panel for managing web hosting services. This guide covers installation on both Ubuntu Server and Docker.

## Recommended First Server

For the best first-time experience, use a fresh server with:

- **Ubuntu 24.04 LTS** or **Ubuntu 22.04 LTS**
- **4 vCPU / 8 GB RAM / 80 GB SSD** minimum recommended
- 1 public IPv4 address
- Ports **80** and **443** open
- Root or sudo access

Start with a dedicated panel VM first. After the panel is stable, install modules/plugins such as web, email, FTP, SSL, Node.js, PHP runtimes, AI/automation, backups, firewall, and logs from the built-in marketplace.

## Prerequisites

- Git installed
- Domain name pointed to your server (recommended)

---

## Quick Start

### Step 1: Clone the Repository

```bash
git clone https://github.com/pranto48/amppanel.git
cd amppanel
```

### Step 2: Choose Your Installation Method

**Recommended order for first deployment:**
1. Start with Docker if you want the fastest, safest install path.
2. Use the Ubuntu script when you prefer direct host installation.
3. After login, go to **Getting Started** and **Plugins** inside the panel to enable the modules you want.


#### Option A: Docker (Recommended)

```bash
docker-compose up --build -d
```

That's it! Your AMP Panel is now running.

#### Option B: Ubuntu Server

```bash
sudo bash scripts/install-ubuntu.sh
```

### Step 3: Access AMP Panel

Open your browser and navigate to:
- `http://your-server-ip` or `http://your-domain.com`

**Default login credentials:**
- **Email:** `admin_amp@localhost`
- **Password:** `Amp_Password`

> ⚠️ **Important:** Change these credentials immediately after first login!

---

## Detailed Installation

### Docker Installation (Recommended)

Docker provides the fastest and most consistent installation experience.

#### Prerequisites

If Docker is not installed, run:

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

#### Installation Steps

```bash
# Clone the repository
git clone https://github.com/pranto48/amppanel.git
cd amppanel

# Start all services
docker compose up --build -d

# View logs
docker compose logs -f

# Check status
docker compose ps

# Monitor resource usage
docker stats
```

#### Configuration

Create a `.env` file to customize your installation:

```bash
# AMP Panel Configuration
AMP_DOMAIN=your-domain.com
AMP_ADMIN_EMAIL=admin_amp@localhost

# Port Configuration (change if defaults are in use)
AMP_HTTP_PORT=8880
AMP_HTTPS_PORT=8443

# Database
DB_PASSWORD=your-secure-password-here

# Resource Limits (optional)
AMP_PANEL_CPU_LIMIT=1.0
AMP_PANEL_MEMORY_LIMIT=512M
POSTGRES_CPU_LIMIT=1.0
POSTGRES_MEMORY_LIMIT=1G
REDIS_CPU_LIMIT=0.5
REDIS_MEMORY_LIMIT=256M

# Supabase (provided by your AMP Panel license)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

**Access URL:** `http://localhost:8880` (or your configured port)

---

### Ubuntu Server Installation

For direct installation on Ubuntu 22.04 LTS or newer.

#### Quick Install

```bash
# Clone the repository
git clone https://github.com/pranto48/amppanel.git
cd amppanel

# Run the installer
sudo bash scripts/install-ubuntu.sh
```

The installer will automatically:
- Update system packages
- Install Node.js, Docker, and dependencies
- Configure PostgreSQL and Redis
- Set up Nginx reverse proxy
- Create systemd service
- Start AMP Panel

#### Manual Installation

If you prefer manual installation, follow these steps:

**Step 1: Update System**

```bash
sudo apt update && sudo apt upgrade -y
```

**Step 2: Install Dependencies**

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

**Step 3: Build AMP Panel**

```bash
cd /opt/amppanel  # or your cloned directory
bun install
bun run build
```

**Step 4: Configure PostgreSQL**

```bash
sudo -u postgres psql << EOF
CREATE USER amp WITH PASSWORD 'your-secure-password';
CREATE DATABASE amp_panel OWNER amp;
GRANT ALL PRIVILEGES ON DATABASE amp_panel TO amp;
EOF
```

**Step 5: Configure Nginx**

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

**Step 6: Configure SSL (Recommended)**

```bash
sudo certbot --nginx -d your-domain.com
```

**Step 7: Create Systemd Service**

Create `/etc/systemd/system/amp-panel.service`:

```ini
[Unit]
Description=AMP Panel
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/amppanel
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node /opt/amppanel/dist/server.js
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
