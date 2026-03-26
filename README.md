# AMP Panel

A modern, open-source server control panel for managing web hosting services. Built with React, TypeScript, and Supabase.

![AMP Panel](https://img.shields.io/badge/version-1.0.0-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## Features

- 🖥️ **Dashboard** - Real-time server metrics (CPU, Memory, Disk, Network)
- 🌐 **Site Management** - Manage domains, subdomains, and SSL certificates
- 📦 **Plugin Marketplace** - Install services on-demand (Nginx, MySQL, FTP, Email, etc.)
- 📁 **File Manager** - Web-based file browser with code editor
- 🗄️ **Database Management** - MySQL, PostgreSQL, MariaDB support
- 📧 **Email Management** - Create accounts, forwarders, and autoresponders
- 🔒 **Security** - 2FA, Fail2Ban, SSL management
- 💾 **Backups** - Scheduled and manual backups with retention policies
- 📊 **Monitoring** - Real-time metrics and historical charts
- 👥 **User Management** - Role-based access control
- 🖥️ **Terminal** - Web-based terminal emulator

## Recommended First Server

For the easiest first production deployment, start with:

- **OS:** Ubuntu Server 24.04 LTS or 22.04 LTS
- **Size:** 4 vCPU, 8 GB RAM, 80 GB NVMe SSD
- **Network:** 1 public IPv4, ports 80/443 open
- **Topology:** One dedicated VM for the panel first, then add modules/plugins as needed

This gives enough headroom to run the panel plus common modules such as web, mail, DNS, backup, firewall, and logs.

## Installation Flow

1. Provision a clean Linux VM or Docker host.
2. Install AMP Panel with **Docker Compose** or the **Ubuntu install script**.
3. Sign in with the bootstrap admin account and immediately rotate credentials.
4. Install only the modules you need from **Plugins** (web, email, FTP, SSL, Node.js, PHP versions, backups, firewall, logs, AI/automation).
5. Configure domains, SSL, backups, and monitoring before onboarding live sites.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/pranto48/amppanel.git
cd amppanel
```

### Docker (Recommended)

```bash
docker-compose up --build -d
# Default URL: http://localhost:8880 (unless AMP_HTTP_PORT is overridden)
```

### Ubuntu Server

```bash
sudo bash scripts/install-ubuntu.sh
# Default URL: http://<server-ip>:8880 (unless AMP_HTTP_PORT is overridden)
```

### Runtime Health Check (Linux + Docker)

```bash
bash scripts/check-runtime.sh
```

## Documentation

- [Installation Guide](docs/INSTALLATION.md)
- [Plugin Development](docs/PLUGINS.md)
- [API Reference](docs/API.md)

## Default Credentials

After installation, use these credentials for first login:

- **Email:** `admin_amp@localhost`
- **Password:** `Amp_Password`

> ⚠️ **Important:** Change these credentials immediately after first login!

## Plugin Marketplace

Install services on-demand from the built-in marketplace:

| Category | Available Plugins |
|----------|------------------|
| Web Servers | Nginx, Apache |
| FTP | VSFTPD, ProFTPD |
| Email | Postfix, Dovecot |
| DNS | BIND9, PowerDNS |
| Databases | MySQL, MariaDB, PostgreSQL, Redis |
| Backup | Restic, Duplicity |
| Security | Fail2Ban, Certbot |
| Monitoring | Netdata, Prometheus, Grafana |
| File Manager | File Browser |

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions)
- **Build:** Vite, Bun

## Development

```bash
# Clone repository
git clone https://github.com/amp-panel/amp-panel.git
cd amp-panel

# Install dependencies
bun install

# Start development server
bun run dev
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- [GitHub Issues](https://github.com/amp-panel/amp-panel/issues)
- [Documentation](https://docs.amp-panel.io)
- [Discord Community](https://discord.gg/amp-panel)
