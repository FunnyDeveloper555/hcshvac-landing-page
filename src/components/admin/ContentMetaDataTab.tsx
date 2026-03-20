import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Trash2, Pencil, FileText, FileArchive, Type, Tags, AlignLeft, Braces } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminLog } from "@/hooks/useAdminLog";
import { FileManagerPicker } from "@/components/admin/filemanager/FileManagerPicker";

interface ContentMetaDataTabProps {
  contentId: string;
}

const METADATA_TYPES = [
  { value: "meta_keywords", label: "Meta Keywords", icon: Tags, description: "SEO keywords" },
  { value: "meta_description", label: "Meta Description", icon: AlignLeft, description: "SEO description" },
  { value: "multimedia_file", label: "Multimedia File", icon: FileText, description: "Image, video, or audio" },
  { value: "document", label: "Document", icon: FileText, description: "PDF, DOC, etc." },
  { value: "zip_file", label: "Zip File", icon: FileArchive, description: "Archive file" },
  { value: "plain_text", label: "Plain Text", icon: Type, description: "Text value" },
  { value: "user_defined", label: "User-Defined Field", icon: Braces, description: "Custom key-value" },
];

const getTypeConfig = (type: string) =>
  METADATA_TYPES.find((t) => t.value === type) || METADATA_TYPES[5];

const needsFileUpload = (type: string) =>
  ["multimedia_file", "document", "zip_file"].includes(type);

const ContentMetaDataTab = ({ contentId }: ContentMetaDataTabProps) => {
  const { toast } = useToast();
  const { logAction } = useAdminLog();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [metadataType, setMetadataType] = useState("plain_text");
  const [fieldKey, setFieldKey] = useState("");
  const [fieldValue, setFieldValue] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["content-metadata", contentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_metadata")
        .select("*")
        .eq("content_id", contentId)
        .order("display_order");
      if (error) throw error;
      return data;
    },
    enabled: !!contentId,
  });

  const resetForm = () => {
    setMetadataType("plain_text");
    setFieldKey("");
    setFieldValue("");
    setFileUrl("");
    setDisplayOrder("0");
    setIsActive(true);
    setEditingId(null);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (entry: any) => {
    setEditingId(entry.id);
    setMetadataType(entry.metadata_type);
    setFieldKey(entry.field_key);
    setFieldValue(entry.field_value);
    setFileUrl(entry.file_url || "");
    setDisplayOrder(String(entry.display_order));
    setIsActive(entry.is_active);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!fieldKey.trim()) {
      toast({ title: "Error", description: "Field key/name is required", variant: "destructive" });
      return;
    }
    if (needsFileUpload(metadataType) && !fileUrl) {
      toast({ title: "Error", description: "Please select a file", variant: "destructive" });
      return;
    }
    if (!needsFileUpload(metadataType) && !fieldValue.trim() && metadataType !== "user_defined") {
      toast({ title: "Error", description: "Value is required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        content_id: contentId,
        metadata_type: metadataType,
        field_key: fieldKey.trim(),
        field_value: fieldValue.trim(),
        file_url: needsFileUpload(metadataType) ? fileUrl : null,
        display_order: parseInt(displayOrder) || 0,
        is_active: isActive,
      };

      if (editingId) {
        const { error } = await supabase.from("content_metadata").update(payload).eq("id", editingId);
        if (error) throw error;
        toast({ title: "Updated", description: "Metadata entry updated." });
        logAction("update", "content_metadata", editingId, { field_key: fieldKey });
      } else {
        const { data, error } = await supabase.from("content_metadata").insert(payload).select().single();
        if (error) throw error;
        toast({ title: "Added", description: "Metadata entry added." });
        logAction("create", "content_metadata", data.id, { field_key: fieldKey });
      }

      setDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["content-metadata", contentId] });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, key: string) => {
    const { error } = await supabase.from("content_metadata").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Metadata entry removed." });
      logAction("delete", "content_metadata", id, { field_key: key });
      queryClient.invalidateQueries({ queryKey: ["content-metadata", contentId] });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Meta Data</h3>
          <p className="text-sm text-muted-foreground">Manage SEO metadata, files, and custom fields for this content.</p>
        </div>
        <Button size="sm" onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-1" /> Add Entry
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/30">
          No metadata entries yet. Click "Add Entry" to get started.
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Value / File</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry: any) => {
                const typeConfig = getTypeConfig(entry.metadata_type);
                const Icon = typeConfig.icon;
                return (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs">{typeConfig.label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-sm">{entry.field_key}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {entry.file_url ? (
                        <a href={entry.file_url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-xs">
                          View File
                        </a>
                      ) : (
                        entry.field_value || "—"
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{entry.display_order}</TableCell>
                    <TableCell>
                      <Badge variant={entry.is_active ? "default" : "secondary"} className="text-xs">
                        {entry.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(entry)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(entry.id, entry.field_key)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Metadata Entry" : "Add Metadata Entry"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select value={metadataType} onValueChange={setMetadataType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METADATA_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="flex items-center gap-2">
                        <t.icon className="h-4 w-4" />
                        {t.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {getTypeConfig(metadataType).description}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Key / Name *</Label>
              <Input
                placeholder={
                  metadataType === "meta_keywords"
                    ? "keywords"
                    : metadataType === "meta_description"
                    ? "description"
                    : "e.g. og:image, custom_field"
                }
                value={fieldKey}
                onChange={(e) => setFieldKey(e.target.value)}
              />
            </div>

            {needsFileUpload(metadataType) ? (
              <div className="space-y-2">
                <Label>File *</Label>
                <div className="flex gap-2">
                  <Input value={fileUrl} readOnly placeholder="Select a file..." className="flex-1" />
                  <Button type="button" variant="outline" onClick={() => setPickerOpen(true)}>
                    Browse
                  </Button>
                </div>
                <FileManagerPicker
                  open={pickerOpen}
                  onOpenChange={setPickerOpen}
                  onSelect={(url) => {
                    setFileUrl(url);
                    setPickerOpen(false);
                  }}
                />
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Input
                    placeholder="File description or alt text"
                    value={fieldValue}
                    onChange={(e) => setFieldValue(e.target.value)}
                  />
                </div>
              </div>
            ) : metadataType === "meta_keywords" || metadataType === "meta_description" ? (
              <div className="space-y-2">
                <Label>Value *</Label>
                <Textarea
                  placeholder={
                    metadataType === "meta_keywords"
                      ? "keyword1, keyword2, keyword3..."
                      : "A brief description for search engines (max 160 characters)"
                  }
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  rows={metadataType === "meta_description" ? 3 : 2}
                />
                {metadataType === "meta_description" && (
                  <p className="text-xs text-muted-foreground">{fieldValue.length}/160 characters</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Value {metadataType !== "user_defined" ? "*" : ""}</Label>
                <Textarea
                  placeholder="Enter value..."
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Display Order</Label>
                <Input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} />
              </div>
              <div className="flex items-center gap-3 pt-7">
                <Label>Active</Label>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingId ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentMetaDataTab;
