import { type ElementType, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  Globe,
  Link,
  Mail,
  Plus,
  Radio,
  RefreshCw,
  Save,
  Search,
  Server,
  ShieldCheck,
  Trash2,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  type DnsRecordInput,
  type DnsRecordType,
  type DnsZone,
  useApplyDnsTemplate,
  useCreateDnsZone,
  useDeleteDnsRecord,
  useDnsClusters,
  useDnsTemplates,
  useDnsZones,
  useRunDnsPropagationCheck,
  useSaveDnsGlue,
  useSaveDnsRecord,
  useSaveDnsSecondary,
} from "@/hooks/useDnsControlPlane";

const emptyRecordForm: DnsRecordInput = {
  type: "A",
  name: "@",
  content: "",
  ttl: 3600,
  priority: 10,
  weight: 10,
  port: 443,
  target: "",
  proxied: false,
  is_glue: false,
};

const recordTypeIcons: Record<string, ElementType> = {
  A: Server,
  AAAA: Server,
  CNAME: Link,
  MX: Mail,
  TXT: FileText,
  NS: Globe,
  SRV: Workflow,
  CAA: ShieldCheck,
  PTR: Radio,
};

const recordTypeColors: Record<string, string> = {
  A: "bg-primary/20 text-primary border-primary/30",
  AAAA: "bg-primary/20 text-primary border-primary/30",
  CNAME: "bg-info/20 text-info border-info/30",
  MX: "bg-warning/20 text-warning border-warning/30",
  TXT: "bg-success/20 text-success border-success/30",
  NS: "bg-muted text-muted-foreground border-border",
  SRV: "bg-secondary text-secondary-foreground border-border",
  CAA: "bg-success/20 text-success border-success/30",
  PTR: "bg-muted text-muted-foreground border-border",
};

function formatTtl(ttl: number) {
  if (ttl >= 86400) return `${ttl / 86400}d`;
  if (ttl >= 3600) return `${ttl / 3600}h`;
  if (ttl >= 60) return `${ttl / 60}m`;
  return `${ttl}s`;
}

function statusBadge(status: string) {
  switch (status) {
    case "active":
    case "healthy":
      return <Badge variant="outline" className="bg-success/20 text-success border-success/30"><CheckCircle2 className="w-3 h-3 mr-1" />{status}</Badge>;
    case "pending":
    case "warning":
      return <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30"><Clock3 className="w-3 h-3 mr-1" />{status}</Badge>;
    default:
      return <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/30"><AlertCircle className="w-3 h-3 mr-1" />{status}</Badge>;
  }
}

function inferRecordPlaceholder(type: DnsRecordType) {
  switch (type) {
    case "A": return "198.51.100.10";
    case "AAAA": return "2001:db8::10";
    case "CNAME": return "edge.example.net";
    case "MX": return "mail.example.com";
    case "TXT": return "v=spf1 include:_spf.google.com ~all";
    case "NS": return "ns1.amp-dns.com";
    case "CAA": return "0 issue \"letsencrypt.org\"";
    case "PTR": return "host.example.com";
    default: return "value";
  }
}

