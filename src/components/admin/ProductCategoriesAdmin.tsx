import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRight, ChevronDown, Plus, Pencil, Trash2, FolderTree } from "lucide-react";
import { toast } from "sonner";
import { useAdminLog } from "@/hooks/useAdminLog";

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  level: number;
  display_order: number;
  is_active: boolean;
}

interface FormState {
  name: string;
  parent_id: string | null;
  display_order: number;
  is_active: boolean;
}

const LEVEL_LABELS = ["Equipment Type", "Residential / Commercial", "Sub-type"];

const ProductCategoriesAdmin = () => {
  const queryClient = useQueryClient();
  const { logAction } = useAdminLog();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [form, setForm] = useState<FormState>({ name: "", parent_id: null, display_order: 0, is_active: true });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["product_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_categories")
        .select("*")
        .order("level")
        .order("display_order")
        .order("name");
      if (error) throw error;
      return data as Category[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: Omit<Category, "id"> & { id?: string }) => {
      const parentLevel = payload.parent_id
        ? categories.find((c) => c.id === payload.parent_id)?.level ?? -1
        : -1;
      const level = parentLevel + 1;

      if (payload.id) {
        const { error } = await supabase
          .from("product_categories")
          .update({ name: payload.name, parent_id: payload.parent_id, display_order: payload.display_order, is_active: payload.is_active, level })
          .eq("id", payload.id);
        if (error) throw error;
        logAction("update", "product_category", payload.id, { name: payload.name });
      } else {
        const { error } = await supabase
          .from("product_categories")
          .insert({ name: payload.name, parent_id: payload.parent_id, display_order: payload.display_order, is_active: payload.is_active, level });
        if (error) throw error;
        logAction("create", "product_category", undefined, { name: payload.name });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product_categories"] });
      toast.success(editingId ? "Category updated" : "Category created");
      closeDialog();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const children = categories.filter((c) => c.parent_id === id);
      if (children.length > 0) throw new Error("Delete child categories first");
      const { error } = await supabase.from("product_categories").delete().eq("id", id);
      if (error) throw error;
      logAction("delete", "product_category", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product_categories"] });
      toast.success("Category deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm({ name: "", parent_id: null, display_order: 0, is_active: true });
  };

  const openAdd = (parentId: string | null = null) => {
    const siblings = categories.filter((c) => c.parent_id === parentId);
    setForm({ name: "", parent_id: parentId, display_order: (siblings.length + 1), is_active: true });
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setForm({ name: cat.name, parent_id: cat.parent_id, display_order: cat.display_order, is_active: cat.is_active });
    setEditingId(cat.id);
    setDialogOpen(true);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const getChildren = (parentId: string | null) =>
    categories.filter((c) => c.parent_id === parentId).sort((a, b) => a.display_order - b.display_order);

  const possibleParents = editingId
    ? categories.filter((c) => c.id !== editingId && c.level < 2)
    : categories.filter((c) => c.level < 2);

  const renderRow = (cat: Category, depth: number) => {
    const children = getChildren(cat.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.has(cat.id);

    return (
      <>
        <TableRow key={cat.id}>
          <TableCell>
            <div className="flex items-center gap-1" style={{ paddingLeft: `${depth * 24}px` }}>
              {hasChildren ? (
                <button onClick={() => toggleExpand(cat.id)} className="p-0.5 rounded hover:bg-accent">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              ) : (
                <span className="w-5" />
              )}
              <span className={!cat.is_active ? "text-muted-foreground line-through" : ""}>{cat.name}</span>
            </div>
          </TableCell>
          <TableCell className="text-muted-foreground text-xs">{LEVEL_LABELS[cat.level] ?? `Level ${cat.level}`}</TableCell>
          <TableCell className="text-center">{cat.display_order}</TableCell>
          <TableCell className="text-center">{cat.is_active ? "✓" : "✗"}</TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-1">
              {cat.level < 2 && (
                <Button size="sm" variant="ghost" onClick={() => openAdd(cat.id)} title="Add child">
                  <Plus className="h-4 w-4" />
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => openEdit(cat)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete this category?")) deleteMutation.mutate(cat.id); }}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
        {isExpanded && children.map((child) => renderRow(child, depth + 1))}
      </>
    );
  };

  const rootCategories = getChildren(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FolderTree className="h-6 w-6" /> Product Categories
        </h2>
        <Button onClick={() => openAdd(null)}>
          <Plus className="h-4 w-4 mr-1" /> Add Root Category
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-muted-foreground">Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead className="text-center">Order</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rootCategories.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No categories yet</TableCell></TableRow>
                ) : (
                  rootCategories.map((cat) => renderRow(cat, 0))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Category name" />
            </div>
            <div>
              <Label>Parent Category</Label>
              <Select value={form.parent_id ?? "__none__"} onValueChange={(v) => setForm((f) => ({ ...f, parent_id: v === "__none__" ? null : v }))}>
                <SelectTrigger><SelectValue placeholder="None (root)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None (root level)</SelectItem>
                  {possibleParents.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {"—".repeat(p.level)} {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Display Order</Label>
                <Input type="number" value={form.display_order} onChange={(e) => setForm((f) => ({ ...f, display_order: Number(e.target.value) }))} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
                <Label>Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button
              disabled={!form.name.trim() || saveMutation.isPending}
              onClick={() => saveMutation.mutate({ ...form, level: 0, id: editingId ?? undefined } as any)}
            >
              {saveMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductCategoriesAdmin;
