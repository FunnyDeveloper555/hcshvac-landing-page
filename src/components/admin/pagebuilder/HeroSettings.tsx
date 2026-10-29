import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import type { WebsiteHero } from "@/lib/blueFlameWebsite";

type Hero = Required<Omit<WebsiteHero, "stats">> & { stats: { value: string; label: string }[] };

const EMPTY: Hero = {
  badge: "", headline: "", highlight: "", lead: "",
  cta1_text: "", cta1_link: "", cta2_text: "", cta2_link: "",
  stats: [{ value: "", label: "" }, { value: "", label: "" }, { value: "", label: "" }],
};

// Template placeholders (from the uploaded website) — blank fields keep these on the site.
const PH = {
  badge: "Sub-Zero Winters • Humid Heatwaves",
  headline: "Defeat the Extreme Chicago Weather with",
  highlight: "Unmatched Comfort.",
  lead: "From blizzard-grade furnace emergencies to high-efficiency whisper inverter AC installations, Best Comfort delivers 24/7 authentic, licensed craftsmanship across Chicagoland.",
  cta1_text: "Explore High-Efficiency Systems →", cta1_link: "products.html",
  cta2_text: "Schedule 24/7 Dispatch", cta2_link: "contact.html",
  stats: [["24/7", "Emergency Response"], ["98.7%", "AFUE High Efficiency"], ["100%", "NATE-Certified Techs"]],
};

const HeroSettings = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const [name, setName] = useState("");
  const [hero, setHero] = useState<Hero>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!companyId) return setLoading(false);
    supabase.from("companies").select("name, hero").eq("id", companyId).single().then(({ data }) => {
      if (data) {
        setName(data.name || "");
        const h = (data.hero && typeof data.hero === "object" ? data.hero : {}) as WebsiteHero;
        const pick = (k: keyof Omit<Hero, "stats">) => ((h as Record<string, string>)[k] || "").trim() || (PH[k] as string);
        setHero({
          badge: pick("badge"), headline: pick("headline"), highlight: pick("highlight"), lead: pick("lead"),
          cta1_text: pick("cta1_text"), cta1_link: pick("cta1_link"), cta2_text: pick("cta2_text"), cta2_link: pick("cta2_link"),
          stats: EMPTY.stats.map((_, i) => ({
            value: h.stats?.[i]?.value?.trim() || PH.stats[i][0],
            label: h.stats?.[i]?.label?.trim() || PH.stats[i][1],
          })),
        });
      }
      setLoading(false);
    });
  }, [companyId]);

  const set = (k: keyof Omit<Hero, "stats">, v: string) => setHero((p) => ({ ...p, [k]: v }));
  const setStat = (i: number, k: "value" | "label", v: string) =>
    setHero((p) => ({ ...p, stats: p.stats.map((s, j) => (j === i ? { ...s, [k]: v } : s)) }));

  const save = async () => {
    if (!companyId) return;
    setSaving(true);
    const { error } = await supabase.from("companies").update({ hero: hero as never }).eq("id", companyId);
    setSaving(false);
    if (error) return toast.error("Failed to save hero");
    toast.success("Hero saved");
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const field = (k: keyof Omit<Hero, "stats">, label: string, area = false) => (
    <div className="space-y-2">
      <Label htmlFor={k}>{label}</Label>
      {area ? (
        <Textarea id={k} rows={3} value={hero[k]} onChange={(e) => set(k, e.target.value)} placeholder={PH[k] as string} />
      ) : (
        <Input id={k} value={hero[k]} onChange={(e) => set(k, e.target.value)} placeholder={PH[k] as string} />
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hero</h1>
        <p className="text-muted-foreground">The large welcome section at the top of {name || "the company"}'s home page. Leave a box empty to keep the template text.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Headline</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {field("badge", "Badge text")}
          <div />
          {field("headline", "Headline")}
          {field("highlight", "Highlighted words")}
          <div className="md:col-span-2">{field("lead", "Intro paragraph", true)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Buttons</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {field("cta1_text", "Main button text")}
          {field("cta1_link", "Main button link")}
          {field("cta2_text", "Second button text")}
          {field("cta2_link", "Second button link")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Highlights</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {hero.stats.map((s, i) => (
            <div key={i} className="space-y-2 rounded-lg border p-3">
              <Label>Number {i + 1}</Label>
              <Input value={s.value} onChange={(e) => setStat(i, "value", e.target.value)} placeholder={PH.stats[i][0]} />
              <Input value={s.label} onChange={(e) => setStat(i, "label", e.target.value)} placeholder={PH.stats[i][1]} />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Hero
        </Button>
      </div>
    </div>
  );
};

export default HeroSettings;
