import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, ExternalLink, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useMassPages } from "@/hooks/useMassPages";
import {
  DEFAULT_MASS_CAMPAIGN_TEMPLATE,
  LOCATION_TYPES,
  LocationType,
  MASS_CAMPAIGN_TEMPLATES,
  MASS_TEMPLATE_PREFIX,
  VISIT_TYPES,
  VisitType,
  MassLocation,
  compact,
  customService,
  enabledServices,
  isMassTemplatePath,
  massPagePath,
  massTemplateLabel,
  massTemplatePath,
} from "@/lib/massPages";

/**
 * Campaign Template — applies one of the pre-designed mass page layouts to a
 * master campaign (Location type + Visit type + Subject). Every page inside
 * that master campaign renders with the chosen layout.
 */
export default function MassCampaignTemplates() {
  const { companyId } = useParams<{ companyId: string }>();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [locationType, setLocationType] = useState<LocationType | "">("");
  const [visitType, setVisitType] = useState<VisitType | "">("");
  const [source, setSource] = useState<"services" | "products">("services");
  const [item, setItem] = useState("");
  const [template, setTemplate] = useState<string>(DEFAULT_MASS_CAMPAIGN_TEMPLATE);
  const [previewTpl, setPreviewTpl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const { data: company, isLoading } = useQuery({
    queryKey: ["mass-tpl-company", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId!)
        .single();
      if (error) throw error;
      return data as Record<string, unknown> & { name: string; slug: string | null };
    },
    enabled: !!companyId,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["mass-tpl-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, product_name")
        .in("status", ["active_showing", "active_not_showing"])
        .order("product_name")
        .limit(500);
      if (error) throw error;
      return (data || []).map((p) => ({ id: p.id, name: p.product_name }));
    },
  });

  const { data: masters = [] } = useQuery({
    queryKey: ["mass-master-templates", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mass_page_content")
        .select("id, page_path, status, overrides")
        .eq("company_id", companyId!);
      if (error) throw error;
      return (data || []).filter((r) => isMassTemplatePath(r.page_path)) as {
        id: string;
        page_path: string;
        status: string;
        overrides: Record<string, unknown> | null;
      }[];
    },
    enabled: !!companyId,
  });

  const serviceAreas = (company?.service_areas as string[] | null) || null;
  const { groups } = useMassPages(serviceAreas);
  const services = useMemo(() => (company ? enabledServices(company) : []), [company]);
  const options = source === "services" ? services.map((s) => s.label) : products.map((p) => p.name);

  const service = item ? services.find((s) => s.label === item) || customService(item) : null;
  const opts = { visitType: visitType || null, locationType: locationType || null };
  const path = service ? massTemplatePath(service, opts) : "";

  // Prefill from ?path=/__template/...
  useEffect(() => {
    const p = searchParams.get("path");
    if (loaded || !p || !company || !isMassTemplatePath(p)) return;
    setLoaded(true);
    const parts = p.replace(MASS_TEMPLATE_PREFIX, "").split("-").filter(Boolean);
    let svc = "";
    parts.forEach((seg) => {
      const l = LOCATION_TYPES.find((t) => compact(t).toLowerCase() === seg.toLowerCase());
      if (l) return setLocationType(l);
      const v = VISIT_TYPES.find((t) => compact(t).toLowerCase() === seg.toLowerCase());
      if (v) return setVisitType(v);
      svc = seg;
    });
    const match = services.find((s) => compact(s.label).toLowerCase() === svc.toLowerCase());
    if (match) {
      setSource("services");
      setItem(match.label);
      return;
    }
    const prod = products.find((pr) => compact(pr.name).toLowerCase() === svc.toLowerCase());
    if (prod) {
      setSource("products");
      setItem(prod.name);
    }
  }, [searchParams, company, services, products, loaded]);

  // Load the template currently stored on this master campaign
  useEffect(() => {
    if (!path) return;
    const row = masters.find((m) => m.page_path === path);
    setTemplate((row?.overrides?.template as string) || DEFAULT_MASS_CAMPAIGN_TEMPLATE);
  }, [path, masters]);

  const sampleLocation: MassLocation | null =
    groups[0]?.locations[0] ||
    (company
      ? {
          city: String((company as Record<string, unknown>).city || "Carol Stream"),
          county: String((company as Record<string, unknown>).county || "DuPage County"),
          state: String((company as Record<string, unknown>).state || "IL"),
          zip: String((company as Record<string, unknown>).zip_code || "60188"),
        }
      : null);

  const previewUrl =
    company?.slug && service && sampleLocation
      ? `/company/${company.slug}${massPagePath(service, sampleLocation, opts)}`
      : "";

  const save = async () => {
    if (!companyId || !path) return;
    setSaving(true);
    const existing = masters.find((m) => m.page_path === path);
    const overrides = { ...(existing?.overrides || {}), template };
    const { error } = await supabase.from("mass_page_content").upsert(
      {
        company_id: companyId,
        page_path: path,
        blocks: (existing ? undefined : []) as unknown as never,
        overrides: overrides as unknown as never,
        status: existing?.status || "active",
      },
      { onConflict: "company_id,page_path" },
    );
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Campaign template applied to this master campaign");
    queryClient.invalidateQueries({ queryKey: ["mass-master-templates", companyId] });
    queryClient.invalidateQueries({ queryKey: ["mass-campaigns", companyId] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!company) return <p className="text-muted-foreground py-10 text-center">Company not found</p>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Campaign Template</h2>
        <p className="text-sm text-muted-foreground">
          Choose the layout used by a master campaign for {company.name}. Pick the location type,
          visit type and subject, then apply a template.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Master campaign</CardTitle>
          <CardDescription>No county or city — the template applies to all its pages.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1">
            <Label className="text-xs">Location type</Label>
            <Select value={locationType} onValueChange={(v) => setLocationType(v as LocationType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {LOCATION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Visit type</Label>
            <Select value={visitType} onValueChange={(v) => setVisitType(v as VisitType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {VISIT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Source</Label>
            <Select
              value={source}
              onValueChange={(v) => {
                setSource(v as "services" | "products");
                setItem("");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="services">Services we offer</SelectItem>
                <SelectItem value="products">Products</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">What is the page about?</Label>
            <Select value={item} onValueChange={setItem}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {options.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {path ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Theme template</CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{massTemplateLabel(path)}</Badge>
              <span>Every page in this master campaign uses the selected layout.</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <RadioGroup value={template} onValueChange={setTemplate} className="grid gap-2 md:grid-cols-2">
              {MASS_CAMPAIGN_TEMPLATES.map((t) => (
                <div
                  key={t.id}
                  className={`rounded-md border p-3 transition-colors ${
                    template === t.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  }`}
                >
                  <label htmlFor={`tpl-${t.id}`} className="flex items-start gap-2 cursor-pointer">
                    <RadioGroupItem value={t.id} id={`tpl-${t.id}`} className="mt-1" />
                    <span>
                      <span className="flex items-center gap-2 text-sm font-medium">
                        {t.name}
                        <span
                          className="inline-block h-3 w-3 rounded-full border"
                          style={{ background: `hsl(${t.theme.primary})` }}
                        />
                        <span className="text-[11px] font-normal text-muted-foreground">
                          {t.theme.label}
                        </span>
                      </span>
                      <span className="block text-xs text-muted-foreground">{t.description}</span>
                      <span className="mt-1 block text-[11px] font-mono text-muted-foreground">
                        {t.order.join(" › ")}
                      </span>
                    </span>
                  </label>
                  <div className="mt-2 flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={!previewUrl}
                      onClick={() => setPreviewTpl(t.id)}
                    >
                      <Eye className="mr-1 h-3.5 w-3.5" /> Preview
                    </Button>
                  </div>
                </div>
              ))}
            </RadioGroup>
            <div className="flex justify-end">
              <Button size="sm" onClick={save} disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Apply template
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">
          Pick a location type, visit type and subject to choose a campaign template.
        </p>
      )}

      <Dialog open={!!previewTpl} onOpenChange={(o) => !o && setPreviewTpl(null)}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>
              Preview — {MASS_CAMPAIGN_TEMPLATES.find((t) => t.id === previewTpl)?.name}
            </DialogTitle>
            <DialogDescription>
              Live mass page rendered with this layout using a sample city in this campaign.
            </DialogDescription>
          </DialogHeader>
          {previewTpl && previewUrl && (
            <>
              <iframe
                src={`${previewUrl}?tpl=${previewTpl}`}
                title="Mass page template preview"
                className="h-[70vh] w-full rounded-md border bg-background"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    window.open(`${previewUrl}?tpl=${previewTpl}`, "_blank", "noopener,noreferrer")
                  }
                >
                  <ExternalLink className="mr-1 h-4 w-4" /> Open in new tab
                </Button>
                <Button
                  onClick={() => {
                    setTemplate(previewTpl);
                    setPreviewTpl(null);
                  }}
                >
                  Use this template
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
