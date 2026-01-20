import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, MoreHorizontal, Play, Pause, Trash2, Eye, FileText, Settings, 
  Search, Filter, TrendingUp, CheckCircle2, Clock, AlertCircle,
  Copy, RefreshCw, ArrowUpDown
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: string;
  total_pages_generated: number;
  pages_published: number;
  created_at: string;
  updated_at: string;
  company_id: string | null;
  template_id: string | null;
}

type SortField = "name" | "status" | "created_at" | "total_pages_generated";
type SortDirection = "asc" | "desc";

export default function CampaignDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set());

  const { data: campaigns, isLoading, refetch } = useQuery({
    queryKey: ["page-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_campaigns")
        .select("*")
        .neq("status", "deleted")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Campaign[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("page_campaigns")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page-campaigns"] });
      toast.success("Campaign status updated");
    },
    onError: (error) => {
      toast.error("Failed to update campaign: " + error.message);
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const { error } = await supabase
        .from("page_campaigns")
        .update({ status, updated_at: new Date().toISOString() })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page-campaigns"] });
      setSelectedCampaigns(new Set());
      toast.success("Campaigns updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update campaigns: " + error.message);
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (campaign: Campaign) => {
      const { data: original, error: fetchError } = await supabase
        .from("page_campaigns")
        .select("*")
        .eq("id", campaign.id)
        .single();
      
      if (fetchError) throw fetchError;

      const { id, created_at, updated_at, total_pages_generated, pages_published, ...rest } = original;
      const { error } = await supabase
        .from("page_campaigns")
        .insert({
          ...rest,
          name: `${campaign.name} (Copy)`,
          status: "draft",
          total_pages_generated: 0,
          pages_published: 0,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page-campaigns"] });
      toast.success("Campaign duplicated");
    },
    onError: (error) => {
      toast.error("Failed to duplicate campaign: " + error.message);
    },
  });

  // Filtered and sorted campaigns
  const filteredCampaigns = useMemo(() => {
    if (!campaigns) return [];
    
    let result = [...campaigns];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(c => c.status === statusFilter);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "created_at":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "total_pages_generated":
          comparison = (a.total_pages_generated || 0) - (b.total_pages_generated || 0);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
    
    return result;
  }, [campaigns, searchQuery, statusFilter, sortField, sortDirection]);

  const stats = useMemo(() => ({
    total: campaigns?.length || 0,
    active: campaigns?.filter(c => c.status === "active").length || 0,
    paused: campaigns?.filter(c => c.status === "paused").length || 0,
    draft: campaigns?.filter(c => c.status === "draft").length || 0,
    totalPages: campaigns?.reduce((sum, c) => sum + (c.total_pages_generated || 0), 0) || 0,
    publishedPages: campaigns?.reduce((sum, c) => sum + (c.pages_published || 0), 0) || 0,
  }), [campaigns]);

  const publishRate = stats.totalPages > 0 
    ? Math.round((stats.publishedPages / stats.totalPages) * 100) 
    : 0;

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
      draft: { variant: "secondary", icon: <Clock className="h-3 w-3 mr-1" /> },
      active: { variant: "default", icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
      paused: { variant: "outline", icon: <Pause className="h-3 w-3 mr-1" /> },
      deleted: { variant: "destructive", icon: <AlertCircle className="h-3 w-3 mr-1" /> },
    };
    const { variant, icon } = config[status] || config.draft;
    return (
      <Badge variant={variant} className="flex items-center w-fit">
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCampaigns(new Set(filteredCampaigns.map(c => c.id)));
    } else {
      setSelectedCampaigns(new Set());
    }
  };

  const handleSelectCampaign = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedCampaigns);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedCampaigns(newSelected);
  };

  const handleBulkAction = (action: string) => {
    const ids = Array.from(selectedCampaigns);
    if (ids.length === 0) return;
    
    switch (action) {
      case "activate":
        bulkUpdateMutation.mutate({ ids, status: "active" });
        break;
      case "pause":
        bulkUpdateMutation.mutate({ ids, status: "paused" });
        break;
      case "delete":
        bulkUpdateMutation.mutate({ ids, status: "deleted" });
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Campaign Dashboard</h2>
          <p className="text-muted-foreground">Manage your page generation campaigns</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => navigate("/admin/page-builder/campaigns/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="flex gap-2 mt-2">
              <span className="text-xs text-muted-foreground">{stats.active} active</span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">{stats.draft} draft</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Play className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.active}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.paused} paused
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pages Generated</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalPages}</div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={publishRate} className="h-2 flex-1" />
              <span className="text-xs text-muted-foreground">{publishRate}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published Pages</CardTitle>
            <Eye className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.publishedPages}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.totalPages - stats.publishedPages} pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle>All Campaigns</CardTitle>
              <CardDescription>
                {filteredCampaigns.length} of {campaigns?.length || 0} campaigns
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        {/* Bulk Actions */}
        {selectedCampaigns.size > 0 && (
          <div className="px-6 pb-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">{selectedCampaigns.size} selected</span>
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={() => handleBulkAction("activate")}>
                <Play className="h-4 w-4 mr-1" />
                Activate
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkAction("pause")}>
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleBulkAction("delete")}>
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedCampaigns(new Set())}>
                Clear
              </Button>
            </div>
          </div>
        )}

        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading campaigns...</div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              {campaigns?.length === 0 ? (
                <>
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium mb-2">No campaigns yet</p>
                  <p className="text-muted-foreground mb-4">Create your first campaign to start generating pages</p>
                  <Button onClick={() => navigate("/admin/page-builder/campaigns/new")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Campaign
                  </Button>
                </>
              ) : (
                <>
                  <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium mb-2">No matching campaigns</p>
                  <p className="text-muted-foreground">Try adjusting your search or filters</p>
                </>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={selectedCampaigns.size === filteredCampaigns.length && filteredCampaigns.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      Name
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-center cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("total_pages_generated")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Pages
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="text-center">Published</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("created_at")}
                  >
                    <div className="flex items-center gap-1">
                      Created
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map((campaign) => (
                  <TableRow 
                    key={campaign.id}
                    className={selectedCampaigns.has(campaign.id) ? "bg-muted/50" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedCampaigns.has(campaign.id)}
                        onCheckedChange={(checked) => handleSelectCampaign(campaign.id, !!checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <div 
                        className="cursor-pointer hover:text-primary"
                        onClick={() => navigate(`/admin/page-builder/campaigns/${campaign.id}`)}
                      >
                        <p className="font-medium">{campaign.name}</p>
                        {campaign.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                            {campaign.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                    <TableCell className="text-center font-medium">{campaign.total_pages_generated}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-medium">{campaign.pages_published}</span>
                        {campaign.total_pages_generated > 0 && (
                          <span className="text-xs text-muted-foreground">
                            ({Math.round((campaign.pages_published / campaign.total_pages_generated) * 100)}%)
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(campaign.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/admin/page-builder/campaigns/${campaign.id}`)}>
                            <Settings className="mr-2 h-4 w-4" />
                            Configure
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/admin/page-builder/campaigns/${campaign.id}/pages`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Pages
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicateMutation.mutate(campaign)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {campaign.status === "active" ? (
                            <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: campaign.id, status: "paused" })}>
                              <Pause className="mr-2 h-4 w-4" />
                              Pause
                            </DropdownMenuItem>
                          ) : campaign.status !== "deleted" && (
                            <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: campaign.id, status: "active" })}>
                              <Play className="mr-2 h-4 w-4" />
                              Activate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => updateStatusMutation.mutate({ id: campaign.id, status: "deleted" })}
                            className="text-destructive focus:text-destructive"
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
