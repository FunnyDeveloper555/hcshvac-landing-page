import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FileManagerPicker } from "@/components/admin/filemanager/FileManagerPicker";
import { ImageIcon, Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { readServiceGuides, type WebsiteServiceGuides } from "@/lib/blueFlameWebsite";

type Item = { title: string; text: string; icon: string };
type Column = { title: string; icon: string; items: Item[] };
type Guides = { enabled: boolean; badge: string; title: string; subtitle: string; columns: Column[] };
type Pick = { col: number; item: number | null } | null;

const str = (v: unknown, d = "") => (typeof v === "string" && v.trim() ? v : d);

function IconPicker({ url, onPick, onClear, label }: { url: string; onPick: () => void; onClear: () => void; label: string }) {
  return <div className="flex items-center gap-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
      {url ? <img src={url} alt="Selected icon" className="h-full w-full object-contain" /> : <ImageIcon className="h-4 w-4 text-muted-foreground" />}
    </div>
    <Button variant="outline" size="sm" onClick={onPick}>{url ? "Change icon" : "Choose icon"}</Button>
    {url && <Button variant="ghost" size="icon" aria-label={`Remove ${label} icon`} onClick={onClear}><X className="h-4 w-4" /></Button>}
  </div>;
}

export default function ServiceGuidesSettings() {
  const { companyId } = useParams<{ companyId: string }>();
  const client = useQueryClient();
  const [data, setData] = useState<Guides | null>(null);
  const [saving, setSaving] = useState(false);
  const [pick, setPick] = useState<Pick>(null);

  const company = useQuery({
    queryKey: ["company-service-guides", companyId],
    enabled: Boolean(companyId), staleTime: 30_000,
    queryFn: async () => {
      const { data: row, error } = await supabase.from("companies").select("name, service_guides").eq("id", companyId!).single();
      if (error) throw error;
      return row;
    },
  });
  const template = useQuery({
    queryKey: ["service-guides-template"], staleTime: Infinity,
    queryFn: async () => readServiceGuides(await (await fetch("/blueflame-site/index.html")).text()),
  });

  useEffect(() => {
    if (!company.data || !template.data) return;
    const raw = company.data.service_guides;
    const s = (raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {}) as WebsiteServiceGuides;
    const t = template.data;
    setData({
      enabled: s.enabled !== false,
      badge: str(s.badge, t.badge), title: str(s.title, t.title), subtitle: str(s.subtitle, t.subtitle),
      columns: (t.columns || []).map((c, i) => {
        const sc = s.columns?.[i];
        return {
          title: str(sc?.title, c.title), icon: str(sc?.icon),
          items: (c.items || []).map((it, j) => {
            const si = sc?.items?.[j];
            return { title: str(si?.title, it.title), text: str(si?.text, it.text), icon: str(si?.icon) };
          }),
        };
      }),
    });
  }, [company.data, template.data]);

  const setCol = (i: number, patch: Partial<Column>) => setData(d => d && ({ ...d, columns: d.columns.map((c, x) => x === i ? { ...c, ...patch } : c) }));
  const setItem = (i: number, j: number, patch: Partial<Item>) => setData(d => d && ({ ...d, columns: d.columns.map((c, x) => x !== i ? c : { ...c, items: c.items.map((it, y) => y === j ? { ...it, ...patch } : it) }) }));

  const save = async () => {
    if (!companyId || !data) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("companies").update({ service_guides: data }).eq("id", companyId).select("id").single();
      if (error) throw error;
      await client.invalidateQueries({ queryKey: ["company-service-guides", companyId] });
      toast.success("Service guides saved");
    } catch { toast.error("Could not save service guides"); }
    finally { setSaving(false); }
  };

  if (company.isLoading || template.isLoading || (!data && !company.isError && !template.isError)) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (company.isError || template.isError || !data) return <div className="space-y-4"><p className="text-destructive">Could not load service guides.</p><Button variant="outline" onClick={() => { company.refetch(); template.refetch(); }}>Retry</Button></div>;

  return <div className="space-y-8">
    <header><h1 className="text-2xl font-bold">Service Guides</h1><p className="text-muted-foreground">{company.data?.name}</p></header>
    <section className="space-y-4 border-b pb-6">
      <div className="flex flex-wrap items-center justify-between gap-4"><h2 className="text-lg font-semibold">Section heading</h2><div className="flex items-center gap-2"><Label htmlFor="guides-enabled">Show on website</Label><Switch id="guides-enabled" checked={data.enabled} onCheckedChange={enabled => setData(d => d && ({ ...d, enabled }))} /></div></div>
      <div className="space-y-2"><Label htmlFor="guides-badge">Badge text</Label><Input id="guides-badge" value={data.badge} onChange={e => setData(d => d && ({ ...d, badge: e.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="guides-title">Title</Label><Input id="guides-title" value={data.title} onChange={e => setData(d => d && ({ ...d, title: e.target.value }))} /></div>
      <div className="space-y-2"><Label htmlFor="guides-subtitle">Subtitle</Label><Textarea id="guides-subtitle" value={data.subtitle} onChange={e => setData(d => d && ({ ...d, subtitle: e.target.value }))} /></div>
    </section>
    <div className="grid gap-6 lg:grid-cols-2">{data.columns.map((col, i) => <section key={i} className="space-y-4 rounded-md border p-5">
      <h2 className="font-semibold">Column {i + 1}</h2>
      <IconPicker url={col.icon} label={`column ${i + 1}`} onPick={() => setPick({ col: i, item: null })} onClear={() => setCol(i, { icon: "" })} />
      <div className="space-y-2"><Label htmlFor={`guides-col-${i}`}>Column title</Label><Input id={`guides-col-${i}`} value={col.title} onChange={e => setCol(i, { title: e.target.value })} /></div>
      <Accordion type="multiple" className="space-y-2">{col.items.map((it, j) => <AccordionItem key={j} value={`g-${i}-${j}`} className="rounded-md border px-4">
        <AccordionTrigger className="text-left text-sm">{it.title || `Guide ${j + 1}`}</AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4">
          <IconPicker url={it.icon} label={`guide ${j + 1}`} onPick={() => setPick({ col: i, item: j })} onClear={() => setItem(i, j, { icon: "" })} />
          <div className="space-y-1"><Label>Title</Label><Input value={it.title} onChange={e => setItem(i, j, { title: e.target.value })} /></div>
          <div className="space-y-1"><Label>Expanded text</Label><Textarea rows={5} value={it.text} onChange={e => setItem(i, j, { text: e.target.value })} /></div>
        </AccordionContent>
      </AccordionItem>)}</Accordion>
    </section>)}</div>
    <FileManagerPicker open={pick !== null} onOpenChange={open => { if (!open) setPick(null); }} accept="image/*" title="Select Guide Icon"
      onSelect={url => { if (pick) { if (pick.item === null) setCol(pick.col, { icon: url }); else setItem(pick.col, pick.item, { icon: url }); } setPick(null); }} />
    <div className="flex justify-end"><Button onClick={save} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save Service Guides</Button></div>
  </div>;
}
