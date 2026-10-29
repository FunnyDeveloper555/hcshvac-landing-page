import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ImageIcon, Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { FileManagerPicker } from "@/components/admin/filemanager/FileManagerPicker";
import type { WebsiteCoreServices } from "@/lib/blueFlameWebsite";

type CardData = { icon: string; title: string; text: string; bullets: string[]; button_text: string; button_link: string };
type Data = { badge: string; title: string; subtitle: string; cards: CardData[] };

// Template content (from the uploaded website).
const TEMPLATE: Data = {
  badge: "Complete Climate Solutions",
  title: "Engineered for Chicago’s 100° Summers and -20° Blizzards",
  subtitle: "We don’t just fix HVAC units; we engineer home comfort systems designed to withstand Lake Michigan’s brutal winters and humid summer spikes.",
  cards: [
    {
      icon: "", title: "Heating & Furnaces",
      text: "Keep your family warm with high-efficiency gas furnaces, heat exchangers, and boilers built to run through zero-degree nights.",
      bullets: ["Gas Furnace Diagnostics & Emergency Igniter Swaps", "Up to 98.7% AFUE Modulating High-Efficiency Units", "Carbon Monoxide Safety Heat Exchanger Tests", "Steam & Hot Water Hydronic Radiator Boilers"],
      button_text: "View Heating Details →", button_link: "services.html#heating",
    },
    {
      icon: "", title: "Air Conditioning & Cooling",
      text: "Beat intense summer humidity with whisper-quiet inverter air conditioning systems and ductless mini-splits.",
      bullets: ["Inverter Variable-Speed AC (Up to 24.5 SEER2)", "Fast Refrigerant Leak Detection & Motor Rebuilds", "54 dBA Ultra-Quiet Sound Dampening Tech", "Multi-Zone Ductless Mini-Split Installations"],
      button_text: "View Cooling Details →", button_link: "services.html#cooling",
    },
    {
      icon: "", title: "Heat Pumps & Air Quality",
      text: "Clean breathing air and ultra-efficient hybrid dual-fuel heating solutions that qualify for massive utility rebates.",
      bullets: ["PolarFlex™ Cold-Climate Heat Pumps (-22°F Rated)", "Hospital-Grade MERV 16 & UV-C Germicidal Scrubbers", "Whole-Home Steam Humidifiers for Dry Winters", "Smart Wi-Fi Communicating Thermostats"],
      button_text: "Explore Hybrid & IAQ →", button_link: "services.html#iaq",
    },
  ],
};

const or = (s: string | undefined, d: string) => (s && s.trim() ? s : d);

const CoreServicesSettings = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const [name, setName] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [data, setData] = useState<Data>(TEMPLATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pickFor, setPickFor] = useState<number | null>(null);

  useEffect(() => {
    if (!companyId) return setLoading(false);
    supabase.from("companies").select("name, core_services").eq("id", companyId).single().then(({ data: row }) => {
      if (row) {
        setName(row.name || "");
        const s = (row.core_services && typeof row.core_services === "object" ? row.core_services : {}) as WebsiteCoreServices;
        setEnabled(s.enabled !== false);
        setData({
          badge: or(s.badge, TEMPLATE.badge),
          title: or(s.title, TEMPLATE.title),
          subtitle: or(s.subtitle, TEMPLATE.subtitle),
          cards: TEMPLATE.cards.map((t, i) => {
            const c = s.cards?.[i] || {};
            return {
              icon: c.icon || "",
              title: or(c.title, t.title),
              text: or(c.text, t.text),
              bullets: t.bullets.map((b, j) => or(c.bullets?.[j], b)),
              button_text: or(c.button_text, t.button_text),
              button_link: or(c.button_link, t.button_link),
            };
          }),
        });
      }
      setLoading(false);
    });
  }, [companyId]);

  const setCard = (i: number, patch: Partial<CardData>) =>
    setData((p) => ({ ...p, cards: p.cards.map((c, j) => (j === i ? { ...c, ...patch } : c)) }));

  const save = async () => {
    if (!companyId) return;
    setSaving(true);
    const { error } = await supabase.from("companies").update({ core_services: { enabled, ...data } as never }).eq("id", companyId);
    setSaving(false);
    if (error) return toast.error("Failed to save core services");
    toast.success("Core services saved");
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Core Services</h1>
        <p className="text-muted-foreground">The three service cards on {name || "the company"}'s home page. Leave an icon empty to keep the template icon.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Section heading</CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="cs-on">Show on website</Label>
            <Switch id="cs-on" checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-2"><Label>Badge text</Label><Input value={data.badge} onChange={(e) => setData({ ...data, badge: e.target.value })} /></div>
          <div className="space-y-2"><Label>Title</Label><Input value={data.title} onChange={(e) => setData({ ...data, title: e.target.value })} /></div>
          <div className="space-y-2"><Label>Subtitle</Label><Textarea rows={2} value={data.subtitle} onChange={(e) => setData({ ...data, subtitle: e.target.value })} /></div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {data.cards.map((c, i) => (
          <Card key={i}>
            <CardHeader><CardTitle className="text-base">Card {i + 1}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border bg-muted">
                  {c.icon ? <img src={c.icon} alt="" className="h-full w-full object-contain" /> : <ImageIcon className="h-5 w-5 text-muted-foreground" />}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setPickFor(i)}>{c.icon ? "Change icon" : "Choose icon"}</Button>
                {c.icon && <Button type="button" variant="ghost" size="sm" onClick={() => setCard(i, { icon: "" })}><X className="h-4 w-4" /></Button>}
              </div>
              <div className="space-y-2"><Label>Title</Label><Input value={c.title} onChange={(e) => setCard(i, { title: e.target.value })} /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea rows={3} value={c.text} onChange={(e) => setCard(i, { text: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Bullet points</Label>
                {c.bullets.map((b, j) => (
                  <Input key={j} value={b} onChange={(e) => setCard(i, { bullets: c.bullets.map((x, k) => (k === j ? e.target.value : x)) })} />
                ))}
              </div>
              <div className="space-y-2"><Label>Button text</Label><Input value={c.button_text} onChange={(e) => setCard(i, { button_text: e.target.value })} /></div>
              <div className="space-y-2"><Label>Button link</Label><Input value={c.button_link} onChange={(e) => setCard(i, { button_link: e.target.value })} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <FileManagerPicker
        open={pickFor !== null}
        onOpenChange={(o) => !o && setPickFor(null)}
        accept="image/*"
        title="Select Card Icon from File Manager"
        onSelect={(url) => { if (pickFor !== null) setCard(pickFor, { icon: url }); setPickFor(null); }}
      />

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Core Services
        </Button>
      </div>
    </div>
  );
};

export default CoreServicesSettings;
