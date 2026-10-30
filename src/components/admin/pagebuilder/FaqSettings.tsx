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
import { ChevronDown, ChevronUp, ImageIcon, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { faqWanted, readFaq, type WebsiteFaq } from "@/lib/blueFlameWebsite";

type Item = { question: string; answer: string; icon: string };
type F = { enabled: boolean; badge: string; title: string; subtitle: string; items: Item[] };
const str = (v: unknown, d = "") => (typeof v === "string" && v.trim() ? v : d);

export default function FaqSettings() {
  const { companyId } = useParams<{ companyId: string }>();
  const client = useQueryClient();
  const [data, setData] = useState<F | null>(null);
  const [saving, setSaving] = useState(false);
  const [pick, setPick] = useState<number | null>(null);

  const company = useQuery({
    queryKey: ["company-faq", companyId], enabled: Boolean(companyId), staleTime: 30_000,
    queryFn: async () => {
      const { data: row, error } = await supabase.from("companies").select("*").eq("id", companyId!).single();
      if (error) throw error;
      return row as { name: string; faq?: unknown };
    },
  });
  const template = useQuery({
    queryKey: ["faq-template"], staleTime: Infinity,
    queryFn: async () => readFaq(await (await fetch("/blueflame-site/index.html")).text()),
  });

  useEffect(() => {
    if (!company.data || !template.data) return;
    const raw = company.data.faq;
    const s = (raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {}) as WebsiteFaq;
    const t = template.data;
    const saved = Array.isArray(s.items) ? s.items : [];
    const count = Math.max(saved.length, (t.items || []).length);
    setData({
      enabled: s.enabled !== false,
      badge: str(s.badge, t.badge), title: str(s.title, t.title), subtitle: str(s.subtitle, t.subtitle),
      items: Array.from({ length: count }, (_, i) => ({
        question: str(saved[i]?.question, t.items?.[i]?.question),
        answer: str(saved[i]?.answer, t.items?.[i]?.answer),
        icon: str(saved[i]?.icon),
      })),
    });
  }, [company.data, template.data]);

  const setItem = (i: number, p: Partial<Item>) => setData(d => d && ({ ...d, items: d.items.map((x, j) => j === i ? { ...x, ...p } : x) }));
  const addItem = () => setData(d => d && ({ ...d, items: [...d.items, { question: "", answer: "", icon: "" }] }));
  const removeItem = (i: number) => setData(d => d && ({ ...d, items: d.items.filter((_, j) => j !== i) }));
  const moveItem = (i: number, dir: -1 | 1) => setData(d => {
    if (!d) return d;
    const j = i + dir;
    if (j < 0 || j >= d.items.length) return d;
    const items = [...d.items];
    [items[i], items[j]] = [items[j], items[i]];
    return { ...d, items };
  });

  const save = async () => {
    if (!companyId || !data) return;
    const kept = faqWanted(data.items) as Item[];
    setSaving(true);
    try {
      const { error } = await supabase.from("companies").update({ faq: JSON.parse(JSON.stringify({ ...data, items: kept })) } as never).eq("id", companyId).select("id").single();
      if (error) throw error;
      setData({ ...data, items: kept });
      await client.invalidateQueries({ queryKey: ["company-faq", companyId] });
      toast.success(`FAQ saved with ${kept.length} question${kept.length === 1 ? "" : "s"}`);
    } catch { toast.error("Could not save FAQ"); }
    finally { setSaving(false); }
  };

  if (company.isError || template.isError) return <div className="space-y-4"><p className="text-destructive">Could not load this section.</p><Button variant="outline" onClick={() => { company.refetch(); template.refetch(); }}>Retry</Button></div>;
  if (!data) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return <div className="space-y-8">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-2xl font-bold">FAQ</h1><p className="text-muted-foreground">{company.data?.name}</p></div>
      <div className="flex items-center gap-2"><Label htmlFor="faq-enabled">Show on website</Label><Switch id="faq-enabled" checked={data.enabled} onCheckedChange={enabled => setData(d => d && ({ ...d, enabled }))} /></div>
    </header>
    <section className="space-y-4 rounded-md border p-5">
      <h2 className="font-semibold">Section heading</h2>
      {(["badge", "title", "subtitle"] as const).map(k => <div key={k} className="space-y-2">
        <Label htmlFor={`faq-${k}`}>{k === "badge" ? "Badge text" : k === "title" ? "Title" : "Subtitle"}</Label>
        <Input id={`faq-${k}`} value={data[k]} onChange={e => setData(d => d && ({ ...d, [k]: e.target.value }))} />
      </div>)}
    </section>
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Questions <span className="text-sm font-normal text-muted-foreground">({data.items.length})</span></h2>
        <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="mr-2 h-4 w-4" />Add question</Button>
      </div>
      {data.items.length === 0 && <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">No questions yet. Use "Add question" to create one.</p>}
      {data.items.map((it, i) => <div key={i} className="space-y-3 rounded-md border p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">Question {i + 1}</p>
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="icon" aria-label={`Move question ${i + 1} up`} title="Move up" disabled={i === 0} onClick={() => moveItem(i, -1)}><ChevronUp className="h-4 w-4" /></Button>
            <Button type="button" variant="ghost" size="icon" aria-label={`Move question ${i + 1} down`} title="Move down" disabled={i === data.items.length - 1} onClick={() => moveItem(i, 1)}><ChevronDown className="h-4 w-4" /></Button>
            <Button type="button" variant="ghost" size="icon" aria-label={`Remove question ${i + 1}`} title="Remove" className="text-destructive" onClick={() => removeItem(i)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border bg-muted">
            {it.icon ? <img src={it.icon} alt="Icon" className="h-full w-full object-contain" /> : <ImageIcon className="h-4 w-4 text-muted-foreground" />}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setPick(i)}>{it.icon ? "Change icon" : "Choose icon"}</Button>
          {it.icon && <Button type="button" variant="ghost" size="icon" aria-label="Remove icon" onClick={() => setItem(i, { icon: "" })}><X className="h-4 w-4" /></Button>}
        </div>
        <Input aria-label={`Question ${i + 1}`} placeholder="Type a question" value={it.question} onChange={e => setItem(i, { question: e.target.value })} />
        <Textarea aria-label={`Answer ${i + 1}`} rows={3} placeholder="Type the answer visitors will see" value={it.answer} onChange={e => setItem(i, { answer: e.target.value })} />
      </div>)}
      {data.items.length > 0 && <Button type="button" variant="outline" className="w-full" onClick={addItem}><Plus className="mr-2 h-4 w-4" />Add another question</Button>}
    </section>
    <FileManagerPicker open={pick !== null} onOpenChange={o => { if (!o) setPick(null); }} accept="image/*" title="Select Question Icon"
      onSelect={url => { if (pick !== null) setItem(pick, { icon: url }); setPick(null); }} />
    <div className="flex justify-end"><Button onClick={save} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save FAQ</Button></div>
  </div>;
}
