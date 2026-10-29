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
import type { WebsiteServiceDirectory } from "@/lib/blueFlameWebsite";

type DirectoryData = { enabled: boolean; badge: string; title: string; subtitle: string; items: { title: string; subtitle: string; icon: string }[] };
const TEMPLATE: DirectoryData = {
  enabled: true,
  badge: "Service Accordion Directory",
  title: "HVAC Solutions, Coverage & Service Menus",
  subtitle: "Explore property solutions, our regional service areas, heating and cooling capabilities, and comprehensive seasonal maintenance programs.",
  items: [
    { title: "Location Types We Service", subtitle: "Find HVAC installation and repair solutions by property and facility type", icon: "" },
    { title: "HVAC Services We Offer", subtitle: "Comprehensive heating, cooling, indoor air quality, and efficiency upgrades", icon: "" },
    { title: "Areas We Service", subtitle: "Regional service corridors across Will County, Cook County, DuPage County & Greater Chicago", icon: "" },
    { title: "Maintenance Plans & Seasonal Care", subtitle: "Comprehensive tune-up protocols, VIP Comfort Club memberships, and warranty protection", icon: "" },
  ],
};
const text = (value: unknown, fallback: string) => typeof value === "string" && value.trim() ? value : fallback;

export default function ServiceDirectorySettings() {
  const { companyId } = useParams<{ companyId: string }>();
  const client = useQueryClient();
  const [data, setData] = useState<DirectoryData>(TEMPLATE);
  const [saving, setSaving] = useState(false);
  const [pickFor, setPickFor] = useState<number | null>(null);
  const company = useQuery({
    queryKey: ["company-service-directory", companyId],
    enabled: Boolean(companyId), staleTime: 30_000,
    queryFn: async () => {
      if (!companyId) throw new Error("Company is required");
      const { data: row, error } = await supabase.from("companies").select("name, service_directory").eq("id", companyId).single();
      if (error) throw error;
      return row;
    },
  });
  useEffect(() => {
    if (!company.data) return;
    const raw = company.data.service_directory;
    const saved = (raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {}) as WebsiteServiceDirectory;
    setData({
      enabled: saved.enabled !== false,
      badge: text(saved.badge, TEMPLATE.badge), title: text(saved.title, TEMPLATE.title), subtitle: text(saved.subtitle, TEMPLATE.subtitle),
      items: TEMPLATE.items.map((item, i) => {
        const current = Array.isArray(saved.items) ? saved.items[i] : undefined;
        return { title: text(current?.title, item.title), subtitle: text(current?.subtitle, item.subtitle), icon: text(current?.icon, "") };
      }),
    });
  }, [company.data]);
  const setItem = (index: number, patch: Partial<DirectoryData["items"][number]>) => setData(current => ({ ...current, items: current.items.map((item, i) => i === index ? { ...item, ...patch } : item) }));
  const save = async () => {
    if (!companyId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("companies").update({ service_directory: data }).eq("id", companyId).select("id").single();
      if (error) throw error;
      await client.invalidateQueries({ queryKey: ["company-service-directory", companyId] });
      toast.success("Service directory saved");
    } catch { toast.error("Could not save service directory"); }
    finally { setSaving(false); }
  };
  if (company.isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (company.isError || !companyId) return <div className="space-y-4"><p className="text-destructive">Could not load company settings.</p><Button variant="outline" onClick={() => company.refetch()}>Retry</Button></div>;
  return <div className="space-y-8">
    <header><h1 className="text-2xl font-bold">Service Directory</h1><p className="text-muted-foreground">{company.data?.name}</p></header>
    <section className="space-y-4 border-b pb-6">
      <div className="flex flex-wrap items-center justify-between gap-4"><h2 className="text-lg font-semibold">Section heading</h2><div className="flex items-center gap-2"><Label htmlFor="directory-enabled">Show on website</Label><Switch id="directory-enabled" checked={data.enabled} onCheckedChange={enabled => setData(current => ({ ...current, enabled }))} /></div></div>
      {([['badge', 'Badge text'], ['title', 'Title'], ['subtitle', 'Subtitle']] as const).map(([field, label]) => <div key={field} className="space-y-2"><Label htmlFor={`directory-${field}`}>{label}</Label>{field === 'subtitle' ? <Textarea id={`directory-${field}`} value={data[field]} onChange={event => setData(current => ({ ...current, [field]: event.target.value }))} /> : <Input id={`directory-${field}`} value={data[field]} onChange={event => setData(current => ({ ...current, [field]: event.target.value }))} />}</div>)}
    </section>
    <div className="grid gap-6 lg:grid-cols-2">{data.items.map((item, i) => <section key={i} className="space-y-4 rounded-md border p-5">
      <h2 className="font-semibold">{TEMPLATE.items[i]?.title}</h2>
      <div className="flex items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">{item.icon ? <img src={item.icon} alt="Selected icon" className="h-full w-full object-contain" /> : <ImageIcon className="h-5 w-5 text-muted-foreground" />}</div><Button variant="outline" size="sm" onClick={() => setPickFor(i)}>{item.icon ? "Change icon" : "Choose icon"}</Button>{item.icon && <Button variant="ghost" size="icon" aria-label={`Remove icon ${i + 1}`} onClick={() => setItem(i, { icon: "" })}><X className="h-4 w-4" /></Button>}</div>
      <div className="space-y-2"><Label htmlFor={`directory-item-title-${i}`}>Title</Label><Input id={`directory-item-title-${i}`} value={item.title} onChange={event => setItem(i, { title: event.target.value })} /></div>
      <div className="space-y-2"><Label htmlFor={`directory-item-subtitle-${i}`}>Description</Label><Textarea id={`directory-item-subtitle-${i}`} value={item.subtitle} onChange={event => setItem(i, { subtitle: event.target.value })} /></div>
    </section>)}</div>
    <FileManagerPicker open={pickFor !== null} onOpenChange={open => { if (!open) setPickFor(null); }} accept="image/*" title="Select Directory Icon" onSelect={url => { if (pickFor !== null) setItem(pickFor, { icon: url }); setPickFor(null); }} />
    <div className="flex justify-end"><Button onClick={save} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save Service Directory</Button></div>
  </div>;
}