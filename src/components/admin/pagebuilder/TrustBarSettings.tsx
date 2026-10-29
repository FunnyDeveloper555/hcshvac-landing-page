import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, ImageIcon, X } from "lucide-react";
import { FileManagerPicker } from "@/components/admin/filemanager/FileManagerPicker";
import { toast } from "sonner";
import type { WebsiteTrustBar } from "@/lib/blueFlameWebsite";

const PH = [
  ["Licensed & Insured", "Fully compliant with Illinois code"],
  ["EPA & NATE Certified", "Top-tier master technicians"],
  ["Up to $2,000 Rebates", "ComEd & Nicor Gas certified partner"],
  ["5-Star Local Service", "Trusted across Will & Cook County"],
];

type Item = { title: string; text: string; icon: string };

const TrustBarSettings = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const [name, setName] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [items, setItems] = useState<Item[]>(PH.map(() => ({ title: "", text: "", icon: "" })));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pickFor, setPickFor] = useState<number | null>(null);

  useEffect(() => {
    if (!companyId) return setLoading(false);
    supabase.from("companies").select("name, trust_bar").eq("id", companyId).single().then(({ data }) => {
      if (data) {
        setName(data.name || "");
        const b = (data.trust_bar && typeof data.trust_bar === "object" ? data.trust_bar : {}) as WebsiteTrustBar;
        setEnabled(b.enabled !== false);
        setItems(PH.map((p, i) => ({ title: b.items?.[i]?.title?.trim() || p[0], text: b.items?.[i]?.text?.trim() || p[1], icon: b.items?.[i]?.icon || "" })));
      }
      setLoading(false);
    });
  }, [companyId]);

  const setItem = (i: number, k: keyof Item, v: string) =>
    setItems((p) => p.map((it, j) => (j === i ? { ...it, [k]: v } : it)));

  const save = async () => {
    if (!companyId) return;
    setSaving(true);
    const { error } = await supabase.from("companies").update({ trust_bar: { enabled, items } as never }).eq("id", companyId);
    setSaving(false);
    if (error) return toast.error("Failed to save trust bar");
    toast.success("Trust bar saved");
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Trust Bar</h1>
        <p className="text-muted-foreground">The four badges under the hero on {name || "the company"}'s home page. Leave a box empty to keep the template text and icon.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Badges</CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="tb-on">Show on website</Label>
            <Switch id="tb-on" checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {items.map((it, i) => (
            <div key={i} className="space-y-2 rounded-lg border p-3">
              <Label>Badge {i + 1}</Label>
              <div className="flex items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border bg-muted">
                  {it.icon ? <img src={it.icon} alt="" className="h-full w-full object-contain" /> : <ImageIcon className="h-5 w-5 text-muted-foreground" />}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setPickFor(i)}>
                  {it.icon ? "Change icon" : "Choose icon"}
                </Button>
                {it.icon && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setItem(i, "icon", "")}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Input value={it.title} onChange={(e) => setItem(i, "title", e.target.value)} placeholder={PH[i][0]} />
              <Input value={it.text} onChange={(e) => setItem(i, "text", e.target.value)} placeholder={PH[i][1]} />
            </div>
          ))}
        </CardContent>
      </Card>

      <FileManagerPicker
        open={pickFor !== null}
        onOpenChange={(o) => !o && setPickFor(null)}
        accept="image/*"
        title="Select Badge Icon from File Manager"
        onSelect={(url) => { if (pickFor !== null) setItem(pickFor, "icon", url); setPickFor(null); }}
      />

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Trust Bar
        </Button>
      </div>
    </div>
  );
};

export default TrustBarSettings;
