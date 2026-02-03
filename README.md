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

## Quick Start

### Docker (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/amp-panel/amp-panel/main/scripts/install-docker.sh | bash
```

### Ubuntu Server

```bash
curl -fsSL https://raw.githubusercontent.com/amp-panel/amp-panel/main/scripts/install-ubuntu.sh | sudo bash
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
