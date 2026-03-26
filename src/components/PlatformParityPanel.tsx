import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Layers3, Shield } from "lucide-react";

const platforms = ["Web", "Linux", "Docker"] as const;

const capabilityGroups = [
  {
    title: "Core control planes",
    items: [
      "DNS lifecycle management",
      "Email lifecycle management",
      "SSL lifecycle management",
      "Account/package/quota management",
      "One-click app installer",
    ],
  },
  {
    title: "Operational depth",
    items: [
      "Backup and restore depth (preview, PITR, verification)",
      "Monitoring and incident actions",
      "File management with deployment workflows",
      "Service management and OS admin actions",
    ],
  },
  {
    title: "Security baseline",
    items: [
      "Security hardening playbooks",
      "Firewall controls",
      "WAF integration",
      "Vulnerability scanning",
      "Malware + secret scanning",
      "Login geo-alerting and IP reputation",
      "Immutable audit trails",
    ],
  },
] as const;

export function PlatformParityPanel() {
  return (
    <Card className="glass-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers3 className="h-5 w-5 text-primary" />
          Platform parity (Web / Linux / Docker)
        </CardTitle>
        <CardDescription>
          Unified capability contract so all platform targets expose the same operational surface.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {capabilityGroups.map((group) => (
          <div key={group.title} className="rounded-lg border border-border p-4">
            <div className="mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-info" />
              <h4 className="font-semibold">{group.title}</h4>
            </div>
            <div className="space-y-2">
              {group.items.map((item) => (
                <div key={item} className="flex flex-col gap-2 rounded-md border border-border/70 bg-background/40 p-3 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm text-foreground">{item}</p>
                  <div className="flex flex-wrap gap-2">
                    {platforms.map((platform) => (
                      <Badge key={`${item}-${platform}`} variant="outline" className="bg-success/15 text-success border-success/30">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
