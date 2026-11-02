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
import { readAboutUs, type WebsiteAboutUs } from "@/lib/blueFlameWebsite";

type Bullet = { label: string; text: string; icon: string };
type CardItem = { title: string; text: string; icon: string };
type Pledge = { title: string; text: string; icon: string };
type F = {
  enabled: boolean;
  hero_badge: string; hero_title: string; hero_intro: string;
  story_badge: string; story_title: string; story_p1: string; story_p2: string;
  story_bullets: Bullet[];
  card_title: string;
  card_items: CardItem[];
  pledges_badge: string; pledges_title: string; pledges_subtitle: string;
  pledges: Pledge[];
};
const str = (v: unknown, d = "") => (typeof v === "string" && v.trim() ? v : d);
const sections: Record<string, { title: string; fields: (keyof F)[] }> = {
  "page-heading": { title: "Page Heading", fields: ["enabled", "hero_badge", "hero_title", "hero_intro"] },
  "our-story": { title: "Our Story", fields: ["story_badge", "story_title", "story_p1", "story_p2", "story_bullets"] },
  "why-we-outperform": { title: "Why We Outperform", fields: ["card_title", "card_items"] },
  "pledges-ethics": { title: "Pledges & Ethics", fields: ["pledges_badge", "pledges_title", "pledges_subtitle", "pledges"] },
};

