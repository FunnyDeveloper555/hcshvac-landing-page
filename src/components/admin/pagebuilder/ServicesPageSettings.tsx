import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { readServicesPage, SERVICES_SECTIONS, type ServicesSection, type WebsiteServicesPage } from "@/lib/blueFlameServicesPage";

const str = (v: unknown, d = "") => (typeof v === "string" && v.trim() ? v : d);
const asObj = (raw: unknown) => (raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {}) as WebsiteServicesPage;

export default function ServicesPageSettings() {
  const { companyId, section } = useParams<{ companyId: string; section: string }>();
  const def = SERVICES_SECTIONS.find(s => s.key === section);
  const client = useQueryClient();
  const [data, setData] = useState<ServicesSection | null>(null);
  const [saving, setSaving] = useState(false);

  const company = useQuery({
    queryKey: ["company-services-page", companyId], enabled: Boolean(companyId), staleTime: 30_000,
    queryFn: async () => {
      const { data: row, error } = await supabase.from("companies").select("*").eq("id", companyId!).single();
      if (error) throw error;
      return row as { name: string; services_page?: unknown };
    },
  });
  const template = useQuery({
    queryKey: ["services-page-template"], staleTime: Infinity,
    queryFn: async () => readServicesPage(await (await fetch("/blueflame-site/services.html")).text()),
  });

  useEffect(() => {
    if (!company.data || !template.data || !def) return;
    const s = asObj(company.data.services_page)[def.key] || {};
    const t = template.data[def.key] || {};
    const tCards = t.cards || [];
    const sCards = Array.isArray(s.cards) ? s.cards : [];
    setData({
      enabled: s.enabled !== false,
      badge: str(s.badge, t.badge), title: str(s.title, t.title), subtitle: str(s.subtitle, t.subtitle),
      buttons: (t.buttons || []).map((b, i) => str(s.buttons?.[i], b)),
      cards: tCards.map((tc, i) => {
        const sc = sCards[i] || {};
        const out: Record<string, string | string[]> = {};
        Object.keys(tc).forEach(k => {
          out[k] = Array.isArray(tc[k])
            ? (tc[k] as string[]).map((b, j) => str((sc[k] as string[] | undefined)?.[j], b))
            : str(sc[k], tc[k] as string);
        });
        return out;
      }),
    });
  }, [company.data, template.data, def]);

  const setCard = (i: number, key: string, value: string | string[]) =>
    setData(d => d && ({ ...d, cards: (d.cards || []).map((c, j) => (j === i ? { ...c, [key]: value } : c)) }));

  const save = async () => {
    if (!companyId || !data || !def) return;
    setSaving(true);
    try {
      const { data: latest, error: readError } = await supabase.from("companies").select("services_page" as never).eq("id", companyId).single();
      if (readError) throw readError;
      const existing = asObj((latest as { services_page?: unknown }).services_page);
      const next = { ...existing, [def.key]: data };
      const { error } = await supabase.from("companies").update({ services_page: JSON.parse(JSON.stringify(next)) } as never).eq("id", companyId).select("id").single();
      if (error) throw error;
      await client.invalidateQueries({ queryKey: ["company-services-page", companyId] });
      toast.success(`${def.title} saved`);
    } catch { toast.error("Could not save Service Page"); }
    finally { setSaving(false); }
  };

  if (!def && companyId) return <Navigate to={`/admin/page-builder/company/${companyId}/services-page/page-heading`} replace />;
  if (company.isError || template.isError) return <div className="space-y-4"><p className="text-destructive">Could not load this section.</p><Button variant="outline" onClick={() => { company.refetch(); template.refetch(); }}>Retry</Button></div>;
  if (!data || !def) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return <div className="space-y-8">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div><p className="text-sm text-muted-foreground">Service Page</p><h1 className="text-2xl font-bold">{def.title}</h1><p className="text-muted-foreground">{company.data?.name}</p></div>
      <div className="flex items-center gap-2"><Label htmlFor="sp-enabled">Show on website</Label><Switch id="sp-enabled" checked={data.enabled !== false} onCheckedChange={enabled => setData(d => d && ({ ...d, enabled }))} /></div>
    </header>

    <section className="space-y-4">
      <h2 className="font-semibold">Section heading</h2>
      <div className="space-y-2"><Label htmlFor="sp-badge">Badge text</Label><Input id="sp-badge" value={data.badge || ""} onChange={e => setData(d => d && ({ ...d, badge: e.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="sp-title">Title</Label><Input id="sp-title" value={data.title || ""} onChange={e => setData(d => d && ({ ...d, title: e.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="sp-sub">{def.hero ? "Intro paragraph" : "Subtitle"}</Label><Textarea id="sp-sub" rows={3} value={data.subtitle || ""} onChange={e => setData(d => d && ({ ...d, subtitle: e.target.value }))} /></div>
      {(data.buttons || []).map((b, i) => <div key={i} className="space-y-2"><Label htmlFor={`sp-btn-${i}`}>Button {i + 1} text</Label><Input id={`sp-btn-${i}`} value={b} onChange={e => setData(d => d && ({ ...d, buttons: (d.buttons || []).map((x, j) => (j === i ? e.target.value : x)) }))} /></div>)}
    </section>

    {def.fields && (data.cards || []).map((card, i) => <section key={i} className="space-y-4 rounded-lg border p-4">
      <h2 className="font-semibold">{def.cardLabel} {i + 1}</h2>
      {def.fields!.map(f => <div key={f.key} className="space-y-2">
        <Label htmlFor={`sp-${i}-${f.key}`}>{f.label}</Label>
        {f.long
          ? <Textarea id={`sp-${i}-${f.key}`} rows={3} value={(card[f.key] as string) || ""} onChange={e => setCard(i, f.key, e.target.value)} />
          : <Input id={`sp-${i}-${f.key}`} value={(card[f.key] as string) || ""} onChange={e => setCard(i, f.key, e.target.value)} />}
      </div>)}
      {Array.isArray(card.bullets) && card.bullets.map((b, j) => <div key={j} className="space-y-2">
        <Label htmlFor={`sp-${i}-b-${j}`}>Bullet {j + 1}</Label>
        <Input id={`sp-${i}-b-${j}`} value={b} onChange={e => setCard(i, "bullets", (card.bullets as string[]).map((x, k) => (k === j ? e.target.value : x)))} />
      </div>)}
    </section>)}

    <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save {def.title}</Button>
  </div>;
}
