import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Pencil, Trash2, Eye, Code, Save, Monitor, Tablet, Smartphone } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "sonner";

interface EmailsTabProps {
  emailListId: string;
}

export default function EmailsTab({ emailListId }: EmailsTabProps) {
  const queryClient = useQueryClient();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState<any>(null);
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [editorTab, setEditorTab] = useState<string>("editor");
  const [previewDevice, setPreviewDevice] = useState<string>("desktop");
  const { data: emails = [], isLoading } = useQuery({
    queryKey: ["email-list-emails", emailListId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_list_emails")
        .select("*")
        .eq("email_list_id", emailListId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        email_list_id: emailListId,
        subject,
        html_content: htmlContent,
        is_active: isActive,
        display_order: displayOrder,
      };
      if (editingEmail) {
        const { error } = await supabase
          .from("email_list_emails")
          .update(payload)
          .eq("id", editingEmail.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("email_list_emails")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-list-emails", emailListId] });
      toast.success(`Email ${editingEmail ? "updated" : "created"} successfully`);
      closeEditor();
    },
    onError: () => toast.error("Failed to save email"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_list_emails").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-list-emails", emailListId] });
      toast.success("Email deleted");
    },
    onError: () => toast.error("Failed to delete email"),
  });

  const openNew = () => {
    setEditingEmail(null);
    setSubject("");
    setHtmlContent("");
    setIsActive(true);
    setDisplayOrder(emails.length);
    setEditorTab("editor");
    setEditorOpen(true);
  };

  const openEdit = (email: any) => {
    setEditingEmail(email);
    setSubject(email.subject);
    setHtmlContent(email.html_content);
    setIsActive(email.is_active);
    setDisplayOrder(email.display_order);
    setEditorTab("editor");
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingEmail(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Emails ({emails.length})</CardTitle>
            <CardDescription>Manage email content for this list</CardDescription>
          </div>
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" /> New Email
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : emails.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No emails created yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emails.map((email) => (
                  <TableRow key={email.id}>
                    <TableCell>{email.display_order}</TableCell>
                    <TableCell className="font-medium">{email.subject || "(No subject)"}</TableCell>
                    <TableCell>
                      <Badge variant={email.is_active ? "default" : "secondary"}>
                        {email.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(email.updated_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(email)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm("Delete this email?")) deleteMutation.mutate(email.id);
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

      {/* Editor Dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEmail ? "Edit Email" : "New Email"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label>Subject *</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject line"
                />
              </div>
              <div className="flex items-end gap-4">
                <div className="space-y-2">
                  <Label>Order</Label>
                  <Input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value))}
                    className="w-20"
                  />
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                  <Label>Active</Label>
                </div>
              </div>
            </div>

            <Tabs value={editorTab} onValueChange={setEditorTab}>
              <TabsList>
                <TabsTrigger value="editor">
                  <Code className="mr-1 h-4 w-4" /> HTML Editor
                </TabsTrigger>
                <TabsTrigger value="preview">
                  <Eye className="mr-1 h-4 w-4" /> Preview
                </TabsTrigger>
              </TabsList>
              <TabsContent value="editor">
                <Textarea
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  placeholder="<html>&#10;  <body>&#10;    <h1>Hello!</h1>&#10;  </body>&#10;</html>"
                  className="min-h-[400px] font-mono text-sm"
                />
              </TabsContent>
              <TabsContent value="preview">
                <div className="flex justify-center mb-3">
                  <ToggleGroup type="single" value={previewDevice} onValueChange={(v) => v && setPreviewDevice(v)}>
                    <ToggleGroupItem value="desktop" aria-label="Desktop">
                      <Monitor className="h-4 w-4 mr-1" /> Desktop
                    </ToggleGroupItem>
                    <ToggleGroupItem value="tablet" aria-label="Tablet">
                      <Tablet className="h-4 w-4 mr-1" /> Tablet
                    </ToggleGroupItem>
                    <ToggleGroupItem value="mobile" aria-label="Mobile">
                      <Smartphone className="h-4 w-4 mr-1" /> Mobile
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <div className="flex justify-center">
                  <div
                    className="border rounded-lg bg-white min-h-[400px] p-1 transition-all duration-300"
                    style={{
                      width: previewDevice === "desktop" ? "100%" : previewDevice === "tablet" ? "768px" : "375px",
                      maxWidth: "100%",
                    }}
                  >
                    {htmlContent ? (
                      <iframe
                        srcDoc={htmlContent}
                        title="Email Preview"
                        className="w-full min-h-[400px] border-0"
                        sandbox="allow-same-origin"
                      />
                    ) : (
                      <p className="text-muted-foreground text-center py-16">
                        Enter HTML content to see a preview
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeEditor}>
                Cancel
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!subject || saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {editingEmail ? "Update" : "Create"} Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
