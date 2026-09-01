import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, Pause, Play, Trash2, RotateCcw, Pencil } from "lucide-react";
import { toast } from "sonner";

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
          New Campaign
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
        <div className="grid gap-3">
          {rows.map((row) => {
            const title =
              (row.overrides?.heroTitle as string) ||
              (row.overrides?.heading as string) ||
              row.page_path.replace(/^\//, "");
            return (
              <Card key={row.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">{title}</CardTitle>
                      <CardDescription className="font-mono text-xs break-all">
                        {row.page_path}
                      </CardDescription>
                    </div>
                    <Badge variant={status === "active" ? "default" : "secondary"}>{row.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 pt-0">
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
                    <Pencil className="w-4 h-4 mr-2" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(urlFor(row.page_path), "_blank", "noopener,noreferrer")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" /> Open page
                  </Button>

                  {status === "active" && (
                    <Button variant="outline" size="sm" onClick={() => setStatus(row.id, "suspended")}>
                      <Pause className="w-4 h-4 mr-2" /> Suspend
                    </Button>
                  )}
                  {status === "suspended" && (
                    <Button variant="outline" size="sm" onClick={() => setStatus(row.id, "active")}>
                      <Play className="w-4 h-4 mr-2" /> Activate
                    </Button>
                  )}
                  {status !== "deleted" ? (
                    <Button variant="destructive" size="sm" onClick={() => setStatus(row.id, "deleted")}>
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setStatus(row.id, "active")}>
                        <RotateCcw className="w-4 h-4 mr-2" /> Restore
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => hardDelete(row.id)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete forever
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
