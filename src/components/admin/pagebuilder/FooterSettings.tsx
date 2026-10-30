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
import { footerLinksWanted, readFooter, type WebsiteFooter } from "@/lib/blueFlameWebsite";

type L = { text: string; link: string };
type F = Required<Omit<WebsiteFooter, "services" | "quick_links">> & { services: L[]; quick_links: L[] };
const TEXT_KEYS = ["logo", "brand_name", "brand_tagline", "description", "services_title", "quick_title", "contact_title", "hq_label", "hq_text", "phone_label", "phone", "hours_label", "hours_text", "emergency_text", "copyright", "reference"] as const;
const str = (v: unknown, d = "") => (typeof v === "string" && v.trim() ? v : d);

export default function FooterSettings() {
  const { companyId } = useParams<{ companyId: string }>();
  const client = useQueryClient();
  const [data, setData] = useState<F | null>(null);
  const [saving, setSaving] = useState(false);
  const [pick, setPick] = useState(false);

  const company = useQuery({
    queryKey: ["company-footer", companyId], enabled: Boolean(companyId), staleTime: 30_000,
    queryFn: async () => {
      const { data: row, error } = await supabase.from("companies").select("*").eq("id", companyId!).single();
      if (error) throw error;
      return row as { name: string; footer?: unknown };
    },
  });
  const template = useQuery({
    queryKey: ["footer-template"], staleTime: Infinity,
    queryFn: async () => readFooter(await (await fetch("/blueflame-site/index.html")).text()),
  });

  useEffect(() => {
    if (!company.data || !template.data) return;
    const raw = company.data.footer;
    const s = (raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {}) as WebsiteFooter;
    const t = template.data;
    const links = (a?: WebsiteFooter["services"], b?: WebsiteFooter["services"]) =>
      (Array.isArray(a) ? a : b || []).map(l => ({ text: str(l?.text), link: str(l?.link) }));
    const next = { enabled: s.enabled !== false, services: links(s.services, t.services), quick_links: links(s.quick_links, t.quick_links) } as F;
    TEXT_KEYS.forEach(k => { (next as Record<string, unknown>)[k] = str(s[k], k === "logo" ? "" : str(t[k])); });
    setData(next);
  }, [company.data, template.data]);

  const set = (k: string, v: unknown) => setData(d => d && ({ ...d, [k]: v }));
  const setLinks = (k: "services" | "quick_links", fn: (l: L[]) => L[]) => setData(d => d && ({ ...d, [k]: fn(d[k]) }));

  const save = async () => {
    if (!companyId || !data) return;
    const clean = { ...data, services: footerLinksWanted(data.services) as L[], quick_links: footerLinksWanted(data.quick_links) as L[] };
    setSaving(true);
    try {
      const { error } = await supabase.from("companies").update({ footer: JSON.parse(JSON.stringify(clean)) } as never).eq("id", companyId).select("id").single();
      if (error) throw error;
      setData(clean);
      await client.invalidateQueries({ queryKey: ["company-footer", companyId] });
      toast.success("Footer saved");
    } catch { toast.error("Could not save Footer"); }
    finally { setSaving(false); }
  };

  if (company.isError || template.isError) return <div className="space-y-4"><p className="text-destructive">Could not load this section.</p><Button variant="outline" onClick={() => { company.refetch(); template.refetch(); }}>Retry</Button></div>;
  if (!data) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const field = (k: typeof TEXT_KEYS[number], label: string, area = false) => <div className="space-y-2">
    <Label htmlFor={`ft-${k}`}>{label}</Label>
    {area ? <Textarea id={`ft-${k}`} rows={3} value={data[k]} onChange={e => set(k, e.target.value)} />
      : <Input id={`ft-${k}`} value={data[k]} onChange={e => set(k, e.target.value)} />}
  </div>;

  const linkList = (k: "services" | "quick_links", titleKey: "services_title" | "quick_title", name: string) => <section className="space-y-3 rounded-md border p-5">
    <h2 className="font-semibold">{name} column <span className="text-sm font-normal text-muted-foreground">({data[k].length} links)</span></h2>
    {field(titleKey, "Column title")}
    {data[k].map((l, i) => <div key={i} className="flex items-center gap-2">
      <Input aria-label={`${name} link ${i + 1} text`} placeholder="Link text" value={l.text} onChange={e => setLinks(k, ls => ls.map((x, j) => j === i ? { ...x, text: e.target.value } : x))} />
      <Input aria-label={`${name} link ${i + 1} address`} placeholder="Link (e.g. services.html)" value={l.link} onChange={e => setLinks(k, ls => ls.map((x, j) => j === i ? { ...x, link: e.target.value } : x))} />
      <Button type="button" variant="ghost" size="icon" title="Move up" disabled={i === 0} onClick={() => setLinks(k, ls => { const a = [...ls]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; return a; })}><ChevronUp className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" title="Move down" disabled={i === data[k].length - 1} onClick={() => setLinks(k, ls => { const a = [...ls]; [a[i + 1], a[i]] = [a[i], a[i + 1]]; return a; })}><ChevronDown className="h-4 w-4" /></Button>
      <Button type="button" variant="ghost" size="icon" title="Remove" className="text-destructive" onClick={() => setLinks(k, ls => ls.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
    </div>)}
    <Button type="button" variant="outline" size="sm" onClick={() => setLinks(k, ls => [...ls, { text: "", link: "" }])}><Plus className="mr-2 h-4 w-4" />Add link</Button>
  </section>;

  return <div className="space-y-8">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-2xl font-bold">Footer</h1><p className="text-muted-foreground">{company.data?.name}</p></div>
      <div className="flex items-center gap-2"><Label htmlFor="ft-enabled">Show on website</Label><Switch id="ft-enabled" checked={data.enabled} onCheckedChange={v => set("enabled", v)} /></div>
    </header>
    <section className="space-y-4 rounded-md border p-5">
      <h2 className="font-semibold">Brand</h2>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border bg-muted">
          {data.logo ? <img src={data.logo} alt="Logo" className="h-full w-full object-contain" /> : <ImageIcon className="h-4 w-4 text-muted-foreground" />}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setPick(true)}>{data.logo ? "Change logo" : "Choose logo"}</Button>
        {data.logo && <Button type="button" variant="ghost" size="icon" aria-label="Remove logo" onClick={() => set("logo", "")}><X className="h-4 w-4" /></Button>}
      </div>
      <div className="grid gap-4 md:grid-cols-2">{field("brand_name", "Company name")}{field("brand_tagline", "Name subtitle")}</div>
      {field("description", "Description", true)}
    </section>
    <div className="grid gap-6 lg:grid-cols-2">{linkList("services", "services_title", "Services")}{linkList("quick_links", "quick_title", "Quick Links")}</div>
    <section className="space-y-4 rounded-md border p-5">
      <h2 className="font-semibold">Contact Info column</h2>
      {field("contact_title", "Column title")}
      <div className="grid gap-4 md:grid-cols-2">
        {field("hq_label", "Address label")}{field("hq_text", "Address")}
        {field("phone_label", "Phone label")}{field("phone", "Phone number")}
        {field("hours_label", "Hours label")}{field("hours_text", "Working hours")}
      </div>
      {field("emergency_text", "Emergency line")}
    </section>
    <section className="space-y-4 rounded-md border p-5">
      <h2 className="font-semibold">Bottom line</h2>
      {field("copyright", "Copyright text")}{field("reference", "Right side text")}
    </section>
    <FileManagerPicker open={pick} onOpenChange={setPick} accept="image/*" title="Select Footer Logo" onSelect={url => { set("logo", url); setPick(false); }} />
    <div className="flex justify-end"><Button onClick={save} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save Footer</Button></div>
  </div>;
}
