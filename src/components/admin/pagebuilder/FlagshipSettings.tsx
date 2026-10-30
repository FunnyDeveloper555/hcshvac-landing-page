import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
import { readFlagship, type WebsiteFlagship } from "@/lib/blueFlameWebsite";

type Bullet = { label: string; text: string; icon: string };
type F = { enabled: boolean; badge: string; title: string; intro: string; bullets: Bullet[]; button_text: string; button_link: string; image: string; preview_label: string; efficiency: string; caption: string };
type TextKey = "badge" | "title" | "intro" | "button_text" | "button_link" | "preview_label" | "efficiency" | "caption";
const str = (v: unknown, d = "") => (typeof v === "string" && v.trim() ? v : d);

function Picker({ url, onPick, onClear, big }: { url: string; onPick: () => void; onClear: () => void; big?: boolean }) {
  return <div className="flex items-center gap-3">
    <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted ${big ? "h-24 w-24" : "h-10 w-10"}`}>
      {url ? <img src={url} alt="Selected" className="h-full w-full object-contain" /> : <ImageIcon className="h-4 w-4 text-muted-foreground" />}
    </div>
    <Button variant="outline" size="sm" onClick={onPick}>{url ? "Change" : big ? "Choose image" : "Choose icon"}</Button>
    {url && <Button variant="ghost" size="icon" aria-label="Remove" onClick={onClear}><X className="h-4 w-4" /></Button>}
  </div>;
}

export default function FlagshipSettings() {
  const { companyId } = useParams<{ companyId: string }>();
  const client = useQueryClient();
  const [data, setData] = useState<F | null>(null);
  const [saving, setSaving] = useState(false);
  const [pick, setPick] = useState<number | "image" | null>(null);

  const company = useQuery({
    queryKey: ["company-flagship", companyId], enabled: Boolean(companyId), staleTime: 30_000,
    queryFn: async () => {
      const { data: row, error } = await supabase.from("companies").select("name, flagship").eq("id", companyId!).single();
      if (error) throw error;
      return row;
    },
  });
  const template = useQuery({
    queryKey: ["flagship-template"], staleTime: Infinity,
    queryFn: async () => readFlagship(await (await fetch("/blueflame-site/index.html")).text()),
  });

  useEffect(() => {
    if (!company.data || !template.data) return;
    const raw = company.data.flagship;
    const s = (raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {}) as WebsiteFlagship;
    const t = template.data;
    setData({
      enabled: s.enabled !== false,
      badge: str(s.badge, t.badge), title: str(s.title, t.title), intro: str(s.intro, t.intro),
      bullets: (t.bullets || []).map((b, i) => ({ label: str(s.bullets?.[i]?.label, b.label), text: str(s.bullets?.[i]?.text, b.text), icon: str(s.bullets?.[i]?.icon) })),
      button_text: str(s.button_text, t.button_text), button_link: str(s.button_link, t.button_link),
      image: str(s.image), preview_label: str(s.preview_label, t.preview_label), efficiency: str(s.efficiency, t.efficiency), caption: str(s.caption, t.caption),
    });
  }, [company.data, template.data]);

  const setField = (k: TextKey, v: string) => setData(d => d && ({ ...d, [k]: v }));
  const setBullet = (i: number, p: Partial<Bullet>) => setData(d => d && ({ ...d, bullets: d.bullets.map((b, x) => x === i ? { ...b, ...p } : b) }));

  const save = async () => {
    if (!companyId || !data) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("companies").update({ flagship: JSON.parse(JSON.stringify(data)) }).eq("id", companyId).select("id").single();
      if (error) throw error;
      await client.invalidateQueries({ queryKey: ["company-flagship", companyId] });
      toast.success("Flagship product saved");
    } catch { toast.error("Could not save flagship product"); }
    finally { setSaving(false); }
  };

  if (company.isError || template.isError) return <div className="space-y-4"><p className="text-destructive">Could not load this section.</p><Button variant="outline" onClick={() => { company.refetch(); template.refetch(); }}>Retry</Button></div>;
  if (!data) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const field = (k: TextKey, label: string, area = false) => <div className="space-y-2">
    <Label htmlFor={`fs-${k}`}>{label}</Label>
    {area ? <Textarea id={`fs-${k}`} rows={4} value={data[k]} onChange={e => setField(k, e.target.value)} /> : <Input id={`fs-${k}`} value={data[k]} onChange={e => setField(k, e.target.value)} />}
  </div>;

  return <div className="space-y-8">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-2xl font-bold">Flagship Product</h1><p className="text-muted-foreground">{company.data?.name}</p></div>
      <div className="flex items-center gap-2"><Label htmlFor="fs-enabled">Show on website</Label><Switch id="fs-enabled" checked={data.enabled} onCheckedChange={enabled => setData(d => d && ({ ...d, enabled }))} /></div>
    </header>
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-4 rounded-md border p-5">
        <h2 className="font-semibold">Text</h2>
        {field("badge", "Badge text")}
        {field("title", "Title")}
        {field("intro", "Intro paragraph", true)}
        {data.bullets.map((b, i) => <div key={i} className="space-y-2 rounded-md border p-3">
          <p className="text-sm font-medium">Feature {i + 1}</p>
          <Picker url={b.icon} onPick={() => setPick(i)} onClear={() => setBullet(i, { icon: "" })} />
          <Input aria-label={`Feature ${i + 1} label`} value={b.label} onChange={e => setBullet(i, { label: e.target.value })} />
          <Input aria-label={`Feature ${i + 1} text`} value={b.text} onChange={e => setBullet(i, { text: e.target.value })} />
        </div>)}
        {field("button_text", "Button text")}
        {field("button_link", "Button link")}
      </section>
      <section className="space-y-4 rounded-md border p-5">
        <h2 className="font-semibold">Product image</h2>
        <Picker big url={data.image} onPick={() => setPick("image")} onClear={() => setData(d => d && ({ ...d, image: "" }))} />
        <p className="text-xs text-muted-foreground">Leave empty to keep the template's furnace image.</p>
        {field("preview_label", "Image badge")}
        {field("efficiency", "Efficiency badge")}
        {field("caption", "Caption under image", true)}
      </section>
    </div>
    <FileManagerPicker open={pick !== null} onOpenChange={o => { if (!o) setPick(null); }} accept="image/*" title={pick === "image" ? "Select Product Image" : "Select Feature Icon"}
      onSelect={url => { if (pick === "image") setData(d => d && ({ ...d, image: url })); else if (typeof pick === "number") setBullet(pick, { icon: url }); setPick(null); }} />
    <div className="flex justify-end"><Button onClick={save} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save Flagship Product</Button></div>
  </div>;
}
