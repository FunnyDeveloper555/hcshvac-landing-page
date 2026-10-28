import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, MapPin, Phone, Save } from "lucide-react";
import { toast } from "sonner";

// Mirrors the "top-bar" section of the uploaded HTML website template.
export interface TopBar {
  enabled: boolean;
  emergency_text: string;
  service_area_text: string;
  urgent_label: string;
  phone: string;
}

const EMPTY: TopBar = {
  enabled: true,
  emergency_text: "",
  service_area_text: "",
  urgent_label: "",
  phone: "",
};

// Template colors (from the website template's style.css), used only for this faithful preview.
const T = {
  bg: "linear-gradient(90deg, #050b18, #0e1e40 50%, #15091c)",
  border: "1px solid rgba(255, 101, 80, 0.25)",
  text: "#e2e8f0",
  pin: "#00d4ff",
  pink: "#ff2a85",
  phone: "#ff6550",
};

const TopBarMock = ({ bar, mobile }: { bar: TopBar; mobile?: boolean }) => {
  if (!bar.enabled) {
    return <div className="p-4 text-center text-sm text-muted-foreground">Top bar is hidden</div>;
  }
  const tel = bar.phone.replace(/\D/g, "");
  return (
    <div style={{ background: T.bg, borderBottom: T.border, color: T.text }} className={mobile ? "py-1.5 px-3 text-[0.78rem]" : "py-2 px-6 text-[0.88rem]"}>
      <div className={mobile ? "flex flex-col items-center text-center gap-1.5" : "flex flex-wrap items-center justify-between gap-2.5"}>
        <div className={mobile ? "flex flex-wrap justify-center gap-2" : "flex flex-wrap items-center gap-5"}>
          {bar.emergency_text && (
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-[9px] h-[9px] rounded-full animate-pulse" style={{ background: T.pink, boxShadow: `0 0 10px ${T.pink}` }} />
              <strong>{bar.emergency_text}</strong>
            </div>
          )}
          {bar.service_area_text && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" style={{ color: T.pin }} />
              {bar.service_area_text}
            </div>
          )}
        </div>
        {(bar.urgent_label || bar.phone) && (
          <div className="flex items-center gap-1.5">
            {bar.urgent_label && <span>{bar.urgent_label}</span>}
            {bar.phone && (
              <a href={`tel:${tel}`} onClick={(e) => e.preventDefault()} className="flex items-center gap-1.5 font-bold" style={{ color: T.phone }}>
                <Phone className="w-4 h-4" /> {bar.phone}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const TopHeaderPreview = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState<string | null>(null);
  const [bar, setBar] = useState<TopBar>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!companyId) return setLoading(false);
    supabase
      .from("companies")
      .select("name, slug, top_bar")
      .eq("id", companyId)
      .single()
      .then(({ data }) => {
        if (data) {
          setName(data.name || "");
          setSlug(data.slug);
          const tb = (data.top_bar && typeof data.top_bar === "object" ? data.top_bar : {}) as Partial<TopBar>;
          setBar({ ...EMPTY, ...tb });
        }
        setLoading(false);
      });
  }, [companyId]);

  const set = (k: keyof TopBar, v: string | boolean) => setBar((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!companyId) return;
    setSaving(true);
    const clean: TopBar = {
      enabled: bar.enabled,
      emergency_text: bar.emergency_text.trim(),
      service_area_text: bar.service_area_text.trim(),
      urgent_label: bar.urgent_label.trim(),
      phone: bar.phone.trim(),
    };
    const { error } = await supabase.from("companies").update({ top_bar: clean as never }).eq("id", companyId);
    setSaving(false);
    if (error) return toast.error("Failed to save top header");
    setBar(clean);
    toast.success("Top header saved");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const host = `${slug || "company"}.hcshvac.com`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Top Header</h1>
        <p className="text-muted-foreground">The announcement bar at the very top of {name || "the company"}'s website.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Desktop View</CardTitle></CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted px-4 py-2 text-sm text-muted-foreground border-b">{host}</div>
            <TopBarMock bar={bar} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Mobile View</CardTitle></CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden max-w-sm mx-auto">
            <div className="bg-muted px-3 py-1 text-xs text-muted-foreground border-b">{host}</div>
            <TopBarMock bar={bar} mobile />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Top Header Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch id="enabled" checked={bar.enabled} onCheckedChange={(v) => set("enabled", v)} />
            <Label htmlFor="enabled">Show top header on website</Label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="em">Emergency message</Label>
              <Input id="em" value={bar.emergency_text} onChange={(e) => set("emergency_text", e.target.value)} placeholder="24/7 Chicago HVAC Emergency Dispatch" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area">Service area</Label>
              <Input id="area" value={bar.service_area_text} onChange={(e) => set("service_area_text", e.target.value)} placeholder="Serving Joliet, Naperville, Plainfield & Greater Chicago Metro" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="urg">Phone label</Label>
              <Input id="urg" value={bar.urgent_label} onChange={(e) => set("urgent_label", e.target.value)} placeholder="Need Urgent Heat or AC?" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ph">Phone number</Label>
              <Input id="ph" value={bar.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(815) 556-0660" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Top Header
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TopHeaderPreview;
