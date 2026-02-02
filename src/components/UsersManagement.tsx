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
  UserPlus,
  Edit,
  Loader2,
  CheckCircle2,
  XCircle,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useProfiles, useCreateUser, useUpdateProfile, useDeleteUser, useUpdateUserRole, UserWithRole } from "@/hooks/useUsers";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type SiteRole = Tables<"site_members">["role"];
type AppRole = "super_admin" | "admin" | "user";

const siteRoleConfig: Record<SiteRole, { label: string; icon: typeof Crown; color: string; description: string }> = {
  owner: { label: "Owner", icon: Crown, color: "bg-warning/20 text-warning border-warning/30", description: "Full access including deletion" },
  admin: { label: "Admin", icon: Shield, color: "bg-primary/20 text-primary border-primary/30", description: "Manage settings and members" },
  developer: { label: "Developer", icon: Code, color: "bg-info/20 text-info border-info/30", description: "Deploy and manage files" },
  viewer: { label: "Viewer", icon: Eye, color: "bg-muted text-muted-foreground border-border", description: "View only access" },
};

const appRoleConfig: Record<AppRole, { label: string; icon: typeof Crown; color: string }> = {
  super_admin: { label: "Super Admin", icon: Crown, color: "bg-warning/20 text-warning border-warning/30" },
  admin: { label: "Admin", icon: Shield, color: "bg-primary/20 text-primary border-primary/30" },
  user: { label: "User", icon: User, color: "bg-muted text-muted-foreground border-border" },
};

