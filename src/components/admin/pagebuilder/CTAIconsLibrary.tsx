import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Edit, Trash2, Eye, Upload, Grid, List, Settings } from "lucide-react";
import { toast } from "sonner";
import { useAdminLog } from "@/hooks/useAdminLog";

interface CTAIcon {
  id: string;
  company_id: string;
  image_url: string;
  alt_text: string;
  custom_name: string;
  unique_id_number: string;
  is_active: boolean;
  is_usable: boolean;
  display_order: number;
  created_at: string;
}

export default function CTAIconsLibrary() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logAction } = useAdminLog();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [previewIcon, setPreviewIcon] = useState<CTAIcon | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<CTAIcon | null>(null);

  const { data: icons = [], isLoading } = useQuery({
    queryKey: ["cta-icons", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cta_icons")
        .select("*")
        .eq("company_id", companyId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as CTAIcon[];
    },
    enabled: !!companyId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (icon: CTAIcon) => {
      // Delete from storage
      const filePath = icon.image_url.split("/cta-icons/")[1];
      if (filePath) {
        await supabase.storage.from("cta-icons").remove([filePath]);
      }
      // Delete from database
      const { error } = await supabase.from("cta_icons").delete().eq("id", icon.id);
      if (error) throw error;

      await logAction("delete", "cta_icon", icon.id, { custom_name: icon.custom_name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cta-icons", companyId] });
      toast.success("CTA Icon deleted");
      setDeleteConfirm(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const filteredIcons = icons.filter((icon) => {
    const matchesSearch =
      searchQuery === "" ||
      icon.alt_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      icon.custom_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      icon.unique_id_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && icon.is_active) ||
      (filterStatus === "inactive" && !icon.is_active);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">CTA Icons Library</h1>
          <p className="text-muted-foreground">Manage call-to-action icons</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => navigate(`/admin/page-builder/company/${companyId}/cta-icons/add`)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Icon
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/page-builder/company/${companyId}/cta-icons/assignments`)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Assignments
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search icons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1 border rounded-md p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Icons Display */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : filteredIcons.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery || filterStatus !== "all"
                ? "No icons match your filters"
                : "No CTA icons yet. Add your first icon!"}
            </p>
            {!searchQuery && filterStatus === "all" && (
              <Button
                className="mt-4"
                onClick={() => navigate(`/admin/page-builder/company/${companyId}/cta-icons/add`)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Icon
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredIcons.map((icon) => (
            <Card
              key={icon.id}
              className="group relative overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
              onClick={() => setPreviewIcon(icon)}
            >
              <CardContent className="p-4">
                <div className="aspect-square flex items-center justify-center bg-muted rounded-lg mb-3">
                  <img
                    src={icon.image_url}
                    alt={icon.alt_text}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <p className="text-sm font-medium truncate">{icon.custom_name || icon.unique_id_number}</p>
                <div className="flex gap-1 mt-2">
                  {!icon.is_active && <Badge variant="secondary">Inactive</Badge>}
                  {!icon.is_usable && <Badge variant="outline">Not Usable</Badge>}
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/page-builder/company/${companyId}/cta-icons/add?edit=${icon.id}`);
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(icon);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Icon</TableHead>
                <TableHead>Custom Name</TableHead>
                <TableHead>Alt Text</TableHead>
                <TableHead>Unique ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIcons.map((icon) => (
                <TableRow key={icon.id}>
                  <TableCell>
                    <img
                      src={icon.image_url}
                      alt={icon.alt_text}
                      className="h-10 w-10 object-contain"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{icon.custom_name || "-"}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{icon.alt_text}</TableCell>
                  <TableCell className="font-mono text-sm">{icon.unique_id_number}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Badge variant={icon.is_active ? "default" : "secondary"}>
                        {icon.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setPreviewIcon(icon)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => navigate(`/admin/page-builder/company/${companyId}/cta-icons/add?edit=${icon.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteConfirm(icon)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewIcon} onOpenChange={() => setPreviewIcon(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{previewIcon?.custom_name || previewIcon?.unique_id_number}</DialogTitle>
          </DialogHeader>
          {previewIcon && (
            <div className="space-y-4">
              <div className="flex justify-center p-6 bg-muted rounded-lg">
                <img
                  src={previewIcon.image_url}
                  alt={previewIcon.alt_text}
                  className="max-h-48 object-contain"
                />
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Alt Text:</span> {previewIcon.alt_text || "-"}</p>
                <p><span className="font-medium">Unique ID:</span> {previewIcon.unique_id_number}</p>
                <p><span className="font-medium">Status:</span> {previewIcon.is_active ? "Active" : "Inactive"}</p>
                <p><span className="font-medium">Usable:</span> {previewIcon.is_usable ? "Yes" : "No"}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => {
                    setPreviewIcon(null);
                    navigate(`/admin/page-builder/company/${companyId}/cta-icons/add?edit=${previewIcon.id}`);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setPreviewIcon(null);
                    setDeleteConfirm(previewIcon);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete CTA Icon</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteConfirm?.custom_name || deleteConfirm?.unique_id_number}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
