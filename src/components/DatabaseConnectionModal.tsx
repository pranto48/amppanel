import { useState } from "react";
import { Copy, Check, Database, Server, Key, Link2, Terminal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type DatabaseType = Tables<"databases">;

interface DatabaseConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  database: DatabaseType | null;
  siteDomain: string;
}

const getDbPort = (dbType: string) => {
  switch (dbType) {
    case "mysql":
    case "mariadb":
      return 3306;
    case "postgresql":
      return 5432;
    default:
      return 3306;
  }
};

const getDbHost = (siteDomain: string) => {
  return `db.${siteDomain}`;
};

export const DatabaseConnectionModal = ({
  open,
  onOpenChange,
  database,
  siteDomain,
}: DatabaseConnectionModalProps) => {
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!database) return null;

  const host = getDbHost(siteDomain);
  const port = getDbPort(database.db_type);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({
      title: "Copied!",
      description: `${field} copied to clipboard`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const connectionStrings = {
    mysql: {
      uri: `mysql://${database.username}:<password>@${host}:${port}/${database.name}`,
      php: `$conn = new mysqli("${host}", "${database.username}", "<password>", "${database.name}", ${port});`,
      cli: `mysql -h ${host} -P ${port} -u ${database.username} -p ${database.name}`,
      python: `mysql.connector.connect(host="${host}", port=${port}, user="${database.username}", password="<password>", database="${database.name}")`,
      nodejs: `mysql.createConnection({ host: "${host}", port: ${port}, user: "${database.username}", password: "<password>", database: "${database.name}" })`,
    },
    mariadb: {
      uri: `mariadb://${database.username}:<password>@${host}:${port}/${database.name}`,
      php: `$conn = new mysqli("${host}", "${database.username}", "<password>", "${database.name}", ${port});`,
      cli: `mariadb -h ${host} -P ${port} -u ${database.username} -p ${database.name}`,
      python: `mariadb.connect(host="${host}", port=${port}, user="${database.username}", password="<password>", database="${database.name}")`,
      nodejs: `mariadb.createConnection({ host: "${host}", port: ${port}, user: "${database.username}", password: "<password>", database: "${database.name}" })`,
    },
    postgresql: {
      uri: `postgresql://${database.username}:<password>@${host}:${port}/${database.name}`,
      php: `$conn = pg_connect("host=${host} port=${port} dbname=${database.name} user=${database.username} password=<password>");`,
      cli: `psql -h ${host} -p ${port} -U ${database.username} -d ${database.name}`,
      python: `psycopg2.connect(host="${host}", port=${port}, user="${database.username}", password="<password>", dbname="${database.name}")`,
      nodejs: `new Pool({ host: "${host}", port: ${port}, user: "${database.username}", password: "<password>", database: "${database.name}" })`,
    },
  };

  const currentStrings = connectionStrings[database.db_type as keyof typeof connectionStrings] || connectionStrings.mysql;

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 shrink-0"
      onClick={() => copyToClipboard(text, field)}
    >
      {copiedField === field ? (
        <Check className="w-4 h-4 text-success" />
      ) : (
        <Copy className="w-4 h-4 text-muted-foreground" />
      )}
    </Button>
  );

  const ConnectionField = ({ label, value, field, icon: Icon }: { label: string; value: string; field: string; icon: React.ElementType }) => (
    <div className="space-y-1.5">
      <label className="text-sm text-muted-foreground flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {label}
      </label>
      <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3 border border-border">
        <code className="flex-1 text-sm text-foreground font-mono break-all">{value}</code>
        <CopyButton text={value} field={field} />
      </div>
    </div>
  );

  const CodeBlock = ({ label, code, field }: { label: string; code: string; field: string }) => (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm text-muted-foreground">{label}</label>
        <CopyButton text={code} field={field} />
      </div>
      <div className="bg-muted/50 rounded-lg p-3 border border-border overflow-x-auto">
        <code className="text-sm text-foreground font-mono whitespace-pre-wrap break-all">{code}</code>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="flex items-center gap-2">
                {database.name}
                <Badge
                  variant="outline"
                  className={
                    database.db_type === "mysql"
                      ? "bg-info/20 text-info border-info/30"
                      : database.db_type === "postgresql"
                      ? "bg-primary/20 text-primary border-primary/30"
                      : "bg-warning/20 text-warning border-warning/30"
                  }
                >
                  {database.db_type.toUpperCase()}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Connection details for {siteDomain}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Basic Connection Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ConnectionField label="Host" value={host} field="Host" icon={Server} />
            <ConnectionField label="Port" value={port.toString()} field="Port" icon={Link2} />
            <ConnectionField label="Database" value={database.name} field="Database" icon={Database} />
            <ConnectionField label="Username" value={database.username} field="Username" icon={Key} />
          </div>

          {/* Connection Strings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              Connection Strings
            </h3>
            
            <Tabs defaultValue="uri" className="w-full">
              <TabsList className="bg-secondary border border-border w-full grid grid-cols-5">
                <TabsTrigger value="uri" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  URI
                </TabsTrigger>
                <TabsTrigger value="cli" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  CLI
                </TabsTrigger>
                <TabsTrigger value="php" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  PHP
                </TabsTrigger>
                <TabsTrigger value="python" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Python
                </TabsTrigger>
                <TabsTrigger value="nodejs" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Node.js
                </TabsTrigger>
              </TabsList>

              <TabsContent value="uri" className="mt-4">
                <CodeBlock label="Connection URI" code={currentStrings.uri} field="URI" />
              </TabsContent>

              <TabsContent value="cli" className="mt-4">
                <CodeBlock label="Command Line" code={currentStrings.cli} field="CLI" />
              </TabsContent>

              <TabsContent value="php" className="mt-4">
                <CodeBlock label="PHP Connection" code={currentStrings.php} field="PHP" />
              </TabsContent>

              <TabsContent value="python" className="mt-4">
                <CodeBlock label="Python Connection" code={currentStrings.python} field="Python" />
              </TabsContent>

              <TabsContent value="nodejs" className="mt-4">
                <CodeBlock label="Node.js Connection" code={currentStrings.nodejs} field="Node.js" />
              </TabsContent>
            </Tabs>
          </div>

          {/* Note */}
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
            <p className="text-sm text-warning">
              <strong>Security Note:</strong> Replace <code className="bg-warning/20 px-1 rounded">&lt;password&gt;</code> with your actual database password. Never share your password or store it in version control.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
