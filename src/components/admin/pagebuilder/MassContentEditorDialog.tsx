import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, ExternalLink, Loader2, Plus, RefreshCw, RotateCcw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  ALL_MASS_SECTIONS,
  LocationType,
  VisitType,
  MassImageBox,
  MassLocation,
  MassService,
  MassTextBlock,
  defaultMassOverrides,
  defaultMassTextBlocks,
  mergeMassOverrides,
} from "@/lib/massPages";

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
  template: "standard",
  sections: {},
};

export interface MassContentEditorTarget {
  path: string;
  service: MassService;
  location: MassLocation;
  visitType: VisitType | null;
  locationType: LocationType | null;
  /** true when editing a master campaign template row (no county / city) */
  isTemplate?: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  company: Record<string, unknown> & { name: string; company_phone?: string | null };
  target: MassContentEditorTarget | null;
  onSaved?: () => void;
}

/** Modal editor for a single mass page (or master template) content record. */
export default function MassContentEditorDialog({
  open,
  onOpenChange,
  companyId,
  company,
  target,
  onSaved,
}: Props) {
  const [blocks, setBlocks] = useState<MassTextBlock[]>([]);
  const [ov, setOvState] = useState<MergedOverrides>(BLANK_OVERRIDES);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("hero");
  const [showPreview, setShowPreview] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [previewReady, setPreviewReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const slug = (company as { slug?: string | null }).slug || "";
  const previewUrl =
    target && slug
      ? `${window.location.origin}/company/${slug}${target.path}?preview=1`
      : null;

  const TAB_SECTION: Record<string, string | null> = {
    hero: "hero",
    intro: "intro",
    blocks: "blocks",
    images: "images",
    cta: "cta",
    sections: null,
  };

  // The preview iframe tells us when it is listening for draft content.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if ((event.data as { type?: string })?.type === "mass-preview-ready") setPreviewReady(true);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    setPreviewReady(false);
  }, [reloadKey, target?.path, open]);

  // Push the unsaved draft into the preview whenever the editor changes.
  useEffect(() => {
    if (!showPreview || !previewReady) return;
    const timer = window.setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage(
        {
          type: "mass-preview",
          overrides: ov,
          blocks,
          section: TAB_SECTION[tab] ?? null,
        },
        "*",
      );
    }, 250);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ov, blocks, tab, showPreview, previewReady]);

  const opts = {
    visitType: target?.visitType || null,
    locationType: target?.locationType || null,
  };

  const defaults = useMemo<MassTextBlock[]>(
    () =>
      target
        ? defaultMassTextBlocks(company, target.service, target.location, opts)
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [company, target?.path],
  );

  const ovDefaults = useMemo(
    () => (target ? defaultMassOverrides(company, target.service, target.location, opts) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [company, target?.path],
  );

  useEffect(() => {
    if (!open || !target || !companyId) return;
    let active = true;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("mass_page_content")
        .select("blocks, overrides, status")
        .eq("company_id", companyId)
        .eq("page_path", target.path)
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
      setLoading(false);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, companyId, target?.path]);

  function setOv<K extends keyof MergedOverrides>(key: K, value: MergedOverrides[K]) {
    setOvState((prev) => ({ ...prev, [key]: value }));
  }

  const updateBlock = (index: number, key: keyof MassTextBlock, value: string) =>
    setBlocks((prev) => prev.map((b, i) => (i === index ? { ...b, [key]: value } : b)));

  const updateImage = (index: number, key: keyof MassImageBox, value: string) =>
    setOvState((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => (i === index ? { ...img, [key]: value } : img)),
    }));

  const resetAll = () => {
    setBlocks(defaults);
    if (ovDefaults) setOvState(mergeMassOverrides(ovDefaults, null));
  };

  const save = async () => {
    if (!target) return;
    setSaving(true);
    // The theme template lives on the master campaign only, so a specific page
    // never overrides it.
    const overrides = target.isTemplate
      ? ov
      : (() => {
          const { template: _t, ...rest } = ov;
          return rest;
        })();
    const { error } = await supabase.from("mass_page_content").upsert(
      {
        company_id: companyId,
        page_path: target.path,
        blocks: blocks as unknown as never,
        overrides: overrides as unknown as never,
        status: isActive ? "active" : "new",
      },
      { onConflict: "company_id,page_path" },
    );
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(isActive ? "Campaign saved and set active" : "Campaign saved as a draft");
    onSaved?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${showPreview && previewUrl ? "max-w-[1500px]" : "max-w-4xl"} max-h-[92vh] overflow-hidden`}
      >
        <DialogHeader>
          <DialogTitle>Edit page content</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-mono text-xs break-all">
              {target?.path}
            </Badge>
            <span>Empty fields fall back to the auto-generated copy.</span>
            {previewUrl && (
              <Button
                variant="outline"
                size="sm"
                className="h-7"
                onClick={() => setShowPreview((v) => !v)}
              >
                {showPreview ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 mr-1.5" /> Hide live preview
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 mr-1.5" /> Show live preview
                  </>
                )}
              </Button>
            )}
          </DialogDescription>
        </DialogHeader>

        <div
          className={`grid gap-4 ${showPreview && previewUrl ? "lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)]" : "grid-cols-1"}`}
        >
        <div className="max-h-[62vh] overflow-y-auto pr-1">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab}>
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
              <p className="text-sm text-muted-foreground">Turn sections on or off for this page.</p>
              {ALL_MASS_SECTIONS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between rounded-md border p-3">
                  <Label className="text-sm">{label}</Label>
                  <Switch
                    checked={ov.sections[key] !== false}
                    onCheckedChange={(checked) => setOv("sections", { ...ov.sections, [key]: checked })}
                  />
                </div>
              ))}
            </TabsContent>
          </Tabs>
        )}
        </div>

        {showPreview && previewUrl && (
          <div className="hidden lg:flex flex-col rounded-lg border overflow-hidden bg-muted/30">
            <div className="flex items-center justify-between gap-2 border-b bg-background px-3 py-2">
              <span className="text-xs font-medium">
                Live preview{" "}
                <span className="text-muted-foreground">
                  — {TAB_SECTION[tab] ? `${TAB_SECTION[tab]} section highlighted` : "full page"}
                </span>
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title="Reload preview"
                  onClick={() => setReloadKey((k) => k + 1)}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title="Open in new tab"
                  onClick={() => window.open(previewUrl, "_blank", "noopener,noreferrer")}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <iframe
              key={reloadKey}
              ref={iframeRef}
              src={previewUrl}
              title="Campaign page preview"
              className="w-full h-[62vh] bg-background"
            />
          </div>
        )}
        </div>

        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label className="text-sm">Active campaign</Label>
              <p className="text-xs text-muted-foreground">
                When active, this page goes live and appears under Active Campaigns.
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" size="sm" onClick={resetAll}>
              <RotateCcw className="w-4 h-4 mr-2" /> Reset everything
            </Button>
            <Button size="sm" onClick={save} disabled={saving || loading}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save campaign
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