export const UsersManagement = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSite, setSelectedSite] = useState<string>("all");
  
  // Site members state
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [deleteMemberDialogOpen, setDeleteMemberDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Tables<"site_members"> | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<SiteRole>("viewer");
  const [inviteSiteId, setInviteSiteId] = useState("");

  // Users state
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [userForm, setUserForm] = useState({ email: "", password: "", full_name: "", role: "user" as AppRole });

  const { data: sites } = useSites();
  const { data: members, isLoading: membersLoading, refetch: refetchMembers } = useSiteMembers(selectedSite === "all" ? undefined : selectedSite);
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useProfiles();
  
  const addMember = useAddSiteMember();
  const updateSiteRole = useUpdateSiteMemberRole();
  const removeMember = useRemoveSiteMember();
  const createUser = useCreateUser();
  const updateProfile = useUpdateProfile();
  const deleteUser = useDeleteUser();
  const updateUserRole = useUpdateUserRole();
  const { toast } = useToast();

  const getSiteDomain = (siteId: string) => sites?.find((s) => s.id === siteId)?.domain || "Unknown";

  const filteredMembers = members?.filter((member) =>
    member.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getSiteDomain(member.site_id).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users?.filter((user) =>
    (user.email?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    (user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
  );

  // Site member handlers
  const handleInvite = async () => {
    if (!inviteEmail || !inviteSiteId) {
      toast({ variant: "destructive", title: "Error", description: "Please fill in all fields." });
      return;
    }
    try {
      await addMember.mutateAsync({ site_id: inviteSiteId, user_id: inviteEmail, role: inviteRole });
      toast({ title: "Invitation sent", description: `Invited ${inviteEmail} as ${siteRoleConfig[inviteRole].label}` });
      setIsInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("viewer");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleSiteRoleChange = async (memberId: string, newRole: SiteRole) => {
    try {
      await updateSiteRole.mutateAsync({ id: memberId, role: newRole });
      toast({ title: "Role updated", description: `Member role changed to ${siteRoleConfig[newRole].label}` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;
    try {
      await removeMember.mutateAsync(selectedMember.id);
      toast({ title: "Member removed" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setDeleteMemberDialogOpen(false);
      setSelectedMember(null);
    }
  };

  // User handlers
  const handleCreateUser = async () => {
    if (!userForm.email || !userForm.password) {
      toast({ variant: "destructive", title: "Error", description: "Email and password are required." });
      return;
    }
    try {
      await createUser.mutateAsync({
        email: userForm.email,
        password: userForm.password,
        full_name: userForm.full_name,
        role: userForm.role,
      });
      toast({ title: "User created", description: `${userForm.email} has been created.` });
      setCreateUserDialogOpen(false);
      setUserForm({ email: "", password: "", full_name: "", role: "user" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    try {
      await updateProfile.mutateAsync({
        id: selectedUser.id,
        full_name: userForm.full_name,
        is_active: selectedUser.is_active,
      });
      if (userForm.role !== selectedUser.role) {
        await updateUserRole.mutateAsync({ userId: selectedUser.id, role: userForm.role });
      }
      toast({ title: "User updated" });
      setEditUserDialogOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await deleteUser.mutateAsync(selectedUser.id);
      toast({ title: "User deleted" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setDeleteUserDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const handleToggleUserActive = async (user: UserWithRole) => {
    try {
      await updateProfile.mutateAsync({ id: user.id, is_active: !user.is_active });
      toast({ title: user.is_active ? "User deactivated" : "User activated" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const openEditUserDialog = (user: UserWithRole) => {
    setSelectedUser(user);
    setUserForm({ email: user.email || "", password: "", full_name: user.full_name || "", role: user.role || "user" });
    setEditUserDialogOpen(true);
  };

  const getRoleIcon = (role: SiteRole) => {
    const Icon = siteRoleConfig[role].icon;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">User Management</h2>
          <p className="text-muted-foreground">Manage users and site members</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users ({users?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Site Members ({members?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-secondary border-border" />
            </div>
            <Button variant="outline" onClick={() => refetchUsers()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
            <Button onClick={() => setCreateUserDialogOpen(true)} className="bg-primary"><Plus className="w-4 h-4 mr-2" />Create User</Button>
          </div>

          <div className="glass-card rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">User</TableHead>
                  <TableHead className="text-muted-foreground">Role</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Created</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                ) : filteredUsers?.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No users found</TableCell></TableRow>
                ) : (
                  filteredUsers?.map((user) => (
                    <TableRow key={user.id} className="border-border">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-info flex items-center justify-center">
                            <span className="text-xs font-medium text-primary-foreground">{(user.full_name || user.email || "U").slice(0, 2).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{user.full_name || "No name"}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={user.role ? appRoleConfig[user.role].color : "bg-muted"}>
                          {user.role ? appRoleConfig[user.role].label : "User"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={user.is_active ? "bg-success/20 text-success border-success/30" : "bg-muted text-muted-foreground"}>
                          {user.is_active ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Switch checked={user.is_active} onCheckedChange={() => handleToggleUserActive(user)} />
                          <Button variant="ghost" size="icon" onClick={() => openEditUserDialog(user)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { setSelectedUser(user); setDeleteUserDialogOpen(true); }}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Site Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search members..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-secondary border-border" />
            </div>
            <Select value={selectedSite} onValueChange={setSelectedSite}>
              <SelectTrigger className="w-[200px] bg-secondary border-border"><SelectValue placeholder="Filter by site" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sites</SelectItem>
                {sites?.map((site) => (<SelectItem key={site.id} value={site.id}>{site.domain}</SelectItem>))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => refetchMembers()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
            <Button onClick={() => setIsInviteDialogOpen(true)} className="bg-primary"><UserPlus className="w-4 h-4 mr-2" />Invite Member</Button>
          </div>

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
                {membersLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                ) : filteredMembers?.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No site members yet</TableCell></TableRow>
                ) : (
                  filteredMembers?.map((member) => (
                    <TableRow key={member.id} className="border-border">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-info flex items-center justify-center">
                            <span className="text-xs font-medium text-primary-foreground">{member.user_id.slice(0, 2).toUpperCase()}</span>
                          </div>
                          <p className="font-medium text-foreground text-sm">{member.user_id.slice(0, 8)}...</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">{getSiteDomain(member.site_id)}</TableCell>
                      <TableCell>
                        <Select value={member.role} onValueChange={(v) => handleSiteRoleChange(member.id, v as SiteRole)} disabled={member.role === "owner"}>
                          <SelectTrigger className="w-[130px] h-8">
                            <div className="flex items-center gap-2">{getRoleIcon(member.role)}<span>{siteRoleConfig[member.role].label}</span></div>
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(siteRoleConfig).map(([role, config]) => (
                              <SelectItem key={role} value={role} disabled={role === "owner"}>
                                <div className="flex items-center gap-2">{getRoleIcon(role as SiteRole)}<span>{config.label}</span></div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{new Date(member.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { setSelectedMember(member); setDeleteMemberDialogOpen(true); }} disabled={member.role === "owner"}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create User Dialog */}
      <Dialog open={createUserDialogOpen} onOpenChange={setCreateUserDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-primary" />Create User</DialogTitle>
            <DialogDescription>Create a new user account</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="user@example.com" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" placeholder="••••••••" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input placeholder="John Doe" value={userForm.full_name} onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={userForm.role} onValueChange={(v) => setUserForm({ ...userForm, role: v as AppRole })}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(appRoleConfig).map(([role, config]) => (
                    <SelectItem key={role} value={role}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateUserDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateUser} disabled={createUser.isPending}>{createUser.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editUserDialogOpen} onOpenChange={setEditUserDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Edit className="w-5 h-5 text-primary" />Edit User</DialogTitle>
            <DialogDescription>Update user profile and role</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={userForm.email} disabled className="bg-secondary border-border opacity-50" />
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input placeholder="John Doe" value={userForm.full_name} onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={userForm.role} onValueChange={(v) => setUserForm({ ...userForm, role: v as AppRole })}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(appRoleConfig).map(([role, config]) => (
                    <SelectItem key={role} value={role}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUserDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditUser} disabled={updateProfile.isPending}>{updateProfile.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Site Member Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>Send an invitation to collaborate on your site</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Site</Label>
              <Select value={inviteSiteId} onValueChange={setInviteSiteId}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select a site" /></SelectTrigger>
                <SelectContent>{sites?.map((site) => (<SelectItem key={site.id} value={site.id}>{site.domain}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="email" placeholder="colleague@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="pl-10 bg-secondary border-border" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as SiteRole)}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(siteRoleConfig).filter(([role]) => role !== "owner").map(([role, config]) => (
                    <SelectItem key={role} value={role}><div className="flex items-center gap-2">{getRoleIcon(role as SiteRole)}<span>{config.label}</span></div></SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={addMember.isPending}>{addMember.isPending ? "Sending..." : "Send Invitation"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={deleteUserDialogOpen} onOpenChange={setDeleteUserDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete {selectedUser?.email}? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">Delete User</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Site Member Confirmation */}
      <AlertDialog open={deleteMemberDialogOpen} onOpenChange={setDeleteMemberDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to remove this member? They will lose access to the site immediately.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} className="bg-destructive hover:bg-destructive/90">Remove Member</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
