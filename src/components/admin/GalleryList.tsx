import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminLog } from "@/hooks/useAdminLog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Image } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const GalleryList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logAction } = useAdminLog();
  const [search, setSearch] = useState("");

  const { data: galleries = [], isLoading } = useQuery({
    queryKey: ["admin-galleries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("galleries")
        .select("*, gallery_items(count)")
        .order("display_order")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = galleries.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    (g.description || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string, name: string) => {
    const { error } = await supabase.from("galleries").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    await logAction("delete", "gallery", id, { name });
    toast.success("Gallery deleted");
    queryClient.invalidateQueries({ queryKey: ["admin-galleries"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Galleries</h2>
        <Button onClick={() => navigate("/admin/galleries/add")}>
          <Plus className="h-4 w-4 mr-1" /> Add Gallery
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search galleries..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Image className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No galleries found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Activity Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(gallery => (
                    <TableRow key={gallery.id}>
                      <TableCell className="font-medium">{gallery.name}</TableCell>
                      <TableCell>{(gallery as any).gallery_items?.[0]?.count ?? 0}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(gallery.tags as string[]).slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                          ))}
                          {(gallery.tags as string[]).length > 3 && (
                            <Badge variant="outline" className="text-xs">+{(gallery.tags as string[]).length - 3}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{gallery.activity_date || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={gallery.is_active ? "default" : "secondary"}>
                          {gallery.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/galleries/add?edit=${gallery.id}`)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete "{gallery.name}"?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently delete this gallery and all its items.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(gallery.id, gallery.name)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GalleryList;
