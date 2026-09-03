import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Copy, ExternalLink, MapPin, Plus, Trash2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { useMassPages } from "@/hooks/useMassPages";
import {
  ALL_MASS_SECTIONS,
  LOCATION_TYPES,
  LocationType,
  VISIT_TYPES,
  VisitType,
  MassImageBox,
  MassPageSections,
  MassTextBlock,
  customService,
  defaultMassOverrides,
  defaultMassTextBlocks,
  enabledServices,
  massPagePath,
  massPageSummary,
  mergeMassOverrides,
  resolveMassPage,
  MassLocation,
} from "@/lib/massPages";


type SourceKind = "services" | "products";

type MergedOverrides = ReturnType<typeof mergeMassOverrides>;

const BLANK_OVERRIDES: MergedOverrides = {
  metaTitle: "",
  metaDescription: "",
  heroKicker: "",
  heroTitle: "",
  heroSubtitle: "",
  heading: "",
  intro: "",
  bullets: [],
  brandsHeading: "",
  brandsNote: "",
  images: [],
  nearbyHeading: "",
  ctaHeading: "",
  ctaBody: "",
  ctaButton: "",
  sections: {},
};

export default function MassPagesBuilder() {
  const { companyId } = useParams<{ companyId: string }>();
  const [searchParams] = useSearchParams();
  const prefillPath = searchParams.get("path");
  const prefilled = useRef(false);

  const [mode, setMode] = useState<EditMode>("template");
  const [source, setSource] = useState<SourceKind>("services");
  const [item, setItem] = useState<string>("");
  const [visitType, setVisitType] = useState<VisitType | "">("");
  const [locationType, setLocationType] = useState<LocationType | "">("");
  const [countyKey, setCountyKey] = useState<string>("");
  const [cityKeyValue, setCityKeyValue] = useState<string>("");
  const [blocks, setBlocks] = useState<MassTextBlock[]>([]);
  const [ov, setOvState] = useState<MergedOverrides>(BLANK_OVERRIDES);
  const [isActive, setIsActive] = useState(true);

  const [loadingContent, setLoadingContent] = useState(false);
  const [saving, setSaving] = useState(false);



  const { data: company, isLoading } = useQuery({
    queryKey: ["mass-pages-company", companyId],
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
    queryKey: ["mass-pages-products", companyId],
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

  const serviceAreas = (company?.service_areas as string[] | null) || null;
  const { groups, loading: areasLoading } = useMassPages(serviceAreas);

  const services = useMemo(() => (company ? enabledServices(company) : []), [company]);

  const options = source === "services" ? services.map((s) => s.label) : products.map((p) => p.name);

  // Prefill the form when editing an existing campaign (?path=/Service-...)
  useEffect(() => {
    if (prefilled.current || !prefillPath || !company || groups.length === 0) return;
    const ref = resolveMassPage(prefillPath, company, groups);
    if (!ref) return;
    prefilled.current = true;
    setSource(services.some((s) => s.label === ref.service.label) ? "services" : "products");
    setItem(ref.service.label);
    setVisitType(ref.visitType || "");
    setLocationType(ref.locationType || "");
    setCountyKey(`${ref.location.county}|${ref.location.state}`);
    setCityKeyValue(`${ref.location.city}|${ref.location.zip}`);
  }, [prefillPath, company, groups, services]);

  const county = groups.find((g) => `${g.county}|${g.state}` === countyKey) || null;
  const location: MassLocation | null =
    county?.locations.find((l) => `${l.city}|${l.zip}` === cityKeyValue) || null;

  const service = item ? services.find((s) => s.label === item) || customService(item) : null;

  const path = service && location ? massPagePath(service, location, {
    visitType: visitType || null,
    locationType: locationType || null,
  }) : "";

  const summary = service && location ? massPageSummary(service.label, location, {
    visitType: visitType || null,
    locationType: locationType || null,
  }) : "";

  const liveUrl = company?.slug && path ? `https://${company.slug}.hcshvac.com${path}` : "";
  const previewUrl = path ? `/company/${company?.slug ?? ""}${path}` : "";

  const defaults = useMemo<MassTextBlock[]>(
    () =>
      company && service && location
        ? defaultMassTextBlocks(
            company as Record<string, unknown> & { name: string; company_phone?: string | null },
            service,
            location,
            { visitType: visitType || null, locationType: locationType || null },
          )
        : [],
    [company, service, location, visitType, locationType],
  );

  const ovDefaults = useMemo(
    () =>
      company && service && location
        ? defaultMassOverrides(
            company as Record<string, unknown> & { name: string; company_phone?: string | null },
            service,
            location,
            { visitType: visitType || null, locationType: locationType || null },
          )
        : null,
    [company, service, location, visitType, locationType],
  );

  useEffect(() => {
    if (!companyId || !path) {
      setBlocks([]);
      setOvState(BLANK_OVERRIDES);
      return;
    }
    let active = true;
    setLoadingContent(true);
    (async () => {
      const { data } = await supabase
        .from("mass_page_content")
        .select("blocks, overrides, status")
        .eq("company_id", companyId)
        .eq("page_path", path)
        .maybeSingle();
      if (!active) return;
      const savedBlocks = (data?.blocks as unknown as MassTextBlock[] | null) || null;
      setBlocks(Array.isArray(savedBlocks) ? savedBlocks : defaults);
      setIsActive(data ? (data as { status?: string }).status === "active" : true);
      if (ovDefaults) {
        setOvState(
          mergeMassOverrides(
            ovDefaults,
            (data?.overrides as unknown as Record<string, unknown> | null) || null,
          ),
        );
      }
      setLoadingContent(false);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, path]);

  const updateBlock = (index: number, key: keyof MassTextBlock, value: string) =>
    setBlocks((prev) => prev.map((b, i) => (i === index ? { ...b, [key]: value } : b)));

  function setOv<K extends keyof MergedOverrides>(key: K, value: MergedOverrides[K]) {
    setOvState((prev) => ({ ...prev, [key]: value }));
  }

  const updateImage = (index: number, key: keyof MassImageBox, value: string) =>
    setOvState((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => (i === index ? { ...img, [key]: value } : img)),
    }));

  const resetAll = () => {
    setBlocks(defaults);
    if (ovDefaults) setOvState(mergeMassOverrides(ovDefaults, null));
  };

  const saveContent = async () => {
    if (!companyId || !path) return;
    setSaving(true);
    const { error } = await supabase
      .from("mass_page_content")
      .upsert(
        {
          company_id: companyId,
          page_path: path,
          blocks: blocks as unknown as never,
          overrides: ov as unknown as never,
          status: isActive ? "active" : "new",
        },
        { onConflict: "company_id,page_path" },
      );
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      isActive ? "Campaign saved and moved to Active Campaigns" : "Campaign saved as a draft",
    );
  };




  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!company) {
    return <p className="text-muted-foreground py-10 text-center">Company not found</p>;
  }

  const totalCities = groups.reduce((n, g) => n + g.locations.length, 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Mass Pages</h2>
        <p className="text-sm text-muted-foreground">
          Build a service &amp; location landing page for {company.name} — pick a service or product,
          the visit type, the property type and the area you serve.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Step 1 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">1. What is the page about?</CardTitle>
            <CardDescription>Choose from your services or your product catalog.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <RadioGroup
              value={source}
              onValueChange={(v) => {
                setSource(v as SourceKind);
                setItem("");
              }}
              className="flex gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="services" id="src-services" />
                <Label htmlFor="src-services">Services we offer</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="products" id="src-products" />
                <Label htmlFor="src-products">Products</Label>
              </div>
            </RadioGroup>

            <Select value={item} onValueChange={setItem}>
              <SelectTrigger>
                <SelectValue placeholder={source === "services" ? "Select a service" : "Select a product"} />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {options.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Step 2 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">2. Visit type</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={visitType}
              onValueChange={(v) => setVisitType(v as VisitType)}
              className="grid grid-cols-2 gap-2"
            >
              {VISIT_TYPES.map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <RadioGroupItem value={t} id={`visit-${t}`} />
                  <Label htmlFor={`visit-${t}`}>{t}</Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Step 3 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">3. Location type</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={locationType}
              onValueChange={(v) => setLocationType(v as LocationType)}
              className="grid grid-cols-2 gap-2"
            >
              {LOCATION_TYPES.map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <RadioGroupItem value={t} id={`loc-${t}`} />
                  <Label htmlFor={`loc-${t}`}>{t}</Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Step 4 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">4. Area we service</CardTitle>
            <CardDescription>
              {areasLoading
                ? "Loading service areas…"
                : `${groups.length} counties · ${totalCities} cities`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">County</Label>
              <Select
                value={countyKey}
                onValueChange={(v) => {
                  setCountyKey(v);
                  setCityKeyValue("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a county" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {groups.map((g) => (
                    <SelectItem key={`${g.county}|${g.state}`} value={`${g.county}|${g.state}`}>
                      {g.county}, {g.state} ({g.locations.length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">City / ZIP</Label>
              <Select value={cityKeyValue} onValueChange={setCityKeyValue} disabled={!county}>
                <SelectTrigger>
                  <SelectValue placeholder={county ? "Select a city" : "Pick a county first"} />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {(county?.locations || []).map((l) => (
                    <SelectItem key={`${l.city}|${l.zip}`} value={`${l.city}|${l.zip}`}>
                      {l.city}, {l.state}{l.zip ? ` ${l.zip}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Page summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {summary ? (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="font-semibold">{summary}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="font-mono text-xs break-all">
                  {liveUrl || previewUrl}
                </Badge>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(liveUrl || previewUrl);
                    toast.success("URL copied");
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" /> Copy URL
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    window.open(liveUrl || previewUrl, "_blank", "noopener,noreferrer")
                  }
                >
                  <ExternalLink className="w-4 h-4 mr-2" /> Open page
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Complete the steps above to see the generated page (example: Furnace Repair, Emergency,
              Residential, Joliet, IL 60431).
            </p>
          )}
        </CardContent>
      </Card>

      {/* Full page content editor */}
      {path && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Page content</CardTitle>
            <CardDescription>
              Edit every part of this mass page. Empty fields fall back to the auto-generated copy.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingContent ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : (
              <Tabs defaultValue="hero">
                <TabsList className="flex flex-wrap h-auto">
                  <TabsTrigger value="hero">Hero &amp; SEO</TabsTrigger>
                  <TabsTrigger value="intro">Intro &amp; bullets</TabsTrigger>
                  <TabsTrigger value="blocks">Text blocks</TabsTrigger>
                  <TabsTrigger value="images">Images</TabsTrigger>
                  <TabsTrigger value="cta">Brands, nearby &amp; CTA</TabsTrigger>
                  <TabsTrigger value="sections">Sections</TabsTrigger>
                </TabsList>

                <TabsContent value="hero" className="space-y-3 pt-4">
                  <Field label="Browser title (SEO)" value={ov.metaTitle} onChange={(v) => setOv("metaTitle", v)} />
                  <Field
                    label="Meta description (SEO)"
                    value={ov.metaDescription}
                    onChange={(v) => setOv("metaDescription", v)}
                    textarea
                  />
                  <Field label="Hero kicker" value={ov.heroKicker} onChange={(v) => setOv("heroKicker", v)} />
                  <Field label="Hero title" value={ov.heroTitle} onChange={(v) => setOv("heroTitle", v)} />
                  <Field
                    label="Hero subtitle"
                    value={ov.heroSubtitle}
                    onChange={(v) => setOv("heroSubtitle", v)}
                    textarea
                  />
                </TabsContent>

                <TabsContent value="intro" className="space-y-3 pt-4">
                  <Field label="Page heading (H1)" value={ov.heading} onChange={(v) => setOv("heading", v)} />
                  <Field label="Intro paragraph" value={ov.intro} onChange={(v) => setOv("intro", v)} textarea rows={5} />
                  <div className="space-y-2">
                    <Label className="text-xs">Highlight bullets</Label>
                    {ov.bullets.map((b, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          value={b}
                          onChange={(e) =>
                            setOv(
                              "bullets",
                              ov.bullets.map((x, idx) => (idx === i ? e.target.value : x)),
                            )
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setOv("bullets", ov.bullets.filter((_, idx) => idx !== i))}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setOv("bullets", [...ov.bullets, ""])}>
                      <Plus className="w-4 h-4 mr-2" /> Add bullet
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="blocks" className="space-y-3 pt-4">
                  {blocks.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No content blocks — this section will not appear on the page.
                    </p>
                  )}
                  {blocks.map((block, i) => (
                    <div key={i} className="rounded-md border p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-xs">Block {i + 1}</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setBlocks((prev) => prev.filter((_, idx) => idx !== i))}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <Input
                        value={block.heading}
                        placeholder="Heading"
                        onChange={(e) => updateBlock(i, "heading", e.target.value)}
                      />
                      <Textarea
                        value={block.body}
                        placeholder="Body text"
                        rows={4}
                        onChange={(e) => updateBlock(i, "body", e.target.value)}
                      />
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBlocks((prev) => [...prev, { heading: "", body: "" }])}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add block
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setBlocks(defaults)}>
                      <RotateCcw className="w-4 h-4 mr-2" /> Reset to suggested copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setBlocks([])}>
                      <Trash2 className="w-4 h-4 mr-2" /> Remove all
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="images" className="space-y-3 pt-4">
                  {ov.images.map((img, i) => (
                    <div key={i} className="rounded-md border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Image {i + 1}</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setOv("images", ov.images.filter((_, idx) => idx !== i))}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <Input
                        value={img.url || ""}
                        placeholder="Image URL (leave empty to use a stock HVAC photo)"
                        onChange={(e) => updateImage(i, "url", e.target.value)}
                      />
                      <Input
                        value={img.alt}
                        placeholder="Alt text"
                        onChange={(e) => updateImage(i, "alt", e.target.value)}
                      />
                      <Input
                        value={img.caption}
                        placeholder="Caption"
                        onChange={(e) => updateImage(i, "caption", e.target.value)}
                      />
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOv("images", [...ov.images, { url: "", alt: "", caption: "" }])}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add image box
                  </Button>
                </TabsContent>

                <TabsContent value="cta" className="space-y-3 pt-4">
                  <Field label="Brands heading" value={ov.brandsHeading} onChange={(v) => setOv("brandsHeading", v)} />
                  <Field
                    label="Brands note (shown after the brand count)"
                    value={ov.brandsNote}
                    onChange={(v) => setOv("brandsNote", v)}
                  />
                  <Field
                    label="Nearby cities heading"
                    value={ov.nearbyHeading}
                    onChange={(v) => setOv("nearbyHeading", v)}
                  />
                  <Field label="CTA heading" value={ov.ctaHeading} onChange={(v) => setOv("ctaHeading", v)} />
                  <Field label="CTA text" value={ov.ctaBody} onChange={(v) => setOv("ctaBody", v)} textarea />
                  <Field label="CTA button label" value={ov.ctaButton} onChange={(v) => setOv("ctaButton", v)} />
                </TabsContent>

                <TabsContent value="sections" className="space-y-3 pt-4">
                  <p className="text-sm text-muted-foreground">
                    Turn sections on or off for this page.
                  </p>
                  {ALL_MASS_SECTIONS.map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between rounded-md border p-3">
                      <Label className="text-sm">{label}</Label>
                      <Switch
                        checked={ov.sections[key] !== false}
                        onCheckedChange={(checked) =>
                          setOv("sections", { ...ov.sections, [key]: checked })
                        }
                      />
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            )}

            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <Label className="text-sm">Active campaign</Label>
                  <p className="text-xs text-muted-foreground">
                    When active, this campaign goes live and appears under Active Campaign.
                    Otherwise it is kept as a draft.
                  </p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={saveContent} disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save campaign
                </Button>
                <Button variant="outline" size="sm" onClick={resetAll}>
                  <RotateCcw className="w-4 h-4 mr-2" /> Reset everything
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  rows?: number;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {textarea ? (
        <Textarea value={value} rows={rows} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}


