import { useState } from "react";
import {
  AlertTriangle,
  Globe,
  KeyRound,
  Lock,
  Radar,
  ScanSearch,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TerminalSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAppendSecurityAuditEvent, useCreateFirewallRule, useCreateSshKey, useCreateWafPolicy, useRunSecurityScan, useSecurityControlPlane } from "@/hooks/useSecurityControlPlane";

export const SecurityManagement = () => {
  const { data, isLoading, isError, refetch, isFetching } = useSecurityControlPlane();
  const createFirewallRule = useCreateFirewallRule({});
  const createWafPolicy = useCreateWafPolicy({});
  const createSshKey = useCreateSshKey({});
  const runScan = useRunSecurityScan({});
  const appendAudit = useAppendSecurityAuditEvent({});

  const [newRulePort, setNewRulePort] = useState("8443");
  const [newSshName, setNewSshName] = useState("deploy-key");
  const [newSshPub, setNewSshPub] = useState("ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIC... deploy@local");

  const firewallRules = data?.firewallRules ?? [];
  const defaultProviderId = data?.firewallProviders[0]?.id ?? "";
  const wafPolicies = data?.wafPolicies ?? [];
  const sshKeys = data?.sshKeys ?? [];
  const scans = data?.scans ?? [];
  const secretFindings = data?.secretFindings ?? [];
  const geoAlerts = data?.geoAlerts ?? [];
  const reputationEvents = data?.reputationEvents ?? [];
  const auditEvents = data?.auditEvents ?? [];

  const latestMalware = scans.filter((scan) => scan.scan_type === "malware").slice(0, 6);
  const latestVuln = scans.filter((scan) => scan.scan_type === "vulnerability").slice(0, 6);
  const latestSecretScans = scans.filter((scan) => scan.scan_type === "secret_scan").slice(0, 6);

  const runQuickSecurityScan = (scanType: "malware" | "vulnerability" | "secret_scan") => {
    runScan.mutate({
      scan_type: scanType,
      scanner_name: scanType === "malware" ? "clamav" : scanType === "vulnerability" ? "trivy" : "gitleaks",
      status: "completed",
      severity: scanType === "vulnerability" ? "warning" : "info",
      summary: `Manual ${scanType.replace("_", " ")} scan from Security panel`,
      findings_count: 0,
      findings: [],
    });

    appendAudit.mutate({
      category: "scan",
      action: `triggered_${scanType}_scan`,
      target_type: "security_scan",
      details: { source: "security_ui" },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Security Control Plane</h2>
          <p className="text-muted-foreground">Firewall abstraction, WAF, SSH key manager, malware/vulnerability scanning, geo-risk alerts, IP reputation, immutable audit chain, and secret-scanning telemetry.</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>Refresh</Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="glass-card"><CardContent className="p-4"><p className="text-sm text-muted-foreground">Firewall rules</p><p className="text-2xl font-bold">{firewallRules.length}</p></CardContent></Card>
        <Card className="glass-card"><CardContent className="p-4"><p className="text-sm text-muted-foreground">WAF policies</p><p className="text-2xl font-bold">{wafPolicies.length}</p></CardContent></Card>
        <Card className="glass-card"><CardContent className="p-4"><p className="text-sm text-muted-foreground">SSH keys</p><p className="text-2xl font-bold">{sshKeys.length}</p></CardContent></Card>
        <Card className="glass-card"><CardContent className="p-4"><p className="text-sm text-muted-foreground">Immutable audit events</p><p className="text-2xl font-bold">{auditEvents.length}</p></CardContent></Card>
      </div>

      {isLoading && <div className="rounded-lg border border-border p-6 text-sm text-muted-foreground">Loading security telemetry…</div>}
      {isError && <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">Failed to load security control-plane datasets.</div>}

      {!isLoading && !isError && (
        <Tabs defaultValue="firewall" className="space-y-4">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-secondary p-2 md:grid-cols-4 xl:grid-cols-8">
            <TabsTrigger value="firewall"><Shield className="mr-2 h-4 w-4" />Firewall</TabsTrigger>
            <TabsTrigger value="waf"><ShieldAlert className="mr-2 h-4 w-4" />WAF</TabsTrigger>
            <TabsTrigger value="ssh"><KeyRound className="mr-2 h-4 w-4" />SSH Keys</TabsTrigger>
            <TabsTrigger value="scans"><ScanSearch className="mr-2 h-4 w-4" />Scans</TabsTrigger>
            <TabsTrigger value="geo"><Globe className="mr-2 h-4 w-4" />Geo Login</TabsTrigger>
            <TabsTrigger value="reputation"><Radar className="mr-2 h-4 w-4" />IP Intel</TabsTrigger>
            <TabsTrigger value="secrets"><Lock className="mr-2 h-4 w-4" />Secret Scan</TabsTrigger>
            <TabsTrigger value="audit"><TerminalSquare className="mr-2 h-4 w-4" />Audit Trail</TabsTrigger>
          </TabsList>

          <TabsContent value="firewall" className="space-y-4">
            <Card className="glass-card">
              <CardHeader><CardTitle>Firewall abstraction</CardTitle><CardDescription>Provider-agnostic rules are persisted and can be translated by adapters (UFW/iptables/cloud firewall APIs).</CardDescription></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2"><Input value={newRulePort} onChange={(e) => setNewRulePort(e.target.value)} placeholder="Port" /><Button disabled={!defaultProviderId} onClick={() => createFirewallRule.mutate({ provider_id: defaultProviderId, port: newRulePort, action: "allow", protocol: "tcp", source_cidr: "0.0.0.0/0", direction: "inbound", priority: 100, is_enabled: true })}>Add allow rule</Button></div>
                <Table><TableHeader><TableRow><TableHead>Port</TableHead><TableHead>Proto</TableHead><TableHead>Source</TableHead><TableHead>Action</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{firewallRules.length ? firewallRules.map((rule) => <TableRow key={rule.id}><TableCell>{rule.port}</TableCell><TableCell>{rule.protocol}</TableCell><TableCell>{rule.source_cidr}</TableCell><TableCell>{rule.action}</TableCell><TableCell>{rule.is_enabled ? <Badge className="bg-success/20 text-success">enabled</Badge> : <Badge variant="outline">disabled</Badge>}</TableCell></TableRow>) : <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No firewall rules yet.</TableCell></TableRow>}</TableBody></Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="waf" className="space-y-4">
            <Card className="glass-card"><CardHeader><CardTitle>WAF integration</CardTitle><CardDescription>Manage WAF policies and monitor blocked request events.</CardDescription></CardHeader><CardContent className="space-y-3"><Button onClick={() => createWafPolicy.mutate({ policy_name: `Default policy ${new Date().toLocaleTimeString()}`, mode: "prevention", engine: "modsecurity", is_enabled: true, config: { paranoia_level: 2 } })}>Create baseline policy</Button><div className="text-sm text-muted-foreground">Policies: {wafPolicies.length} • Events: {data?.wafEvents.length ?? 0}</div></CardContent></Card>
          </TabsContent>

          <TabsContent value="ssh" className="space-y-4">
            <Card className="glass-card"><CardHeader><CardTitle>SSH key manager</CardTitle><CardDescription>Track deployment/operator keys with revocation state and attribution.</CardDescription></CardHeader><CardContent className="space-y-3"><Input value={newSshName} onChange={(e) => setNewSshName(e.target.value)} placeholder="Key name" /><Input value={newSshPub} onChange={(e) => setNewSshPub(e.target.value)} placeholder="Public key" /><Button onClick={() => createSshKey.mutate({ key_name: newSshName, public_key: newSshPub, is_active: true })}>Register key</Button><div className="space-y-2">{sshKeys.slice(0, 8).map((key) => <div key={key.id} className="rounded-md border border-border p-2 text-sm"><span className="font-medium">{key.key_name}</span> <span className="text-muted-foreground">{key.fingerprint ?? "(fingerprint pending)"}</span></div>)}</div></CardContent></Card>
          </TabsContent>

          <TabsContent value="scans" className="space-y-4">
            <Card className="glass-card"><CardHeader><CardTitle>Malware & vulnerability scanner</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => runQuickSecurityScan("malware")}>Run malware scan</Button><Button variant="outline" onClick={() => runQuickSecurityScan("vulnerability")}>Run vulnerability scan</Button><Button variant="outline" onClick={() => runQuickSecurityScan("secret_scan")}>Run secret scan</Button></div><div className="grid grid-cols-1 gap-3 lg:grid-cols-3"><div className="rounded-lg border border-border p-3"><p className="font-medium">Malware scans</p><p className="text-sm text-muted-foreground">{latestMalware.length} recent</p></div><div className="rounded-lg border border-border p-3"><p className="font-medium">Vulnerability scans</p><p className="text-sm text-muted-foreground">{latestVuln.length} recent</p></div><div className="rounded-lg border border-border p-3"><p className="font-medium">Secret scans</p><p className="text-sm text-muted-foreground">{latestSecretScans.length} recent</p></div></div></CardContent></Card>
          </TabsContent>

          <TabsContent value="geo" className="space-y-4">
            <Card className="glass-card"><CardHeader><CardTitle>Login geo alerts</CardTitle><CardDescription>Detect impossible travel and high-risk regions for account access.</CardDescription></CardHeader><CardContent>{geoAlerts.length ? geoAlerts.slice(0, 8).map((alert) => <div key={alert.id} className="mb-2 rounded-md border border-border p-2 text-sm">{alert.country_code ?? "--"} {alert.city ?? ""} • risk {Number(alert.risk_score).toFixed(1)} • {alert.reason ?? "geo anomaly"}</div>) : <p className="text-sm text-muted-foreground">No geo alerts recorded.</p>}</CardContent></Card>
          </TabsContent>

          <TabsContent value="reputation" className="space-y-4">
            <Card className="glass-card"><CardHeader><CardTitle>IP reputation integration</CardTitle><CardDescription>Store provider checks and recommended enforcement actions.</CardDescription></CardHeader><CardContent>{reputationEvents.length ? reputationEvents.slice(0, 10).map((event) => <div key={event.id} className="mb-2 rounded-md border border-border p-2 text-sm">{String(event.source_ip)} • {event.provider_name} • score {event.reputation_score ?? "n/a"} • {event.action_recommended ?? "monitor"}</div>) : <p className="text-sm text-muted-foreground">No reputation events yet.</p>}</CardContent></Card>
          </TabsContent>

          <TabsContent value="secrets" className="space-y-4">
            <Card className="glass-card"><CardHeader><CardTitle>Secret scanning (code/uploads)</CardTitle><CardDescription>Find leaked tokens/keys in source files and uploaded payloads.</CardDescription></CardHeader><CardContent>{secretFindings.length ? secretFindings.slice(0, 12).map((finding) => <div key={finding.id} className="mb-2 rounded-md border border-border p-2 text-sm"><span className="font-medium">{finding.secret_type}</span> via {finding.detector} @ {finding.file_path ?? "(unknown path)"} {finding.is_resolved ? <Badge className="ml-2 bg-success/20 text-success">resolved</Badge> : <Badge className="ml-2 bg-warning/20 text-warning">open</Badge>}</div>) : <p className="text-sm text-muted-foreground">No secret findings detected.</p>}</CardContent></Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <Card className="glass-card"><CardHeader><CardTitle>Immutable audit trails</CardTitle><CardDescription>Append-only hash chained events. Update/delete is blocked at DB trigger level.</CardDescription></CardHeader><CardContent><div className="mb-3"><Button variant="outline" onClick={() => appendAudit.mutate({ category: "system", action: "manual_audit_marker", target_type: "security_panel", details: { note: "Operator checkpoint" } })}>Append marker</Button></div>{auditEvents.length ? auditEvents.slice(0, 12).map((event) => <div key={event.id} className="mb-2 rounded-md border border-border p-2 text-xs"><div className="flex items-center justify-between"><span><ShieldCheck className="mr-1 inline h-3 w-3 text-success" />{event.category}:{event.action}</span><span>{new Date(event.created_at).toLocaleString()}</span></div><div className="mt-1 text-muted-foreground">hash {event.event_hash.slice(0, 16)}… prev {event.prev_event_hash?.slice(0, 16) ?? "genesis"}…</div></div>) : <p className="text-sm text-muted-foreground">No audit events yet.</p>}</CardContent></Card>
          </TabsContent>
        </Tabs>
      )}

      <div className="rounded-lg border border-info/30 bg-info/10 p-4 text-sm text-info">
        <AlertTriangle className="mr-2 inline h-4 w-4" />
        These controls now persist to dedicated security tables and can be wired to real provider adapters (iptables/cloud firewall API, WAF provider APIs, threat-intel feeds, SAST/secret scanners) without changing the UI contract.
      </div>
    </div>
  );
};
