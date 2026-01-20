import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, MoreHorizontal, Eye, Trash2, Globe, Archive, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface GeneratedPage {
  id: string;
  slug: string;
  title: string;
  audience_type: string | null;
  visit_type: string | null;
  equipment_type: string | null;
  location_city: string | null;
  location_state: string | null;
  status: string;
  created_at: string;
  published_at: string | null;
}

export default function GeneratedPagesList() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: campaign } = useQuery({
    queryKey: ["campaign", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_campaigns")
        .select("name")
        .eq("id", campaignId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: pages, isLoading } = useQuery({
    queryKey: ["generated-pages", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("generated_pages")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as GeneratedPage[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: Record<string, unknown> = { status };
      if (status === "published") {
        updates.published_at = new Date().toISOString();
      }
      const { error } = await supabase
        .from("generated_pages")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generated-pages", campaignId] });
      toast.success("Page status updated");
    },
    onError: (error) => {
      toast.error("Failed to update: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("generated_pages")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generated-pages", campaignId] });
      toast.success("Page deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete: " + error.message);
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "secondary",
      published: "default",
      archived: "outline",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const stats = {
    total: pages?.length || 0,
    published: pages?.filter((p) => p.status === "published").length || 0,
    draft: pages?.filter((p) => p.status === "draft").length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/page-builder/campaigns")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Generated Pages</h2>
          <p className="text-muted-foreground">{campaign?.name || "Campaign"}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.published}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{stats.draft}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pages Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Pages</CardTitle>
          <CardDescription>Manage generated landing pages</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading pages...</div>
          ) : pages?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No pages generated yet</p>
              <Button onClick={() => navigate(`/admin/page-builder/campaigns/${campaignId}`)}>
                Configure & Generate Pages
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Filters</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages?.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{page.title}</p>
                        <p className="text-xs text-muted-foreground">/{page.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {page.audience_type && (
                          <Badge variant="outline" className="text-xs">
                            {page.audience_type}
                          </Badge>
                        )}
                        {page.visit_type && (
                          <Badge variant="outline" className="text-xs">
                            {page.visit_type}
                          </Badge>
                        )}
                        {page.equipment_type && (
                          <Badge variant="outline" className="text-xs">
                            {page.equipment_type}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {page.location_city && page.location_state
                        ? `${page.location_city}, ${page.location_state}`
                        : page.location_state || "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(page.status)}</TableCell>
                    <TableCell>{format(new Date(page.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Preview
                          </DropdownMenuItem>
                          {page.status === "published" && (
                            <DropdownMenuItem>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View Live
                            </DropdownMenuItem>
                          )}
                          {page.status === "draft" && (
                            <DropdownMenuItem
                              onClick={() => updateStatusMutation.mutate({ id: page.id, status: "published" })}
                            >
                              <Globe className="mr-2 h-4 w-4" />
                              Publish
                            </DropdownMenuItem>
                          )}
                          {page.status === "published" && (
                            <DropdownMenuItem
                              onClick={() => updateStatusMutation.mutate({ id: page.id, status: "archived" })}
                            >
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => deleteMutation.mutate(page.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
