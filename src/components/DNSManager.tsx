import { useState } from "react";
import {
  Globe,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Search,
  Server,
  Mail,
  FileText,
  Link,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface DNSRecord {
  id: string;
  type: "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS" | "SRV";
  name: string;
  value: string;
  ttl: number;
  priority?: number;
  status: "active" | "pending" | "error";
}

interface Domain {
  id: string;
  name: string;
  status: "active" | "pending" | "expired";
  expiresAt: string;
  nameservers: string[];
  records: DNSRecord[];
}

// Mock data
const initialDomains: Domain[] = [
  {
    id: "1",
    name: "example.com",
    status: "active",
    expiresAt: "2027-01-15",
    nameservers: ["ns1.amp-dns.com", "ns2.amp-dns.com"],
    records: [
      { id: "r1", type: "A", name: "@", value: "192.168.1.100", ttl: 3600, status: "active" },
      { id: "r2", type: "A", name: "www", value: "192.168.1.100", ttl: 3600, status: "active" },
      { id: "r3", type: "CNAME", name: "mail", value: "mail.example.com", ttl: 3600, status: "active" },
      { id: "r4", type: "MX", name: "@", value: "mail.example.com", ttl: 3600, priority: 10, status: "active" },
      { id: "r5", type: "TXT", name: "@", value: "v=spf1 include:_spf.google.com ~all", ttl: 3600, status: "active" },
      { id: "r6", type: "TXT", name: "_dmarc", value: "v=DMARC1; p=quarantine; rua=mailto:admin@example.com", ttl: 3600, status: "active" },
    ],
  },
  {
    id: "2",
    name: "myapp.io",
    status: "active",
    expiresAt: "2026-08-22",
    nameservers: ["ns1.amp-dns.com", "ns2.amp-dns.com"],
    records: [
      { id: "r7", type: "A", name: "@", value: "10.0.0.50", ttl: 3600, status: "active" },
      { id: "r8", type: "A", name: "www", value: "10.0.0.50", ttl: 3600, status: "active" },
      { id: "r9", type: "A", name: "api", value: "10.0.0.51", ttl: 300, status: "active" },
      { id: "r10", type: "CNAME", name: "cdn", value: "cdn.cloudflare.com", ttl: 3600, status: "pending" },
      { id: "r11", type: "TXT", name: "@", value: "google-site-verification=abc123xyz", ttl: 3600, status: "active" },
    ],
  },
  {
    id: "3",
    name: "testsite.org",
    status: "pending",
    expiresAt: "2026-12-01",
    nameservers: ["ns1.amp-dns.com", "ns2.amp-dns.com"],
    records: [
      { id: "r12", type: "A", name: "@", value: "172.16.0.10", ttl: 3600, status: "pending" },
    ],
  },
];

const recordTypeIcons: Record<string, React.ElementType> = {
  A: Server,
  AAAA: Server,
  CNAME: Link,
  MX: Mail,
  TXT: FileText,
  NS: Globe,
  SRV: Server,
};

const recordTypeColors: Record<string, string> = {
  A: "bg-primary/20 text-primary border-primary/30",
  AAAA: "bg-primary/20 text-primary border-primary/30",
  CNAME: "bg-info/20 text-info border-info/30",
  MX: "bg-warning/20 text-warning border-warning/30",
  TXT: "bg-success/20 text-success border-success/30",
  NS: "bg-muted text-muted-foreground border-border",
  SRV: "bg-muted text-muted-foreground border-border",
};

export const DNSManager = () => {
  const [domains, setDomains] = useState<Domain[]>(initialDomains);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(initialDomains[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DNSRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<DNSRecord | null>(null);
  const { toast } = useToast();

  // New/edit record form state
  const [recordForm, setRecordForm] = useState({
    type: "A" as DNSRecord["type"],
    name: "",
    value: "",
    ttl: 3600,
    priority: 10,
  });

  const handleAddRecord = () => {
    setEditingRecord(null);
    setRecordForm({ type: "A", name: "", value: "", ttl: 3600, priority: 10 });
    setRecordDialogOpen(true);
  };

  const handleEditRecord = (record: DNSRecord) => {
    setEditingRecord(record);
    setRecordForm({
      type: record.type,
      name: record.name,
      value: record.value,
      ttl: record.ttl,
      priority: record.priority || 10,
    });
    setRecordDialogOpen(true);
  };

  const handleSaveRecord = () => {
    if (!selectedDomain) return;

    if (!recordForm.name || !recordForm.value) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Name and value are required.",
      });
      return;
    }

    const updatedDomains = domains.map((domain) => {
      if (domain.id !== selectedDomain.id) return domain;

      if (editingRecord) {
        // Update existing record
        return {
          ...domain,
          records: domain.records.map((r) =>
            r.id === editingRecord.id
              ? {
                  ...r,
                  type: recordForm.type,
                  name: recordForm.name,
                  value: recordForm.value,
                  ttl: recordForm.ttl,
                  priority: recordForm.type === "MX" ? recordForm.priority : undefined,
                  status: "pending" as const,
                }
              : r
          ),
        };
      } else {
        // Add new record
        const newRecord: DNSRecord = {
          id: `r${Date.now()}`,
          type: recordForm.type,
          name: recordForm.name,
          value: recordForm.value,
          ttl: recordForm.ttl,
          priority: recordForm.type === "MX" ? recordForm.priority : undefined,
          status: "pending",
        };
        return { ...domain, records: [...domain.records, newRecord] };
      }
    });

    setDomains(updatedDomains);
    setSelectedDomain(updatedDomains.find((d) => d.id === selectedDomain.id) || null);
    setRecordDialogOpen(false);

    toast({
      title: editingRecord ? "Record Updated" : "Record Added",
      description: `DNS record has been ${editingRecord ? "updated" : "added"}. Changes will propagate shortly.`,
    });
  };

  const handleDeleteRecord = () => {
    if (!selectedDomain || !recordToDelete) return;

    const updatedDomains = domains.map((domain) => {
      if (domain.id !== selectedDomain.id) return domain;
      return {
        ...domain,
        records: domain.records.filter((r) => r.id !== recordToDelete.id),
      };
    });

    setDomains(updatedDomains);
    setSelectedDomain(updatedDomains.find((d) => d.id === selectedDomain.id) || null);
    setDeleteDialogOpen(false);
    setRecordToDelete(null);

    toast({
      title: "Record Deleted",
      description: "DNS record has been removed.",
    });
  };

  const filteredRecords = selectedDomain?.records.filter(
    (record) =>
      record.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-success/20 text-success border-success/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "error":
        return (
          <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/30">
            <AlertCircle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatTTL = (ttl: number) => {
    if (ttl >= 86400) return `${ttl / 86400}d`;
    if (ttl >= 3600) return `${ttl / 3600}h`;
    if (ttl >= 60) return `${ttl / 60}m`;
    return `${ttl}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">DNS Manager</h2>
          <p className="text-muted-foreground">
            Manage DNS records for your domains
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{domains.length}</p>
              <p className="text-sm text-muted-foreground">Domains</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/20 flex items-center justify-center">
              <Server className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {domains.reduce((acc, d) => acc + d.records.filter((r) => r.type === "A").length, 0)}
              </p>
              <p className="text-sm text-muted-foreground">A Records</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
              <Mail className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {domains.reduce((acc, d) => acc + d.records.filter((r) => r.type === "MX").length, 0)}
              </p>
              <p className="text-sm text-muted-foreground">MX Records</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {domains.reduce((acc, d) => acc + d.records.filter((r) => r.type === "TXT").length, 0)}
              </p>
              <p className="text-sm text-muted-foreground">TXT Records</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Domain List */}
        <div className="lg:col-span-1">
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Domains</h3>
            <div className="space-y-2">
              {domains.map((domain) => (
                <button
                  key={domain.id}
                  onClick={() => setSelectedDomain(domain)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedDomain?.id === domain.id
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{domain.name}</span>
                    {getStatusBadge(domain.status)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {domain.records.length} records
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Records Table */}
        <div className="lg:col-span-3">
          {selectedDomain ? (
            <div className="space-y-4">
              {/* Domain Info */}
              <div className="glass-card rounded-xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {selectedDomain.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Nameservers: {selectedDomain.nameservers.join(", ")}
                    </p>
                  </div>
                  <Button onClick={handleAddRecord}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Record
                  </Button>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search records..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-secondary border-border"
                  />
                </div>
                <Button variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {/* Records Table */}
              <div className="glass-card rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">Type</TableHead>
                      <TableHead className="text-muted-foreground">Name</TableHead>
                      <TableHead className="text-muted-foreground">Value</TableHead>
                      <TableHead className="text-muted-foreground">TTL</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <Globe className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                          <p className="text-muted-foreground">
                            {searchQuery ? "No records found" : "No DNS records yet"}
                          </p>
                          {!searchQuery && (
                            <Button variant="link" onClick={handleAddRecord} className="mt-2">
                              Add your first record
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRecords?.map((record) => {
                        const TypeIcon = recordTypeIcons[record.type] || Globe;
                        return (
                          <TableRow key={record.id} className="border-border">
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={recordTypeColors[record.type]}
                              >
                                <TypeIcon className="w-3 h-3 mr-1" />
                                {record.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <code className="bg-muted px-2 py-1 rounded text-sm">
                                {record.name}
                              </code>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {record.priority !== undefined && (
                                  <Badge variant="secondary" className="text-xs">
                                    {record.priority}
                                  </Badge>
                                )}
                                <span className="text-muted-foreground text-sm truncate max-w-[200px]">
                                  {record.value}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatTTL(record.ttl)}
                            </TableCell>
                            <TableCell>{getStatusBadge(record.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditRecord(record)}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:bg-destructive/10"
                                  onClick={() => {
                                    setRecordToDelete(record);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-xl p-12 text-center">
              <Globe className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Select a domain to manage its DNS records</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Record Dialog */}
      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editingRecord ? "Edit DNS Record" : "Add DNS Record"}</DialogTitle>
            <DialogDescription>
              {editingRecord
                ? "Update the DNS record settings"
                : "Create a new DNS record for this domain"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Record Type</Label>
                <Select
                  value={recordForm.type}
                  onValueChange={(value) =>
                    setRecordForm({ ...recordForm, type: value as DNSRecord["type"] })
                  }
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="A">A (IPv4 Address)</SelectItem>
                    <SelectItem value="AAAA">AAAA (IPv6 Address)</SelectItem>
                    <SelectItem value="CNAME">CNAME (Alias)</SelectItem>
                    <SelectItem value="MX">MX (Mail Exchange)</SelectItem>
                    <SelectItem value="TXT">TXT (Text)</SelectItem>
                    <SelectItem value="NS">NS (Nameserver)</SelectItem>
                    <SelectItem value="SRV">SRV (Service)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>TTL</Label>
                <Select
                  value={recordForm.ttl.toString()}
                  onValueChange={(value) =>
                    setRecordForm({ ...recordForm, ttl: parseInt(value) })
                  }
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="300">5 minutes</SelectItem>
                    <SelectItem value="900">15 minutes</SelectItem>
                    <SelectItem value="1800">30 minutes</SelectItem>
                    <SelectItem value="3600">1 hour</SelectItem>
                    <SelectItem value="14400">4 hours</SelectItem>
                    <SelectItem value="86400">1 day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="@ for root, or subdomain name"
                value={recordForm.name}
                onChange={(e) => setRecordForm({ ...recordForm, name: e.target.value })}
                className="bg-secondary border-border"
              />
              <p className="text-xs text-muted-foreground">
                Use @ for the root domain, or enter a subdomain (e.g., www, mail, api)
              </p>
            </div>

            {recordForm.type === "MX" && (
              <div className="space-y-2">
                <Label>Priority</Label>
                <Input
                  type="number"
                  placeholder="10"
                  value={recordForm.priority}
                  onChange={(e) =>
                    setRecordForm({ ...recordForm, priority: parseInt(e.target.value) || 10 })
                  }
                  className="bg-secondary border-border"
                />
                <p className="text-xs text-muted-foreground">
                  Lower priority values are preferred (e.g., 10, 20, 30)
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Value</Label>
              <Input
                placeholder={
                  recordForm.type === "A"
                    ? "192.168.1.1"
                    : recordForm.type === "CNAME"
                    ? "target.example.com"
                    : recordForm.type === "MX"
                    ? "mail.example.com"
                    : recordForm.type === "TXT"
                    ? "v=spf1 include:_spf.google.com ~all"
                    : "Enter value"
                }
                value={recordForm.value}
                onChange={(e) => setRecordForm({ ...recordForm, value: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRecord}>
              {editingRecord ? "Save Changes" : "Add Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete DNS Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {recordToDelete?.type} record for "
              {recordToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRecord}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
