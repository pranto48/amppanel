import { useState } from "react";
import { 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  Shield, 
  Crown, 
  Code, 
  Eye,
  RefreshCw,
  Mail,
  UserPlus
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
import { useSiteMembers, useAddSiteMember, useUpdateSiteMemberRole, useRemoveSiteMember } from "@/hooks/useSiteMembers";
import { useSites } from "@/hooks/useSites";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type SiteRole = Tables<"site_members">["role"];

const roleConfig: Record<SiteRole, { label: string; icon: typeof Crown; color: string; description: string }> = {
  owner: {
    label: "Owner",
    icon: Crown,
    color: "bg-warning/20 text-warning border-warning/30",
    description: "Full access including deletion",
  },
  admin: {
    label: "Admin",
    icon: Shield,
    color: "bg-primary/20 text-primary border-primary/30",
    description: "Manage settings and members",
  },
  developer: {
    label: "Developer",
    icon: Code,
    color: "bg-info/20 text-info border-info/30",
    description: "Deploy and manage files",
  },
  viewer: {
    label: "Viewer",
    icon: Eye,
    color: "bg-muted text-muted-foreground border-border",
    description: "View only access",
  },
};

export const UsersManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Tables<"site_members"> | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<SiteRole>("viewer");
  const [inviteSiteId, setInviteSiteId] = useState("");

  const { data: sites } = useSites();
  const { data: members, isLoading, refetch } = useSiteMembers(selectedSite || undefined);
  const addMember = useAddSiteMember();
  const updateRole = useUpdateSiteMemberRole();
  const removeMember = useRemoveSiteMember();
  const { toast } = useToast();

  const getSiteDomain = (siteId: string) => {
    const site = sites?.find((s) => s.id === siteId);
    return site?.domain || "Unknown";
  };

  const filteredMembers = members?.filter(
    (member) =>
      member.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getSiteDomain(member.site_id).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInvite = async () => {
    if (!inviteEmail || !inviteSiteId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all fields.",
      });
      return;
    }

    try {
      // Note: In a real app, you'd look up the user by email first
      // For now, we'll show a toast indicating the invite was sent
      await addMember.mutateAsync({
        site_id: inviteSiteId,
        user_id: inviteEmail, // In real app, this would be the actual user UUID
        role: inviteRole,
      });

      toast({
        title: "Invitation sent",
        description: `Invited ${inviteEmail} as ${roleConfig[inviteRole].label}`,
      });

      setIsInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("viewer");
      setInviteSiteId("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send invitation.",
      });
    }
  };

  const handleRoleChange = async (memberId: string, newRole: SiteRole) => {
    try {
      await updateRole.mutateAsync({ id: memberId, role: newRole });
      toast({
        title: "Role updated",
        description: `Member role changed to ${roleConfig[newRole].label}`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update role.",
      });
    }
  };

  const handleRemove = async () => {
    if (!selectedMember) return;

    try {
      await removeMember.mutateAsync(selectedMember.id);
      toast({
        title: "Member removed",
        description: "Team member has been removed from the site.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to remove member.",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedMember(null);
    }
  };

  const getRoleIcon = (role: SiteRole) => {
    const Icon = roleConfig[role].icon;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">User Management</h2>
          <p className="text-muted-foreground">
            Manage team members and their access to your sites
          </p>
        </div>
        <Button
          onClick={() => setIsInviteDialogOpen(true)}
          className="bg-gradient-to-r from-primary to-info hover:opacity-90"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Member
        </Button>
      </div>

      {/* Role Legend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.entries(roleConfig) as [SiteRole, typeof roleConfig[SiteRole]][]).map(([role, config]) => {
          const Icon = config.icon;
          return (
            <div key={role} className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color.split(' ')[0]}`}>
                  <Icon className={`w-5 h-5 ${config.color.split(' ')[1]}`} />
                </div>
                <div>
                  <p className="font-medium text-foreground">{config.label}</p>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>
        <Select value={selectedSite} onValueChange={setSelectedSite}>
          <SelectTrigger className="w-full sm:w-[200px] bg-secondary border-border">
            <SelectValue placeholder="Filter by site" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Sites</SelectItem>
            {sites?.map((site) => (
              <SelectItem key={site.id} value={site.id}>
                {site.domain}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Members Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">User</TableHead>
              <TableHead className="text-muted-foreground">Site</TableHead>
              <TableHead className="text-muted-foreground">Role</TableHead>
              <TableHead className="text-muted-foreground">Added</TableHead>
              <TableHead className="text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <span className="text-muted-foreground">Loading members...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredMembers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">
                    {searchQuery ? "No members found matching your search" : "No team members yet"}
                  </p>
                  {!searchQuery && (
                    <Button
                      variant="link"
                      onClick={() => setIsInviteDialogOpen(true)}
                      className="mt-2"
                    >
                      Invite your first team member
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers?.map((member) => (
                <TableRow key={member.id} className="border-border">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-info flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-foreground">
                          {member.user_id.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {member.user_id.slice(0, 8)}...
                        </p>
                        <p className="text-xs text-muted-foreground">User ID</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-foreground">{getSiteDomain(member.site_id)}</span>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={member.role}
                      onValueChange={(value) => handleRoleChange(member.id, value as SiteRole)}
                      disabled={member.role === "owner"}
                    >
                      <SelectTrigger className="w-[130px] h-8">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(member.role)}
                          <span>{roleConfig[member.role].label}</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(roleConfig) as [SiteRole, typeof roleConfig[SiteRole]][]).map(([role, config]) => (
                          <SelectItem key={role} value={role} disabled={role === "owner"}>
                            <div className="flex items-center gap-2">
                              {getRoleIcon(role)}
                              <span>{config.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(member.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setSelectedMember(member);
                        setDeleteDialogOpen(true);
                      }}
                      disabled={member.role === "owner"}
                      title={member.role === "owner" ? "Cannot remove owner" : "Remove member"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Invite Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to collaborate on your site
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="site">Site</Label>
              <Select value={inviteSiteId} onValueChange={setInviteSiteId}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select a site" />
                </SelectTrigger>
                <SelectContent>
                  {sites?.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.domain}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="pl-10 bg-secondary border-border"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as SiteRole)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(roleConfig) as [SiteRole, typeof roleConfig[SiteRole]][])
                    .filter(([role]) => role !== "owner")
                    .map(([role, config]) => (
                      <SelectItem key={role} value={role}>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(role)}
                          <div>
                            <span>{config.label}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              - {config.description}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleInvite}
              disabled={addMember.isPending}
              className="bg-gradient-to-r from-primary to-info"
            >
              {addMember.isPending ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member? They will lose access to the site immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-destructive hover:bg-destructive/90"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
