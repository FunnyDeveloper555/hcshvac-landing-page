import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FileManagerPicker } from "@/components/admin/filemanager/FileManagerPicker";
import { ImageIcon, Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { readAirQuality, type WebsiteAirQuality } from "@/lib/blueFlameWebsite";

type Pillar = { icon: string; pollutant: string; title: string; text: string; bullets: string[] };
type F = {
  enabled: boolean;
  hero_badge: string; hero_title: string; hero_intro: string;
  hero_button1: string; hero_button2: string;
  pillars_badge: string; pillars_title: string; pillars_subtitle: string;
  pillars: Pillar[];
  audit_badge: string; audit_title: string; audit_text: string;
  audit_bullets: string[];
  audit_form_title: string; audit_form_button: string;
};
const str = (v: unknown, d = "") => (typeof v === "string" && v.trim() ? v : d);
const sections: Record<string, { title: string; fields: (keyof F)[] }> = {
  "page-heading": { title: "Page Heading", fields: ["enabled", "hero_badge", "hero_title", "hero_intro", "hero_button1", "hero_button2"] },
  "iaq-pillars": { title: "IAQ Pillars", fields: ["pillars_badge", "pillars_title", "pillars_subtitle", "pillars"] },
  "audit-offer": { title: "Audit Offer", fields: ["audit_badge", "audit_title", "audit_text", "audit_bullets", "audit_form_title", "audit_form_button"] },
};

export default function AirQualitySettings() {
  const { companyId, section } = useParams<{ companyId: string; section: string }>();
  const currentSection = section ? sections[section] : undefined;
  const client = useQueryClient();
  const [data, setData] = useState<F | null>(null);
  const [saving, setSaving] = useState(false);
  const [pick, setPick] = useState<number | null>(null);

  const company = useQuery({
    queryKey: ["company-air-quality", companyId], enabled: Boolean(companyId), staleTime: 30_000,
    queryFn: async () => {
      if (!companyId) throw new Error("Company required");
      const { data: row, error } = await supabase.from("companies").select("*").eq("id", companyId).single();
      if (error) throw error;
      return row as { name: string; air_quality?: unknown };
    },
  });
  const template = useQuery({
    queryKey: ["air-quality-template"], staleTime: Infinity,
    queryFn: async () => readAirQuality(await (await fetch("/blueflame-site/air-quality.html")).text()),
  });

  useEffect(() => {
    if (!company.data || !template.data) return;
    const raw = company.data.air_quality;
    const s = (raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {}) as WebsiteAirQuality;
    const t = template.data;
    const pillars = Array.isArray(s.pillars) ? s.pillars : [];
    const auditBullets = Array.isArray(s.audit_bullets) ? s.audit_bullets : [];
    setData({
      enabled: s.enabled !== false,
      hero_badge: str(s.hero_badge, t.hero_badge), hero_title: str(s.hero_title, t.hero_title), hero_intro: str(s.hero_intro, t.hero_intro),
      hero_button1: str(s.hero_button1, t.hero_button1), hero_button2: str(s.hero_button2, t.hero_button2),
      pillars_badge: str(s.pillars_badge, t.pillars_badge), pillars_title: str(s.pillars_title, t.pillars_title), pillars_subtitle: str(s.pillars_subtitle, t.pillars_subtitle),
      pillars: Array.from({ length: Math.max(pillars.length, (t.pillars || []).length) }, (_, i) => ({
        icon: str(pillars[i]?.icon),
        pollutant: str(pillars[i]?.pollutant, t.pillars?.[i]?.pollutant),
        title: str(pillars[i]?.title, t.pillars?.[i]?.title),
        text: str(pillars[i]?.text, t.pillars?.[i]?.text),
        bullets: Array.from({ length: Math.max(pillars[i]?.bullets?.length || 0, t.pillars?.[i]?.bullets?.length || 0) }, (_, j) => str(pillars[i]?.bullets?.[j], t.pillars?.[i]?.bullets?.[j])),
      })),
      audit_badge: str(s.audit_badge, t.audit_badge), audit_title: str(s.audit_title, t.audit_title), audit_text: str(s.audit_text, t.audit_text),
      audit_bullets: Array.from({ length: Math.max(auditBullets.length, (t.audit_bullets || []).length) }, (_, j) => str(auditBullets[j], t.audit_bullets?.[j])),
      audit_form_title: str(s.audit_form_title, t.audit_form_title), audit_form_button: str(s.audit_form_button, t.audit_form_button),
    });
    setPick(null);
  }, [company.data, template.data, section]);

  const setPillar = (i: number, p: Partial<Pillar>) => setData(d => d && ({ ...d, pillars: d.pillars.map((x, j) => j === i ? { ...x, ...p } : x) }));

  const save = async () => {
    if (!companyId || !data || !currentSection) return;
    setSaving(true);
    try {
      const { data: latest, error: readError } = await supabase.from("companies").select("air_quality").eq("id", companyId).single();
      if (readError) throw readError;
      const raw = latest.air_quality;
      const existing = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
      const changes = Object.fromEntries(currentSection.fields.map(field => [field, data[field]]));
      const { error } = await supabase.from("companies").update({ air_quality: JSON.parse(JSON.stringify({ ...existing, ...changes })) } as never).eq("id", companyId).select("id").single();
      if (error) throw error;
      await client.invalidateQueries({ queryKey: ["company-air-quality", companyId] });
      toast.success(`${currentSection.title} saved`);
    } catch { toast.error("Could not save Air Quality"); }
    finally { setSaving(false); }
  };

  if (!currentSection && companyId) return <Navigate to={`/admin/page-builder/company/${companyId}/air-quality/page-heading`} replace />;
  if (company.isError || template.isError) return <div className="space-y-4"><p className="text-destructive">Could not load this section.</p><Button variant="outline" onClick={() => { company.refetch(); template.refetch(); }}>Retry</Button></div>;
  if (!data) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return <div className="space-y-8">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div><p className="text-sm text-muted-foreground">Air Quality</p><h1 className="text-2xl font-bold">{currentSection?.title}</h1><p className="text-muted-foreground">{company.data?.name}</p></div>
      {section === "page-heading" && <div className="flex items-center gap-2"><Label htmlFor="aq-enabled">Show on website</Label><Switch id="aq-enabled" checked={data.enabled} onCheckedChange={enabled => setData(d => d && ({ ...d, enabled }))} /></div>}
    </header>

    {section === "page-heading" && <section className="space-y-4">
      <h2 className="font-semibold">Page heading</h2>
      <div className="space-y-2"><Label htmlFor="aq-hero-badge">Badge text</Label><Input id="aq-hero-badge" value={data.hero_badge} onChange={e => setData(d => d && ({ ...d, hero_badge: e.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="aq-hero-title">Title</Label><Input id="aq-hero-title" value={data.hero_title} onChange={e => setData(d => d && ({ ...d, hero_title: e.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="aq-hero-intro">Intro paragraph</Label><Textarea id="aq-hero-intro" rows={3} value={data.hero_intro} onChange={e => setData(d => d && ({ ...d, hero_intro: e.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="aq-hero-btn1">Main button text</Label><Input id="aq-hero-btn1" value={data.hero_button1} onChange={e => setData(d => d && ({ ...d, hero_button1: e.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="aq-hero-btn2">Second button text</Label><Input id="aq-hero-btn2" value={data.hero_button2} onChange={e => setData(d => d && ({ ...d, hero_button2: e.target.value }))} /></div>
    </section>}

    {section === "iaq-pillars" && <section className="space-y-4">
      <h2 className="font-semibold">Section heading</h2>
      <div className="space-y-2"><Label htmlFor="aq-pillars-badge">Badge text</Label><Input id="aq-pillars-badge" value={data.pillars_badge} onChange={e => setData(d => d && ({ ...d, pillars_badge: e.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="aq-pillars-title">Title</Label><Input id="aq-pillars-title" value={data.pillars_title} onChange={e => setData(d => d && ({ ...d, pillars_title: e.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="aq-pillars-subtitle">Subtitle</Label><Textarea id="aq-pillars-subtitle" rows={2} value={data.pillars_subtitle} onChange={e => setData(d => d && ({ ...d, pillars_subtitle: e.target.value }))} /></div>
      <h2 className="font-semibold">Pillar cards</h2>
      {data.pillars.map((p, i) => <div key={i} className="space-y-3 rounded-md border p-4">
        <p className="text-sm font-medium">Pillar {i + 1}</p>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border bg-muted">
            {p.icon ? <img src={p.icon} alt="Icon" className="h-full w-full object-contain" /> : <ImageIcon className="h-4 w-4 text-muted-foreground" />}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setPick(i)}>{p.icon ? "Change icon" : "Choose icon"}</Button>
          {p.icon && <Button type="button" variant="ghost" size="icon" aria-label="Remove icon" onClick={() => setPillar(i, { icon: "" })}><X className="h-4 w-4" /></Button>}
        </div>
        <Input aria-label={`Pillar ${i + 1} pollutant badge`} placeholder="Pollutant badge (e.g. Viruses • Mold • Dust)" value={p.pollutant} onChange={e => setPillar(i, { pollutant: e.target.value })} />
        <Input aria-label={`Pillar ${i + 1} title`} placeholder="Title" value={p.title} onChange={e => setPillar(i, { title: e.target.value })} />
        <Textarea aria-label={`Pillar ${i + 1} description`} rows={2} placeholder="Description" value={p.text} onChange={e => setPillar(i, { text: e.target.value })} />
        {p.bullets.map((b, j) => <Input key={j} aria-label={`Pillar ${i + 1} bullet ${j + 1}`} placeholder={`Bullet ${j + 1}`} value={b} onChange={e => setPillar(i, { bullets: p.bullets.map((x, k) => k === j ? e.target.value : x) })} />)}
      </div>)}
    </section>}

    {section === "audit-offer" && <section className="space-y-4">
      <h2 className="font-semibold">Audit offer</h2>
      <div className="space-y-2"><Label htmlFor="aq-audit-badge">Badge text</Label><Input id="aq-audit-badge" value={data.audit_badge} onChange={e => setData(d => d && ({ ...d, audit_badge: e.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="aq-audit-title">Title</Label><Input id="aq-audit-title" value={data.audit_title} onChange={e => setData(d => d && ({ ...d, audit_title: e.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="aq-audit-text">Description</Label><Textarea id="aq-audit-text" rows={3} value={data.audit_text} onChange={e => setData(d => d && ({ ...d, audit_text: e.target.value }))} /></div>
      <h2 className="font-semibold">What's included</h2>
      {data.audit_bullets.map((b, j) => <Input key={j} aria-label={`Included item ${j + 1}`} placeholder={`Item ${j + 1}`} value={b} onChange={e => setData(d => d && ({ ...d, audit_bullets: d.audit_bullets.map((x, k) => k === j ? e.target.value : x) }))} />)}
      <h2 className="font-semibold">Booking form</h2>
      <div className="space-y-2"><Label htmlFor="aq-audit-form-title">Form title</Label><Input id="aq-audit-form-title" value={data.audit_form_title} onChange={e => setData(d => d && ({ ...d, audit_form_title: e.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="aq-audit-form-button">Submit button text</Label><Input id="aq-audit-form-button" value={data.audit_form_button} onChange={e => setData(d => d && ({ ...d, audit_form_button: e.target.value }))} /></div>
    </section>}

    <FileManagerPicker open={pick !== null} onOpenChange={o => { if (!o) setPick(null); }} accept="image/*" title="Select Icon" onSelect={url => { if (pick !== null) setPillar(pick, { icon: url }); setPick(null); }} />
    <div className="flex justify-end"><Button onClick={save} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save {currentSection?.title}</Button></div>
  </div>;
}
