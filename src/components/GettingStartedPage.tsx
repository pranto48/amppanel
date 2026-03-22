import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Box, Cpu, HardDrive, Mail, Network, Rocket, Shield } from "lucide-react";

const installCommands = {
  docker: `git clone https://github.com/pranto48/amppanel.git\ncd amppanel\ncp .env.example .env  # if available, otherwise create .env\ndocker compose up --build -d\ndocker compose ps`,
  ubuntu: `git clone https://github.com/pranto48/amppanel.git\ncd amppanel\nsudo bash scripts/install-ubuntu.sh`,
};

const moduleGroups = [
  { title: "Web stack", icon: Rocket, items: ["Sites", "SSL", "PHP versions", "Node.js apps", "Logs"] },
  { title: "Mail", icon: Mail, items: ["Mailboxes", "SMTP relay", "DKIM/SPF/DMARC", "Queue", "Quarantine"] },
  { title: "Network & DNS", icon: Network, items: ["DNS zones", "Glue / secondary DNS", "Firewall", "Monitoring"] },
  { title: "Operations", icon: Box, items: ["Backups", "FTP", "Plugins", "AI / automation", "Terminal"] },
];

export function GettingStartedPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Getting Started</h2>
          <p className="text-muted-foreground">Recommended first-server sizing, Linux/Docker install path, and the core modules you can enable after first boot.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" asChild><a href="/docs/INSTALLATION.md" target="_blank" rel="noreferrer"><BookOpen className="w-4 h-4 mr-2" />Installation docs</a></Button>
          <Button asChild><a href="/README.md" target="_blank" rel="noreferrer">Open README</a></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2"><Cpu className="w-5 h-5 text-primary" /><h3 className="font-semibold">Recommended first server</h3></div>
          <p className="text-sm text-muted-foreground">Ubuntu 24.04 LTS or Debian 12, 4 vCPU, 8 GB RAM, 80 GB NVMe SSD, public IPv4, and a clean host with ports 80/443 available.</p>
          <div className="flex gap-2 flex-wrap"><Badge variant="outline">4 vCPU</Badge><Badge variant="outline">8 GB RAM</Badge><Badge variant="outline">80 GB SSD</Badge></div>
        </div>
        <div className="glass-card rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2"><HardDrive className="w-5 h-5 text-warning" /><h3 className="font-semibold">Recommended layout</h3></div>
          <p className="text-sm text-muted-foreground">Keep the panel on its own VM first. Add mail, DNS, backups, and database modules after the base panel is stable and snapshots are configured.</p>
          <div className="flex gap-2 flex-wrap"><Badge variant="outline">Dedicated VM</Badge><Badge variant="outline">Snapshots</Badge><Badge variant="outline">Reverse proxy</Badge></div>
        </div>
        <div className="glass-card rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2"><Shield className="w-5 h-5 text-success" /><h3 className="font-semibold">First boot checklist</h3></div>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li>Change default admin credentials immediately.</li>
            <li>Point a domain and enable TLS.</li>
            <li>Install required plugins/modules only.</li>
            <li>Configure backups before production use.</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2"><Box className="w-5 h-5 text-primary" /><h3 className="font-semibold">Docker installation</h3><Badge variant="outline">Recommended</Badge></div>
          <p className="text-sm text-muted-foreground">Best for fast installs, predictable upgrades, and easy rollbacks on a new server.</p>
          <pre className="rounded-lg bg-secondary border border-border p-4 text-xs overflow-x-auto"><code>{installCommands.docker}</code></pre>
          <p className="text-xs text-muted-foreground">After startup, visit the panel URL, sign in with the bootstrap admin, and then install only the modules you need from the Plugins page.</p>
        </div>
        <div className="glass-card rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2"><Rocket className="w-5 h-5 text-info" /><h3 className="font-semibold">Linux / Ubuntu installation</h3><Badge variant="outline">Bare metal / VM</Badge></div>
          <p className="text-sm text-muted-foreground">Use this when you want a direct host install with the included Ubuntu helper script.</p>
          <pre className="rounded-lg bg-secondary border border-border p-4 text-xs overflow-x-auto"><code>{installCommands.ubuntu}</code></pre>
          <p className="text-xs text-muted-foreground">Recommended OS: Ubuntu Server 22.04+ or 24.04 LTS. Start with one host, validate backups and SSL, then expand services.</p>
        </div>
      </div>

      <div className="glass-card rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2"><Network className="w-5 h-5 text-primary" /><h3 className="font-semibold">Module & plugin roadmap</h3></div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {moduleGroups.map((group) => {
            const Icon = group.icon;
            return (
              <div key={group.title} className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center gap-2"><Icon className="w-4 h-4 text-primary" /><h4 className="font-medium">{group.title}</h4></div>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => <Badge key={item} variant="secondary">{item}</Badge>)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