export const DNSManager = () => {
  const { toast } = useToast();
  const zonesQuery = useDnsZones();
  const templatesQuery = useDnsTemplates();
  const clustersQuery = useDnsClusters();
  const createZone = useCreateDnsZone();
  const saveRecord = useSaveDnsRecord();
  const deleteRecord = useDeleteDnsRecord();
  const saveGlue = useSaveDnsGlue();
  const saveSecondary = useSaveDnsSecondary();
  const runPropagation = useRunDnsPropagationCheck();
  const applyTemplate = useApplyDnsTemplate();

  const zones = zonesQuery.data ?? [];
  const templates = templatesQuery.data ?? [];
  const clusters = clustersQuery.data ?? [];

  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [recordForm, setRecordForm] = useState<DnsRecordInput>(emptyRecordForm);
  const [templateId, setTemplateId] = useState<string>("");
  const [glueForm, setGlueForm] = useState({ hostname: "", ipv4: "", ipv6: "" });
  const [secondaryForm, setSecondaryForm] = useState({ hostname: "", ipv4: "", ipv6: "" });

  useEffect(() => {
    if (!selectedZoneId && zones[0]?.id) setSelectedZoneId(zones[0].id);
    if (selectedZoneId && !zones.some((zone) => zone.id === selectedZoneId)) {
      setSelectedZoneId(zones[0]?.id ?? null);
    }
  }, [zones, selectedZoneId]);

  const selectedZone = useMemo(() => zones.find((zone) => zone.id === selectedZoneId) ?? null, [zones, selectedZoneId]);

  const filteredRecords = useMemo(() => {
    if (!selectedZone) return [];
    return selectedZone.dns_records.filter((record) =>
      [record.type, record.name, record.content].some((value) => value.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [selectedZone, searchQuery]);

  const totalRecords = zones.reduce((sum, zone) => sum + zone.dns_records.length, 0);
  const pendingChecks = zones.reduce((sum, zone) => sum + zone.dns_propagation_checks.filter((check) => check.status === "pending" || check.status === "warning").length, 0);

  const openCreateRecord = (record?: DnsZone["dns_records"][number]) => {
    setRecordForm(record ? {
      id: record.id,
      type: record.type,
      name: record.name,
      content: record.content,
      ttl: record.ttl,
      priority: record.priority,
      weight: record.weight,
      port: record.port,
      target: record.target,
      proxied: record.proxied,
      is_glue: record.is_glue,
    } : emptyRecordForm);
    setRecordDialogOpen(true);
  };

  const handleSaveRecord = async () => {
    if (!selectedZone) return;
    try {
      await saveRecord.mutateAsync({ zone_id: selectedZone.id, record_id: recordForm.id, payload: recordForm });
      setRecordDialogOpen(false);
      toast({ title: recordForm.id ? "Record updated" : "Record created", description: "Authoritative DNS has been queued for validation and propagation." });
    } catch (error) {
      toast({ variant: "destructive", title: "Unable to save record", description: error instanceof Error ? error.message : "Unknown error" });
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!selectedZone) return;
    try {
      await deleteRecord.mutateAsync({ zone_id: selectedZone.id, record_id: recordId });
      toast({ title: "Record deleted", description: "The record was removed from the zone serial." });
    } catch (error) {
      toast({ variant: "destructive", title: "Delete failed", description: error instanceof Error ? error.message : "Unknown error" });
    }
  };

  const handleRunPropagation = async () => {
    if (!selectedZone) return;
    try {
      await runPropagation.mutateAsync({ zone_id: selectedZone.id });
      toast({ title: "Propagation check complete", description: "Resolvers were sampled and the latest observations were stored." });
    } catch (error) {
      toast({ variant: "destructive", title: "Propagation check failed", description: error instanceof Error ? error.message : "Unknown error" });
    }
  };

  const handleApplyTemplate = async () => {
    if (!selectedZone || !templateId) return;
    try {
      await applyTemplate.mutateAsync({ zone_id: selectedZone.id, template_id: templateId });
      toast({ title: "Template applied", description: "Template records were materialized into the zone." });
    } catch (error) {
      toast({ variant: "destructive", title: "Template failed", description: error instanceof Error ? error.message : "Unknown error" });
    }
  };

  const handleCreateZone = async () => {
    const siteId = selectedZone?.site_id;
    if (!siteId) {
      toast({ variant: "destructive", title: "No site context", description: "Create zones from a site-linked zone context after sites are present." });
      return;
    }
    try {
      await createZone.mutateAsync({ site_id: siteId });
      toast({ title: "Zone ensured", description: "A primary zone now exists for the linked site." });
    } catch (error) {
      toast({ variant: "destructive", title: "Zone creation failed", description: error instanceof Error ? error.message : "Unknown error" });
    }
  };

  const handleSaveGlue = async () => {
    if (!selectedZone) return;
    try {
      await saveGlue.mutateAsync({ zone_id: selectedZone.id, payload: glueForm });
      setGlueForm({ hostname: "", ipv4: "", ipv6: "" });
      toast({ title: "Glue record saved", description: "Child nameserver glue is ready for registrar delegation." });
    } catch (error) {
      toast({ variant: "destructive", title: "Glue save failed", description: error instanceof Error ? error.message : "Unknown error" });
    }
  };

  const handleSaveSecondary = async () => {
    if (!selectedZone) return;
    try {
      await saveSecondary.mutateAsync({ zone_id: selectedZone.id, payload: secondaryForm });
      setSecondaryForm({ hostname: "", ipv4: "", ipv6: "" });
      toast({ title: "Secondary nameserver saved", description: "Zone transfer metadata has been updated for this secondary." });
    } catch (error) {
      toast({ variant: "destructive", title: "Secondary save failed", description: error instanceof Error ? error.message : "Unknown error" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">DNS Control Plane</h2>
          <p className="text-muted-foreground">Manage authoritative zones, reusable templates, glue, secondary DNS, and propagation validation from live Supabase data.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => zonesQuery.refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />Refresh
          </Button>
          <Button onClick={handleRunPropagation} disabled={!selectedZone || runPropagation.isPending}>
            <Radio className="w-4 h-4 mr-2" />Run propagation check
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4"><p className="text-2xl font-bold">{zones.length}</p><p className="text-sm text-muted-foreground">Zones</p></div>
        <div className="glass-card rounded-xl p-4"><p className="text-2xl font-bold">{totalRecords}</p><p className="text-sm text-muted-foreground">Records</p></div>
        <div className="glass-card rounded-xl p-4"><p className="text-2xl font-bold">{templates.length}</p><p className="text-sm text-muted-foreground">Templates</p></div>
        <div className="glass-card rounded-xl p-4"><p className="text-2xl font-bold">{pendingChecks}</p><p className="text-sm text-muted-foreground">Checks needing review</p></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-1 glass-card rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Zones</h3>
            <Badge variant="outline">{clusters.length} clusters</Badge>
          </div>
          {zones.map((zone) => (
            <button
              key={zone.id}
              onClick={() => setSelectedZoneId(zone.id)}
              className={`w-full rounded-lg border p-3 text-left transition-colors ${selectedZone?.id === zone.id ? "border-primary bg-primary/10" : "border-border hover:bg-muted/40"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{zone.origin}</span>
                {statusBadge(zone.status)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Serial {zone.serial} • {zone.dns_records.length} records • {zone.zone_type}</p>
              <p className="text-xs text-muted-foreground mt-1">{zone.primary_nameserver} • {zone.dns_clusters?.name ?? "Unassigned cluster"}</p>
            </button>
          ))}
        </div>

        <div className="xl:col-span-3 space-y-4">
          {selectedZone ? (
            <>
              <div className="glass-card rounded-xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-semibold">{selectedZone.origin}</h3>
                    {statusBadge(selectedZone.status)}
                    <Badge variant="outline">{selectedZone.zone_type}</Badge>
                    {selectedZone.dnssec_enabled && <Badge variant="outline">DNSSEC</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">SOA {selectedZone.primary_nameserver} / {selectedZone.admin_email} • refresh {formatTtl(selectedZone.refresh_seconds)} • retry {formatTtl(selectedZone.retry_seconds)} • expire {formatTtl(selectedZone.expire_seconds)}</p>
                  <p className="text-sm text-muted-foreground mt-1">Transfer ACL: {selectedZone.transfer_acl.length ? selectedZone.transfer_acl.join(", ") : "none configured"}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" onClick={handleCreateZone} disabled={createZone.isPending}><Plus className="w-4 h-4 mr-2" />Ensure zone</Button>
                  <Button onClick={() => openCreateRecord()}><Plus className="w-4 h-4 mr-2" />Add record</Button>
                </div>
              </div>

              <Tabs defaultValue="records" className="space-y-4">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="records">Records</TabsTrigger>
                  <TabsTrigger value="templates">Templates</TabsTrigger>
                  <TabsTrigger value="delegation">Delegation</TabsTrigger>
                  <TabsTrigger value="propagation">Propagation</TabsTrigger>
                </TabsList>

                <TabsContent value="records" className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="pl-10 bg-secondary border-border" placeholder="Search records, names, or values..." />
                    </div>
                  </div>
                  <div className="glass-card rounded-xl overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>TTL</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRecords.length === 0 ? (
                          <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">No records found for this zone.</TableCell></TableRow>
                        ) : filteredRecords.map((record) => {
                          const Icon = recordTypeIcons[record.type] ?? Globe;
                          return (
                            <TableRow key={record.id}>
                              <TableCell><Badge variant="outline" className={recordTypeColors[record.type]}><Icon className="w-3 h-3 mr-1" />{record.type}</Badge></TableCell>
                              <TableCell><code className="bg-muted px-2 py-1 rounded text-sm">{record.name}</code></TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="text-sm break-all">{record.content}</div>
                                  {(record.priority || record.port || record.is_glue) && <div className="flex gap-2 flex-wrap text-xs text-muted-foreground">
                                    {record.priority ? <span>prio {record.priority}</span> : null}
                                    {record.port ? <span>port {record.port}</span> : null}
                                    {record.is_glue ? <span>glue</span> : null}
                                  </div>}
                                </div>
                              </TableCell>
                              <TableCell>{formatTtl(record.ttl)}</TableCell>
                              <TableCell>{statusBadge(record.status)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="icon" onClick={() => openCreateRecord(record)}><Save className="w-4 h-4" /></Button>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteRecord(record.id)}><Trash2 className="w-4 h-4" /></Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="templates" className="space-y-4">
                  <div className="glass-card rounded-xl p-4 space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-end">
                      <div className="space-y-2">
                        <Label>Apply template</Label>
                        <Select value={templateId} onValueChange={setTemplateId}>
                          <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select a DNS template" /></SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            {templates.map((template) => <SelectItem key={template.id} value={template.id}>{template.name} ({template.scope})</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleApplyTemplate} disabled={!templateId || applyTemplate.isPending}>Apply template</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {templates.map((template) => (
                        <div key={template.id} className="rounded-lg border border-border p-4 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-medium">{template.name}</h4>
                            <Badge variant="outline">{template.scope}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{template.description ?? "No description provided."}</p>
                          <p className="text-xs text-muted-foreground">{template.records.length} record blueprint(s)</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="delegation" className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="glass-card rounded-xl p-4 space-y-4">
                      <h4 className="font-semibold">Glue records</h4>
                      <div className="grid grid-cols-1 gap-3">
                        <Input placeholder="ns1.child-zone.example.com" value={glueForm.hostname} onChange={(e) => setGlueForm((v) => ({ ...v, hostname: e.target.value }))} className="bg-secondary border-border" />
                        <Input placeholder="198.51.100.53" value={glueForm.ipv4} onChange={(e) => setGlueForm((v) => ({ ...v, ipv4: e.target.value }))} className="bg-secondary border-border" />
                        <Input placeholder="2001:db8::53" value={glueForm.ipv6} onChange={(e) => setGlueForm((v) => ({ ...v, ipv6: e.target.value }))} className="bg-secondary border-border" />
                        <Button onClick={handleSaveGlue} disabled={saveGlue.isPending}>Save glue</Button>
                      </div>
                      <div className="space-y-2">
                        {selectedZone.dns_glue_records.map((glue) => (
                          <div key={glue.id} className="rounded-lg border border-border p-3 text-sm">
                            <div className="font-medium">{glue.hostname}</div>
                            <div className="text-muted-foreground">{glue.ipv4 ?? "—"} / {glue.ipv6 ?? "—"}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="glass-card rounded-xl p-4 space-y-4">
                      <h4 className="font-semibold">Secondary DNS</h4>
                      <div className="grid grid-cols-1 gap-3">
                        <Input placeholder="ns2.amp-dns.com" value={secondaryForm.hostname} onChange={(e) => setSecondaryForm((v) => ({ ...v, hostname: e.target.value }))} className="bg-secondary border-border" />
                        <Input placeholder="203.0.113.53" value={secondaryForm.ipv4} onChange={(e) => setSecondaryForm((v) => ({ ...v, ipv4: e.target.value }))} className="bg-secondary border-border" />
                        <Input placeholder="2001:db8:2::53" value={secondaryForm.ipv6} onChange={(e) => setSecondaryForm((v) => ({ ...v, ipv6: e.target.value }))} className="bg-secondary border-border" />
                        <Button onClick={handleSaveSecondary} disabled={saveSecondary.isPending}>Save secondary</Button>
                      </div>
                      <div className="space-y-2">
                        {selectedZone.dns_secondary_nameservers.map((secondary) => (
                          <div key={secondary.id} className="rounded-lg border border-border p-3 text-sm">
                            <div className="flex items-center justify-between gap-2"><div className="font-medium">{secondary.hostname}</div>{secondary.transfer_enabled ? <Badge variant="outline">AXFR enabled</Badge> : null}</div>
                            <div className="text-muted-foreground">{secondary.ipv4 ?? "—"} / {secondary.ipv6 ?? "—"}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="propagation" className="space-y-4">
                  <div className="glass-card rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">Resolver observations</h4>
                        <p className="text-sm text-muted-foreground">Checks are populated by the DNS edge function and stored per zone for auditability.</p>
                      </div>
                      <Button variant="outline" onClick={handleRunPropagation} disabled={runPropagation.isPending}>Re-run checks</Button>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Resolver</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Expected</TableHead>
                          <TableHead>Observed</TableHead>
                          <TableHead>Latency</TableHead>
                          <TableHead>Checked</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedZone.dns_propagation_checks.length === 0 ? (
                          <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No propagation checks have been recorded yet.</TableCell></TableRow>
                        ) : selectedZone.dns_propagation_checks.map((check) => (
                          <TableRow key={check.id}>
                            <TableCell>{check.resolver}</TableCell>
                            <TableCell>{statusBadge(check.status)}</TableCell>
                            <TableCell className="max-w-[220px] truncate">{check.expected_value ?? "—"}</TableCell>
                            <TableCell className="max-w-[220px] truncate">{check.observed_value ?? "—"}</TableCell>
                            <TableCell>{check.latency_ms ? `${check.latency_ms}ms` : "—"}</TableCell>
                            <TableCell>{new Date(check.checked_at).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="glass-card rounded-xl p-10 text-center text-muted-foreground">No DNS zones available yet.</div>
          )}
        </div>
      </div>

      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle>{recordForm.id ? "Edit DNS record" : "Add DNS record"}</DialogTitle>
            <DialogDescription>Validation is enforced by the `dns-control-plane` edge function before records are committed.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={recordForm.type} onValueChange={(value) => setRecordForm((current) => ({ ...current, type: value as DnsRecordType }))}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV", "CAA", "PTR"].map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>TTL</Label>
              <Input type="number" value={recordForm.ttl} onChange={(event) => setRecordForm((current) => ({ ...current, ttl: Number(event.target.value) }))} className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={recordForm.name} onChange={(event) => setRecordForm((current) => ({ ...current, name: event.target.value }))} className="bg-secondary border-border" placeholder="@ or api" />
            </div>
            <div className="space-y-2">
              <Label>Value</Label>
              {recordForm.type === "TXT" ? (
                <Textarea value={recordForm.content} onChange={(event) => setRecordForm((current) => ({ ...current, content: event.target.value }))} className="bg-secondary border-border" placeholder={inferRecordPlaceholder(recordForm.type)} />
              ) : (
                <Input value={recordForm.content} onChange={(event) => setRecordForm((current) => ({ ...current, content: event.target.value }))} className="bg-secondary border-border" placeholder={inferRecordPlaceholder(recordForm.type)} />
              )}
            </div>
            {(recordForm.type === "MX" || recordForm.type === "SRV") && (
              <div className="space-y-2">
                <Label>Priority</Label>
                <Input type="number" value={recordForm.priority ?? 10} onChange={(event) => setRecordForm((current) => ({ ...current, priority: Number(event.target.value) }))} className="bg-secondary border-border" />
              </div>
            )}
            {recordForm.type === "SRV" && (
              <>
                <div className="space-y-2">
                  <Label>Weight</Label>
                  <Input type="number" value={recordForm.weight ?? 10} onChange={(event) => setRecordForm((current) => ({ ...current, weight: Number(event.target.value) }))} className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input type="number" value={recordForm.port ?? 443} onChange={(event) => setRecordForm((current) => ({ ...current, port: Number(event.target.value) }))} className="bg-secondary border-border" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Target</Label>
                  <Input value={recordForm.target ?? ""} onChange={(event) => setRecordForm((current) => ({ ...current, target: event.target.value }))} className="bg-secondary border-border" placeholder="sip.example.com" />
                </div>
              </>
            )}
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3 md:col-span-2">
              <div>
                <Label>Glue / in-bailiwick metadata</Label>
                <p className="text-xs text-muted-foreground">Marks the record for delegation workflows and registrar glue planning.</p>
              </div>
              <Switch checked={Boolean(recordForm.is_glue)} onCheckedChange={(checked) => setRecordForm((current) => ({ ...current, is_glue: checked }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveRecord} disabled={saveRecord.isPending}>{recordForm.id ? "Save changes" : "Create record"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
