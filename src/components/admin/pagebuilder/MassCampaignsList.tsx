import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Loader2,
  ExternalLink,
  Pause,
  Play,
  Trash2,
  RotateCcw,
  Pencil,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { isMassTemplatePath, massTemplateLabel } from "@/lib/massPages";

export type CampaignStatus = "active" | "suspended" | "deleted";

const TITLES: Record<CampaignStatus, { title: string; description: string }> = {
  active: {
    title: "Active Campaigns",
    description: "Mass pages that are live on the company website.",
  },
  suspended: {
    title: "Suspended Campaigns",
    description: "Paused mass pages. Re-activate them to publish again.",
  },
  deleted: {
    title: "Deleted Campaigns",
    description: "Removed mass pages. Restore them or delete permanently.",
  },
};

interface CampaignRow {
  id: string;
  page_path: string;
  status: string;
  updated_at: string;
  overrides: Record<string, unknown> | null;
}

export default function MassCampaignsList({ status }: { status: CampaignStatus }) {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: company } = useQuery({
    queryKey: ["mass-campaigns-company", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, slug")
        .eq("id", companyId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["mass-campaigns", companyId, status],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mass_page_content")
        .select("id, page_path, status, updated_at, overrides")
        .eq("company_id", companyId!)
        .eq("status", status)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as CampaignRow[];
    },
    enabled: !!companyId,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["mass-campaigns", companyId] });
  };

  const setStatus = async (id: string, next: CampaignStatus | "new") => {
    const { error } = await supabase
      .from("mass_page_content")
      .update({ status: next })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Campaign moved to ${next}`);
    refresh();
  };

  const hardDelete = async (id: string) => {
    const { error } = await supabase.from("mass_page_content").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Campaign permanently deleted");
    refresh();
  };

  const meta = TITLES[status];

  const urlFor = (path: string) =>
    company?.slug ? `https://${company.slug}.hcshvac.com${path}` : `/company/${company?.slug ?? ""}${path}`;

  const formattedDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{meta.title}</h2>
          <p className="text-sm text-muted-foreground">
            {company?.name ? `${company.name} — ` : ""}
            {meta.description}
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => navigate(`/admin/page-builder/company/${companyId}/mass-pages`)}
        >
          <Plus className="w-4 h-4 mr-2" /> New Campaign
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No {status} campaigns yet.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base">{meta.title}</CardTitle>
            <CardDescription>{rows.length} campaign{rows.length === 1 ? "" : "s"}</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[280px]">Campaign / Path</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const isTemplate = isMassTemplatePath(row.page_path);
                  const title = isTemplate
                    ? massTemplateLabel(row.page_path)
                    : (row.overrides?.heroTitle as string) ||
                      (row.overrides?.heading as string) ||
                      row.page_path.replace(/^\//, "");
                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="font-medium truncate max-w-[260px]" title={title}>
                          {title}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground break-all">
                          {isTemplate ? "All counties & cities" : row.page_path}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={isTemplate ? "default" : "outline"}>
                          {isTemplate ? "Master template" : "Specific page"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status === "active" ? "default" : "secondary"}>
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {formattedDate(row.updated_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(
                                `/admin/page-builder/company/${companyId}/mass-pages?path=${encodeURIComponent(
                                  row.page_path,
                                )}`,
                              )
                            }
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          {!isTemplate && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(urlFor(row.page_path), "_blank", "noopener,noreferrer")}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}


                          {status === "active" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setStatus(row.id, "suspended")}
                            >
                              <Pause className="w-4 h-4" />
                            </Button>
                          )}
                          {status === "suspended" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setStatus(row.id, "active")}
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          )}
                          {status !== "deleted" ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setStatus(row.id, "deleted")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setStatus(row.id, "active")}
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => hardDelete(row.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
