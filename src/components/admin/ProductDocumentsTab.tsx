import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Pencil, FileText, BookOpen, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminLog } from "@/hooks/useAdminLog";
import { FileManagerPicker } from "@/components/admin/filemanager/FileManagerPicker";

interface ProductDocumentsTabProps {
  productId: string;
}

const DOCUMENT_TYPES = [
  { value: "specification_sheet", label: "Specification Sheet", icon: FileText },
  { value: "user_manual", label: "User Manual", icon: BookOpen },
  { value: "warranty_document", label: "Warranty Document", icon: Shield },
  { value: "other", label: "Other", icon: FileText },
];

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const ProductDocumentsTab = ({ productId }: ProductDocumentsTabProps) => {
  const { toast } = useToast();
  const { logAction } = useAdminLog();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState("specification_sheet");
  const [fileUrl, setFileUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState("0");

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["admin-product-documents", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_documents")
        .select("*")
        .eq("product_id", productId)
        .order("display_order");
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  const resetForm = () => {
    setDocumentName("");
    setDocumentType("specification_sheet");
    setFileUrl("");
    setIsActive(true);
    setDisplayOrder("0");
    setEditingId(null);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (doc: any) => {
    setEditingId(doc.id);
    setDocumentName(doc.document_name);
    setDocumentType(doc.document_type);
    setFileUrl(doc.file_url);
    setIsActive(doc.is_active ?? true);
    setDisplayOrder(String(doc.display_order));
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!documentName || !fileUrl) {
      toast({ title: "Error", description: "Name and file are required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        product_id: productId,
        document_name: documentName,
        document_type: documentType,
        file_url: fileUrl,
        is_active: isActive,
        display_order: parseInt(displayOrder) || 0,
      };

      if (editingId) {
        const { error } = await supabase.from("product_documents").update(payload).eq("id", editingId);
        if (error) throw error;
        toast({ title: "Success", description: "Document updated" });
        logAction("update", "vendor", editingId, { document_name: documentName });
      } else {
        const { data, error } = await supabase.from("product_documents").insert(payload).select().single();
        if (error) throw error;
        toast({ title: "Success", description: "Document added" });
        logAction("create", "vendor", data.id, { document_name: documentName });
      }

      setDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-product-documents", productId] });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const { error } = await supabase.from("product_documents").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete document", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Document deleted" });
      logAction("delete", "vendor", id, { document_name: name });
      queryClient.invalidateQueries({ queryKey: ["admin-product-documents", productId] });
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
        <h3 className="text-lg font-semibold">Product Documents</h3>
        <Button size="sm" onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-1" /> Add Document
        </Button>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No documents uploaded yet.
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => {
                const typeConfig = DOCUMENT_TYPES.find((t) => t.value === doc.document_type);
                return (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.document_name}</TableCell>
                    <TableCell>{typeConfig?.label || doc.document_type}</TableCell>
                    <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                    <TableCell>{doc.display_order}</TableCell>
                    <TableCell>
                      <Badge variant={doc.is_active ? "default" : "secondary"}>
                        {doc.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(doc)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(doc.id, doc.document_name)}>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Document" : "Add Document"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Document Name *</Label>
              <Input value={documentName} onChange={(e) => setDocumentName(e.target.value)} placeholder="e.g. Installation Guide" />
            </div>

            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>File *</Label>
              <div className="flex gap-2">
                <Input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="File URL" className="flex-1" readOnly />
                <Button type="button" variant="outline" onClick={() => setPickerOpen(true)}>Browse</Button>
              </div>
              <FileManagerPicker
                open={pickerOpen}
                onOpenChange={setPickerOpen}
                onSelect={(url) => { setFileUrl(url); setPickerOpen(false); }}
              />
            </div>

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

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingId ? "Update" : "Add"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductDocumentsTab;
