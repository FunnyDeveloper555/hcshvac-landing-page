import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Save, Plus, Trash2, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { useAdminLog } from "@/hooks/useAdminLog";
import DualListSelector from "./DualListSelector";
import EmailsTab from "./EmailsTab";

export default function EmailListForm() {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const isEditMode = !!editId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logAction } = useAdminLog();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  // Post form state
  const [postEmail, setPostEmail] = useState("");
  const [postFirstName, setPostFirstName] = useState("");
  const [postLastName, setPostLastName] = useState("");
  const [postCompanyName, setPostCompanyName] = useState("");
  const [postNotes, setPostNotes] = useState("");

  // Fetch all user groups
  const { data: allGroups = [] } = useQuery({
    queryKey: ["user-groups-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_groups")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch assigned group ids for this list
  const { data: assignedGroupIds = [] } = useQuery({
    queryKey: ["email-list-user-groups", editId],
    queryFn: async () => {
      if (!editId) return [];
      const { data, error } = await supabase
        .from("email_list_user_groups")
        .select("user_group_id")
        .eq("email_list_id", editId);
      if (error) throw error;
      return data.map((r) => r.user_group_id);
    },
    enabled: !!editId,
  });

  // Fetch existing list for edit
  const { data: existingList, isLoading: loadingList } = useQuery({
    queryKey: ["email-list", editId],
    queryFn: async () => {
      if (!editId) return null;
      const { data, error } = await supabase
        .from("email_lists")
        .select("*")
        .eq("id", editId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!editId,
  });

  // Fetch posts for this list
  const { data: posts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ["email-list-posts", editId],
    queryFn: async () => {
      if (!editId) return [];
      const { data, error } = await supabase
        .from("email_list_posts")
        .select("*")
        .eq("email_list_id", editId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!editId,
  });

  // Fetch unsubscribes for this list
  const { data: unsubscribes = [], isLoading: loadingUnsubs } = useQuery({
    queryKey: ["email-list-unsubscribes", editId],
    queryFn: async () => {
      if (!editId) return [];
      const { data, error } = await supabase
        .from("email_list_unsubscribes")
        .select("*")
        .eq("email_list_id", editId)
        .order("unsubscribed_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!editId,
  });

  // Fetch subscribers from selected user groups (via user_group_members + profiles)
  const { data: groupSubscribers = [], isLoading: loadingGroupSubs } = useQuery({
    queryKey: ["email-list-group-subscribers", selectedGroupIds],
    queryFn: async () => {
      if (selectedGroupIds.length === 0) return [];
      const { data, error } = await supabase
        .from("user_group_members")
        .select("user_id, group_id, user_groups(name)")
        .in("group_id", selectedGroupIds);
      if (error) throw error;
      if (!data || data.length === 0) return [];

      const userIds = [...new Set(data.map((m) => m.user_id))];
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("user_id, email, display_name")
        .in("user_id", userIds);
      if (pErr) throw pErr;

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
      // Deduplicate by user_id, collect group names
      const userMap = new Map<string, { user_id: string; email: string; display_name: string; groups: string[] }>();
      for (const m of data) {
        const profile = profileMap.get(m.user_id);
        if (!profile) continue;
        const existing = userMap.get(m.user_id);
        const groupName = (m.user_groups as any)?.name || "";
        if (existing) {
          if (groupName) existing.groups.push(groupName);
        } else {
          userMap.set(m.user_id, {
            user_id: m.user_id,
            email: profile.email || "",
            display_name: profile.display_name || "",
            groups: groupName ? [groupName] : [],
          });
        }
      }
      return Array.from(userMap.values());
    },
    enabled: selectedGroupIds.length > 0,
  });

  useEffect(() => {
    if (existingList) {
      setName(existingList.name);
      setDescription(existingList.description || "");
      setIsActive(existingList.is_active ?? true);
    }
  }, [existingList]);

  useEffect(() => {
    if (assignedGroupIds.length > 0) {
      setSelectedGroupIds(assignedGroupIds);
    }
  }, [assignedGroupIds]);

  // Save list + group assignments
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        description: description || null,
        is_active: isActive,
      };

      let listId: string;
      if (isEditMode && editId) {
        const { error } = await supabase.from("email_lists").update(payload).eq("id", editId);
        if (error) throw error;
        listId = editId;
      } else {
        const { data, error } = await supabase.from("email_lists").insert(payload).select("id").single();
        if (error) throw error;
        listId = data.id;
      }

      // Sync group assignments: delete all, re-insert selected
      await supabase.from("email_list_user_groups").delete().eq("email_list_id", listId);
      if (selectedGroupIds.length > 0) {
        const rows = selectedGroupIds.map((gid) => ({
          email_list_id: listId,
          user_group_id: gid,
        }));
        const { error: gErr } = await supabase.from("email_list_user_groups").insert(rows);
        if (gErr) throw gErr;
      }

      return listId;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["email-lists"] });
      queryClient.invalidateQueries({ queryKey: ["email-list", id] });
      queryClient.invalidateQueries({ queryKey: ["email-list-user-groups", id] });
      logAction(isEditMode ? "update" : "create", "email_list", id, { name });
      toast.success(`Email list ${isEditMode ? "updated" : "created"} successfully`);
      if (!isEditMode) {
        navigate(`/admin/email-lists/edit?id=${id}`);
      }
    },
    onError: () => toast.error("Failed to save email list"),
  });

  // Add post mutation
  const addPostMutation = useMutation({
    mutationFn: async () => {
      if (!editId) throw new Error("Save the list first");
      const { error } = await supabase.from("email_list_posts").insert({
        email_list_id: editId,
        email: postEmail,
        first_name: postFirstName || null,
        last_name: postLastName || null,
        company_name: postCompanyName || null,
        notes: postNotes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-list-posts", editId] });
      setPostEmail("");
      setPostFirstName("");
      setPostLastName("");
      setPostCompanyName("");
      setPostNotes("");
      toast.success("Email added to list");
    },
    onError: () => toast.error("Failed to add email"),
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from("email_list_posts").delete().eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-list-posts", editId] });
      toast.success("Email removed from list");
    },
    onError: () => toast.error("Failed to remove email"),
  });

  // Unsubscribe mutation (for manually added posts)
  const unsubscribeMutation = useMutation({
    mutationFn: async (post: { id: string; email: string }) => {
      if (!editId) throw new Error("No list");
      await supabase.from("email_list_posts").update({ is_active: false }).eq("id", post.id);
      const { error } = await supabase.from("email_list_unsubscribes").insert({
        email_list_id: editId,
        email_list_post_id: post.id,
        email: post.email,
        reason: "Admin unsubscribed",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-list-posts", editId] });
      queryClient.invalidateQueries({ queryKey: ["email-list-unsubscribes", editId] });
      toast.success("User unsubscribed");
    },
    onError: () => toast.error("Failed to unsubscribe"),
  });

  if (isEditMode && loadingList) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activePosts = posts.filter((p) => p.is_active);
  const selectedGroupItems = allGroups.filter((g) => selectedGroupIds.includes(g.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/email-lists")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {isEditMode ? "Edit Email List" : "Create Email List"}
          </h2>
          <p className="text-muted-foreground">
            {isEditMode ? "Update list details, manage posts and subscribers" : "Create a new email list"}
          </p>
        </div>
      </div>

      <Tabs defaultValue="basic">
        <TabsList>
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          <TabsTrigger value="emails" disabled={!isEditMode}>Emails</TabsTrigger>
          <TabsTrigger value="posts" disabled={!isEditMode}>Manual Post</TabsTrigger>
          <TabsTrigger value="subscribers" disabled={!isEditMode}>Subscribers</TabsTrigger>
        </TabsList>

        {/* TAB: Basic Information */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>List Details</CardTitle>
              <CardDescription>Configure the email list name, groups, and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Monthly Newsletter" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description..." />
              </div>

              {/* Dual-list selector for User Groups */}
              <div className="space-y-2">
                <Label>User Groups</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Select user groups whose members will be auto-included as subscribers
                </p>
                <DualListSelector
                  availableItems={allGroups}
                  selectedItems={selectedGroupItems}
                  onSelectionChange={setSelectedGroupIds}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label className="text-base">Active</Label>
                  <p className="text-sm text-muted-foreground">Enable or disable this email list</p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
              <div className="flex justify-end">
                <Button onClick={() => saveMutation.mutate()} disabled={!name || saveMutation.isPending}>
                  {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isEditMode ? "Update" : "Create"} List
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Emails */}
        <TabsContent value="emails">
          {editId && <EmailsTab emailListId={editId} />}
        </TabsContent>

        {/* TAB: Posts */}
        <TabsContent value="posts">
          <Card>
            <CardHeader>
              <CardTitle>Add Email</CardTitle>
              <CardDescription>Add a new email entry to this list</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" value={postEmail} onChange={(e) => setPostEmail(e.target.value)} placeholder="email@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={postFirstName} onChange={(e) => setPostFirstName(e.target.value)} placeholder="John" />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={postLastName} onChange={(e) => setPostLastName(e.target.value)} placeholder="Doe" />
                </div>
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input value={postCompanyName} onChange={(e) => setPostCompanyName(e.target.value)} placeholder="Acme Inc." />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={postNotes} onChange={(e) => setPostNotes(e.target.value)} placeholder="Optional notes..." />
              </div>
              <div className="flex justify-end">
                <Button onClick={() => addPostMutation.mutate()} disabled={!postEmail || addPostMutation.isPending}>
                  {addPostMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Add Email
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Email Entries ({posts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPosts ? (
                <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : posts.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No emails added yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium">{post.email}</TableCell>
                        <TableCell>{[post.first_name, post.last_name].filter(Boolean).join(" ") || "—"}</TableCell>
                        <TableCell>{post.company_name || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={post.is_active ? "default" : "secondary"}>
                            {post.is_active ? "Active" : "Unsubscribed"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm("Remove this email?")) deletePostMutation.mutate(post.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Subscribers */}
        <TabsContent value="subscribers">
          {/* Group-based subscribers */}
          <Card>
            <CardHeader>
              <CardTitle>Group Subscribers ({groupSubscribers.length})</CardTitle>
              <CardDescription>Users automatically included from selected user groups</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingGroupSubs ? (
                <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : selectedGroupIds.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No user groups selected — assign groups in Basic Information tab</p>
              ) : groupSubscribers.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No users found in the selected groups</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Display Name</TableHead>
                      <TableHead>Groups</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupSubscribers.map((sub) => (
                      <TableRow key={sub.user_id}>
                        <TableCell className="font-medium">{sub.email}</TableCell>
                        <TableCell>{sub.display_name || "—"}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {sub.groups.map((g) => (
                              <Badge key={g} variant="outline" className="text-xs">{g}</Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Manually added active subscribers */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Manual Subscribers ({activePosts.length})</CardTitle>
              <CardDescription>Manually added email entries — unsubscribe users from here</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPosts ? (
                <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : activePosts.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No manual subscribers</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activePosts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium">{post.email}</TableCell>
                        <TableCell>{[post.first_name, post.last_name].filter(Boolean).join(" ") || "—"}</TableCell>
                        <TableCell>{post.company_name || "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Unsubscribe ${post.email}?`))
                                unsubscribeMutation.mutate({ id: post.id, email: post.email });
                            }}
                          >
                            <UserMinus className="mr-1 h-4 w-4" /> Unsubscribe
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Unsubscribed */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Unsubscribed ({unsubscribes.length})</CardTitle>
              <CardDescription>Users who have been unsubscribed from this list</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingUnsubs ? (
                <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : unsubscribes.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No unsubscribes yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unsubscribes.map((unsub) => (
                      <TableRow key={unsub.id}>
                        <TableCell className="font-medium">{unsub.email}</TableCell>
                        <TableCell>{unsub.reason || "—"}</TableCell>
                        <TableCell>{new Date(unsub.unsubscribed_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