export default function AboutUsSettings() {
  const { companyId, section } = useParams<{ companyId: string; section: string }>();
  const currentSection = section ? sections[section] : undefined;
  const client = useQueryClient();
  const [data, setData] = useState<F | null>(null);
  const [saving, setSaving] = useState(false);
  const [pick, setPick] = useState<string | null>(null);

  const company = useQuery({
    queryKey: ["company-about-us", companyId], enabled: Boolean(companyId), staleTime: 30_000,
    queryFn: async () => {
      if (!companyId) throw new Error("Company required");
      const { data: row, error } = await supabase.from("companies").select("*").eq("id", companyId).single();
      if (error) throw error;
      return row as { name: string; about_us?: unknown };
    },
  });
  const template = useQuery({
    queryKey: ["about-us-template"], staleTime: Infinity,
    queryFn: async () => readAboutUs(await (await fetch("/blueflame-site/about.html")).text()),
  });

  useEffect(() => {
    if (!company.data || !template.data) return;
    const raw = company.data.about_us;
    const s = (raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {}) as WebsiteAboutUs;
    const t = template.data;
    const bullets = Array.isArray(s.story_bullets) ? s.story_bullets : [];
    const cards = Array.isArray(s.card_items) ? s.card_items : [];
    const pledges = Array.isArray(s.pledges) ? s.pledges : [];
    setData({
      enabled: s.enabled !== false,
      hero_badge: str(s.hero_badge, t.hero_badge), hero_title: str(s.hero_title, t.hero_title), hero_intro: str(s.hero_intro, t.hero_intro),
      story_badge: str(s.story_badge, t.story_badge), story_title: str(s.story_title, t.story_title),
      story_p1: str(s.story_p1, t.story_p1), story_p2: str(s.story_p2, t.story_p2),
      story_bullets: Array.from({ length: Math.max(bullets.length, (t.story_bullets || []).length) }, (_, i) => ({
        label: str(bullets[i]?.label, t.story_bullets?.[i]?.label),
        text: str(bullets[i]?.text, t.story_bullets?.[i]?.text),
        icon: str(bullets[i]?.icon),
      })),
      card_title: str(s.card_title, t.card_title),
      card_items: Array.from({ length: Math.max(cards.length, (t.card_items || []).length) }, (_, i) => ({
        title: str(cards[i]?.title, t.card_items?.[i]?.title),
        text: str(cards[i]?.text, t.card_items?.[i]?.text),
        icon: str(cards[i]?.icon),
      })),
      pledges_badge: str(s.pledges_badge, t.pledges_badge), pledges_title: str(s.pledges_title, t.pledges_title), pledges_subtitle: str(s.pledges_subtitle, t.pledges_subtitle),
      pledges: Array.from({ length: Math.max(pledges.length, (t.pledges || []).length) }, (_, i) => ({
        title: str(pledges[i]?.title, t.pledges?.[i]?.title),
        text: str(pledges[i]?.text, t.pledges?.[i]?.text),
        icon: str(pledges[i]?.icon),
      })),
    });
    setPick(null);
  }, [company.data, template.data, section]);

  const setBullet = (i: number, p: Partial<Bullet>) => setData(d => d && ({ ...d, story_bullets: d.story_bullets.map((x, j) => j === i ? { ...x, ...p } : x) }));
  const setCard = (i: number, p: Partial<CardItem>) => setData(d => d && ({ ...d, card_items: d.card_items.map((x, j) => j === i ? { ...x, ...p } : x) }));
  const setPledge = (i: number, p: Partial<Pledge>) => setData(d => d && ({ ...d, pledges: d.pledges.map((x, j) => j === i ? { ...x, ...p } : x) }));

  const onPick = (url: string) => {
    if (!pick) return;
    const [kind, n] = pick.split("-");
    const i = Number(n);
    if (kind === "bullet") setBullet(i, { icon: url });
    else if (kind === "card") setCard(i, { icon: url });
    else if (kind === "pledge") setPledge(i, { icon: url });
    setPick(null);
  };

  const save = async () => {
    if (!companyId || !data || !currentSection) return;
    setSaving(true);
    try {
      const { data: latest, error: readError } = await supabase.from("companies").select("about_us").eq("id", companyId).single();
      if (readError) throw readError;
      const raw = latest.about_us;
      const existing = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
      const changes = Object.fromEntries(currentSection.fields.map(field => [field, data[field]]));
      const { error } = await supabase.from("companies").update({ about_us: JSON.parse(JSON.stringify({ ...existing, ...changes })) } as never).eq("id", companyId).select("id").single();
      if (error) throw error;
      await client.invalidateQueries({ queryKey: ["company-about-us", companyId] });
      toast.success(`${currentSection.title} saved`);
    } catch { toast.error("Could not save About Us"); }
    finally { setSaving(false); }
  };

  if (!currentSection && companyId) return <Navigate to={`/admin/page-builder/company/${companyId}/about-us/page-heading`} replace />;
  if (company.isError || template.isError) return <div className="space-y-4"><p className="text-destructive">Could not load this section.</p><Button variant="outline" onClick={() => { company.refetch(); template.refetch(); }}>Retry</Button></div>;
  if (!data) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const iconRow = (icon: string, kind: string, i: number, clear: () => void) => (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border bg-muted">
        {icon ? <img src={icon} alt="Icon" className="h-full w-full object-contain" /> : <ImageIcon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => setPick(`${kind}-${i}`)}>{icon ? "Change icon" : "Choose icon"}</Button>
      {icon && <Button type="button" variant="ghost" size="icon" aria-label="Remove icon" onClick={clear}><X className="h-4 w-4" /></Button>}
    </div>
  );

  return <div className="space-y-8">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div><p className="text-sm text-muted-foreground">About Us</p><h1 className="text-2xl font-bold">{currentSection?.title}</h1><p className="text-muted-foreground">{company.data?.name}</p></div>
      {section === "page-heading" && <div className="flex items-center gap-2"><Label htmlFor="about-enabled">Show on website</Label><Switch id="about-enabled" checked={data.enabled} onCheckedChange={enabled => setData(d => d && ({ ...d, enabled }))} /></div>}
    </header>

    {section === "page-heading" && <section className="space-y-4">
      <h2 className="font-semibold">Page heading</h2>
      <div className="space-y-2"><Label htmlFor="about-hero-badge">Badge text</Label><Input id="about-hero-badge" value={data.hero_badge} onChange={e => setData(d => d && ({ ...d, hero_badge: e.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="about-hero-title">Title</Label><Input id="about-hero-title" value={data.hero_title} onChange={e => setData(d => d && ({ ...d, hero_title: e.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="about-hero-intro">Intro paragraph</Label><Textarea id="about-hero-intro" rows={3} value={data.hero_intro} onChange={e => setData(d => d && ({ ...d, hero_intro: e.target.value }))} /></div>
    </section>}

    {section === "our-story" && <section className="space-y-4">
      <h2 className="font-semibold">Our story</h2>
      <div className="space-y-2"><Label htmlFor="about-story-badge">Badge text</Label><Input id="about-story-badge" value={data.story_badge} onChange={e => setData(d => d && ({ ...d, story_badge: e.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="about-story-title">Title</Label><Input id="about-story-title" value={data.story_title} onChange={e => setData(d => d && ({ ...d, story_title: e.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="about-story-p1">First paragraph</Label><Textarea id="about-story-p1" rows={3} value={data.story_p1} onChange={e => setData(d => d && ({ ...d, story_p1: e.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="about-story-p2">Second paragraph</Label><Textarea id="about-story-p2" rows={3} value={data.story_p2} onChange={e => setData(d => d && ({ ...d, story_p2: e.target.value }))} /></div>
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Highlight bullets</h3>
        {data.story_bullets.map((b, i) => <div key={i} className="space-y-3 rounded-md border p-4">
          <p className="text-sm font-medium">Bullet {i + 1}</p>
          {iconRow(b.icon, "bullet", i, () => setBullet(i, { icon: "" }))}
          <Input aria-label={`Bullet ${i + 1} label`} placeholder="Label" value={b.label} onChange={e => setBullet(i, { label: e.target.value })} />
          <Input aria-label={`Bullet ${i + 1} text`} placeholder="Text" value={b.text} onChange={e => setBullet(i, { text: e.target.value })} />
        </div>)}
      </div>
    </section>}

    {section === "why-we-outperform" && <section className="space-y-4">
      <h2 className="font-semibold">Why we outperform card</h2>
      <div className="space-y-2"><Label htmlFor="about-card-title">Card title</Label><Input id="about-card-title" value={data.card_title} onChange={e => setData(d => d && ({ ...d, card_title: e.target.value }))} /></div>
      {data.card_items.map((it, i) => <div key={i} className="space-y-3 rounded-md border p-4">
        <p className="text-sm font-medium">Item {i + 1}</p>
        {iconRow(it.icon, "card", i, () => setCard(i, { icon: "" }))}
        <Input aria-label={`Card item ${i + 1} title`} placeholder="Title" value={it.title} onChange={e => setCard(i, { title: e.target.value })} />
        <Textarea aria-label={`Card item ${i + 1} text`} rows={2} placeholder="Text" value={it.text} onChange={e => setCard(i, { text: e.target.value })} />
      </div>)}
    </section>}

    {section === "pledges-ethics" && <section className="space-y-4">
      <h2 className="font-semibold">Pledges &amp; ethics</h2>
      <div className="space-y-2"><Label htmlFor="about-pledges-badge">Badge text</Label><Input id="about-pledges-badge" value={data.pledges_badge} onChange={e => setData(d => d && ({ ...d, pledges_badge: e.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="about-pledges-title">Title</Label><Input id="about-pledges-title" value={data.pledges_title} onChange={e => setData(d => d && ({ ...d, pledges_title: e.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="about-pledges-subtitle">Subtitle</Label><Input id="about-pledges-subtitle" value={data.pledges_subtitle} onChange={e => setData(d => d && ({ ...d, pledges_subtitle: e.target.value }))} /></div>
      {data.pledges.map((p, i) => <div key={i} className="space-y-3 rounded-md border p-4">
        <p className="text-sm font-medium">Pledge {i + 1}</p>
        {iconRow(p.icon, "pledge", i, () => setPledge(i, { icon: "" }))}
        <Input aria-label={`Pledge ${i + 1} title`} placeholder="Title" value={p.title} onChange={e => setPledge(i, { title: e.target.value })} />
        <Textarea aria-label={`Pledge ${i + 1} text`} rows={3} placeholder="Text" value={p.text} onChange={e => setPledge(i, { text: e.target.value })} />
      </div>)}
    </section>}

    <FileManagerPicker open={pick !== null} onOpenChange={o => { if (!o) setPick(null); }} accept="image/*" title="Select Icon" onSelect={onPick} />
    <div className="flex justify-end"><Button onClick={save} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save {currentSection?.title}</Button></div>
  </div>;
}
