import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateSite } from "@/hooks/useSites";
import { useToast } from "@/hooks/use-toast";
import { Plus, Globe, Loader2 } from "lucide-react";

interface AddSiteDialogProps {
  children?: React.ReactNode;
}

export const AddSiteDialog = ({ children }: AddSiteDialogProps) => {
  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState("");
  const [siteType, setSiteType] = useState<"wordpress" | "nodejs" | "python" | "php" | "static" | "custom">("php");
  const [phpVersion, setPhpVersion] = useState("8.2");
  const createSite = useCreateSite();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!domain.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a domain name.",
      });
      return;
    }

    try {
      await createSite.mutateAsync({
        domain: domain.trim(),
        site_type: siteType,
        php_version: siteType === "php" || siteType === "wordpress" ? phpVersion : null,
      });

      toast({
        title: "Site created!",
        description: `${domain} has been added successfully.`,
      });

      setDomain("");
      setSiteType("php");
      setPhpVersion("8.2");
      setOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to create site",
        description: error.message || "An error occurred while creating the site.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Add Site
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Globe className="w-5 h-5 text-primary" />
            Add New Site
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label htmlFor="domain">Domain Name</Label>
            <Input
              id="domain"
              placeholder="example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="siteType">Site Type</Label>
            <Select value={siteType} onValueChange={(v) => setSiteType(v as any)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select site type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="php">PHP</SelectItem>
                <SelectItem value="wordpress">WordPress</SelectItem>
                <SelectItem value="nodejs">Node.js</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="static">Static</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(siteType === "php" || siteType === "wordpress") && (
            <div className="space-y-2">
              <Label htmlFor="phpVersion">PHP Version</Label>
              <Select value={phpVersion} onValueChange={setPhpVersion}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select PHP version" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8.3">PHP 8.3</SelectItem>
                  <SelectItem value="8.2">PHP 8.2</SelectItem>
                  <SelectItem value="8.1">PHP 8.1</SelectItem>
                  <SelectItem value="8.0">PHP 8.0</SelectItem>
                  <SelectItem value="7.4">PHP 7.4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createSite.isPending}
              className="flex-1 bg-primary text-primary-foreground"
            >
              {createSite.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Site"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
