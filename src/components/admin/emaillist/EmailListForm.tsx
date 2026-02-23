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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Save, Plus, Trash2, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { useAdminLog } from "@/hooks/useAdminLog";

export default function EmailListForm() {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const isEditMode = !!editId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logAction } = useAdminLog();

  // Basic info state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [groupId, setGroupId] = useState<string>("");
  const [isActive, setIsActive] = useState(true);

  // Post form state
  const [postEmail, setPostEmail] = useState("");
  const [postFirstName, setPostFirstName] = useState("");
  const [postLastName, setPostLastName] = useState("");
  const [postCompanyName, setPostCompanyName] = useState("");
  const [postNotes, setPostNotes] = useState("");

  // Fetch groups
  const { data: groups = [] } = useQuery({
    queryKey: ["email-list-groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_list_groups")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
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

  useEffect(() => {
    if (existingList) {
      setName(existingList.name);
      setDescription(existingList.description || "");
      setGroupId(existingList.email_list_group_id || "");
      setIsActive(existingList.is_active ?? true);
    }
  }, [existingList]);

  // Save list mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        description: description || null,
        email_list_group_id: groupId || null,
        is_active: isActive,
      };

      if (isEditMode && editId) {
        const { error } = await supabase.from("email_lists").update(payload).eq("id", editId);
        if (error) throw error;
        return editId;
      } else {
        const { data, error } = await supabase.from("email_lists").insert(payload).select("id").single();
        if (error) throw error;
        return data.id;
      }
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["email-lists"] });
      queryClient.invalidateQueries({ queryKey: ["email-list", id] });
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

  // Unsubscribe mutation
  const unsubscribeMutation = useMutation({
    mutationFn: async (post: { id: string; email: string }) => {
      if (!editId) throw new Error("No list");
      // Mark post as inactive
      await supabase.from("email_list_posts").update({ is_active: false }).eq("id", post.id);
      // Create unsubscribe record
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
          <TabsTrigger value="posts" disabled={!isEditMode}>Posts</TabsTrigger>
          <TabsTrigger value="subscribers" disabled={!isEditMode}>Subscribers</TabsTrigger>
        </TabsList>

        {/* TAB: Basic Information */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>List Details</CardTitle>
              <CardDescription>Configure the email list name, group, and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Monthly Newsletter" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description..." />
              </div>
              <div className="space-y-2">
                <Label>Group</Label>
                <Select value={groupId} onValueChange={setGroupId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a group (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Group</SelectItem>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
          <Card>
            <CardHeader>
              <CardTitle>Active Subscribers ({activePosts.length})</CardTitle>
              <CardDescription>Manage active subscribers — unsubscribe users directly from here</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPosts ? (
                <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : activePosts.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No active subscribers</p>
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
