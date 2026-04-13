import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Code, Eye, Monitor, Tablet, Smartphone, Library, Plus, Pencil, Trash2, Save, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

interface ProductInvoiceTemplateTabProps {
  invoiceHtmlTemplate: string;
  setInvoiceHtmlTemplate: (v: string) => void;
  saveButton: React.ReactNode;
}

const ProductInvoiceTemplateTab = ({
  invoiceHtmlTemplate,
  setInvoiceHtmlTemplate,
  saveButton,
}: ProductInvoiceTemplateTabProps) => {
  const queryClient = useQueryClient();

  // Template selection
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  // Template editor dialog
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateHtml, setTemplateHtml] = useState("");
  const [templateIsActive, setTemplateIsActive] = useState(true);
  const [editorTab, setEditorTab] = useState("editor");
  const [previewDevice, setPreviewDevice] = useState("desktop");

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: templateName,
        description: templateDescription || null,
        html_content: templateHtml,
        is_active: templateIsActive,
      };
      if (editingTemplate) {
        const { error } = await supabase.from("email_templates").update(payload).eq("id", editingTemplate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("email_templates").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success(`Template ${editingTemplate ? "updated" : "created"} successfully`);
      closeEditor();
    },
    onError: () => toast.error("Failed to save template"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Template deleted");
      setDeleteTarget(null);
    },
    onError: () => toast.error("Failed to delete template"),
  });

  const openNew = () => {
    setEditingTemplate(null);
    setTemplateName("");
    setTemplateDescription("");
    setTemplateHtml("");
    setTemplateIsActive(true);
    setEditorTab("editor");
    setEditorOpen(true);
  };

  const openEdit = (t: any) => {
    setEditingTemplate(t);
    setTemplateName(t.name);
    setTemplateDescription(t.description || "");
    setTemplateHtml(t.html_content);
    setTemplateIsActive(t.is_active);
    setEditorTab("editor");
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingTemplate(null);
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = templates.find((t) => t.id === templateId);
    if (tmpl) {
      setInvoiceHtmlTemplate(tmpl.html_content);
      toast.success(`Template "${tmpl.name}" applied`);
    }
  };

  const activeTemplates = templates.filter((t) => t.is_active);

  return (
    <div className="space-y-6 mt-4">
      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Invoice Template</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label>Choose a template to use for this product's invoice</Label>
              <Select value={selectedTemplateId} onValueChange={handleSelectTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  {activeTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {invoiceHtmlTemplate && (
            <div className="mt-4">
              <Label className="text-sm text-muted-foreground mb-2 block">Current Template Preview</Label>
              <div className="border rounded-lg bg-white p-1">
                <iframe
                  srcDoc={invoiceHtmlTemplate}
                  title="Invoice Template Preview"
                  className="w-full min-h-[300px] border-0"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          )}
          <div className="mt-4">{saveButton}</div>
        </CardContent>
      </Card>

      {/* Template Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Library className="h-5 w-5" />
            Manage Templates ({templates.length})
          </CardTitle>
          <Button onClick={openNew} size="sm">
            <Plus className="mr-1 h-4 w-4" /> New Template
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No templates yet. Create your first one!
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {t.description || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.is_active ? "default" : "secondary"}>
                        {t.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(t.updated_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectTemplate(t.id)}
                        title="Use this template"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEdit(t)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteTarget({ id: t.id, name: t.name })}
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

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{deleteTarget?.name}"</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Template Editor Dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Template" : "New Template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Template name" />
              </div>
              <div className="flex items-end gap-4">
                <div className="flex-1 space-y-2">
                  <Label>Description</Label>
                  <Input value={templateDescription} onChange={(e) => setTemplateDescription(e.target.value)} placeholder="Brief description" />
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <Switch checked={templateIsActive} onCheckedChange={setTemplateIsActive} />
                  <Label>Active</Label>
                </div>
              </div>
            </div>

            <Tabs value={editorTab} onValueChange={setEditorTab}>
              <TabsList>
                <TabsTrigger value="editor"><Code className="mr-1 h-4 w-4" /> HTML Editor</TabsTrigger>
                <TabsTrigger value="preview"><Eye className="mr-1 h-4 w-4" /> Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="editor">
                <Textarea
                  value={templateHtml}
                  onChange={(e) => setTemplateHtml(e.target.value)}
                  placeholder={"<html>\n  <body>\n    <h1>Invoice</h1>\n  </body>\n</html>"}
                  className="min-h-[400px] font-mono text-sm"
                />
              </TabsContent>
              <TabsContent value="preview">
                <div className="flex justify-center mb-3">
                  <ToggleGroup type="single" value={previewDevice} onValueChange={(v) => v && setPreviewDevice(v)}>
                    <ToggleGroupItem value="desktop"><Monitor className="h-4 w-4 mr-1" /> Desktop</ToggleGroupItem>
                    <ToggleGroupItem value="tablet"><Tablet className="h-4 w-4 mr-1" /> Tablet</ToggleGroupItem>
                    <ToggleGroupItem value="mobile"><Smartphone className="h-4 w-4 mr-1" /> Mobile</ToggleGroupItem>
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
                    {templateHtml ? (
                      <iframe srcDoc={templateHtml} title="Template Preview" className="w-full min-h-[400px] border-0" sandbox="allow-same-origin" />
                    ) : (
                      <p className="text-muted-foreground text-center py-16">Enter HTML content to see a preview</p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeEditor}>Cancel</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={!templateName || saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {editingTemplate ? "Update" : "Create"} Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductInvoiceTemplateTab;
