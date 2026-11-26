import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileManagerPicker } from "@/components/admin/filemanager/FileManagerPicker";
import { useToast } from "@/hooks/use-toast";
import { useAdminLog } from "@/hooks/useAdminLog";
import { generatedProductName } from "@/lib/productForms";
import { Loader2, Plus, X } from "lucide-react";

const WARRANTY_OPTIONS = ["1 Year", "5 Year", "10 Year", "5 Years Non Registered", "10 Years When Registered", "Lifetime"];
const STATUS_OPTIONS = [
  { value: "active_showing", label: "Item Active (Showing)" },
  { value: "active_not_showing", label: "Item Active (Not Showing)" },
  { value: "discontinued_showing", label: "Item Discontinued (Showing)" },
  { value: "deactivated", label: "Deactivated (Not Showing)" },
];
type Key = "image" | "parts" | "labor" | "bullets" | "desc" | "status" | "name";

function Row({ on, toggle, k, label, children }: { on: Record<Key, boolean>; toggle: (k: Key) => void; k: Key; label: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-md border px-2.5 py-1.5 space-y-2">
      <label className="flex items-center gap-2 font-medium cursor-pointer"><Checkbox checked={on[k]} onCheckedChange={() => toggle(k)} />{label}</label>
      {on[k] && children}
    </div>
  );
}

interface Props { open: boolean; onOpenChange: (o: boolean) => void; products: any[]; onApplied: () => void }

export default function BulkEditDialog({ open, onOpenChange, products, onApplied }: Props) {
  const { toast } = useToast();
  const { logAction } = useAdminLog();
  const [on, setOn] = useState<Record<Key, boolean>>({ image: false, parts: false, labor: false, bullets: false, desc: false, status: false, name: false });
  const [imageMode, setImageMode] = useState<"replace" | "remove">("replace");
  const [image, setImage] = useState("");
  const [picker, setPicker] = useState(false);
  const [parts, setParts] = useState("");
  const [labor, setLabor] = useState("");
  const [bullets, setBullets] = useState<string[]>([""]);
  const [desc, setDesc] = useState("");
  const [status, setStatus] = useState("active_showing");
  const [saving, setSaving] = useState(false);
  const toggle = (k: Key) => setOn(p => ({ ...p, [k]: !p[k] }));
  const anyOn = Object.values(on).some(Boolean);

  const apply = async () => {
    setSaving(true);
    let failed = 0;
    for (const p of products) {
      const patch: Record<string, unknown> = {};
      if (on.image) {
        const rest = Array.isArray(p.spot_images) ? (p.spot_images as string[]).slice(1) : [];
        patch.spot_images = imageMode === "remove" ? [] : image ? [image, ...rest] : p.spot_images;
      }
      if (on.parts) patch.parts_warranty = parts;
      if (on.labor) patch.labor_warranty = labor;
      if (on.bullets) patch.bullet_points = bullets.map(b => b.trim()).filter(Boolean);
      if (on.desc) patch.spot_text = desc;
      if (on.status) patch.status = status;
      if (on.name) {
        const sp = p.specifications && typeof p.specifications === "object" ? p.specifications : {};
        const name = generatedProductName(p.spec_type || p.category || "", { ...sp, afue: p.afue, brand_name: p.brand_name, model_number: p.model_number, stages: p.stages, poise: p.poise, location_type: sp.location_type, refrigerant_type: p.refrigerant_type, tons_btu: p.tons_btu, seer_rating: p.seer_rating });
        if (name) patch.product_name = name;
      }
      const { error } = await supabase.from("products").update(patch as any).eq("id", p.id);
      if (error) failed++; else logAction("update", "product", p.id, { bulk_edit: Object.keys(patch).join(", ") });
    }
    setSaving(false);
    toast({ title: failed ? "Some products failed" : "Bulk edit saved", description: `${products.length - failed} updated${failed ? `, ${failed} failed` : ""}`, variant: failed ? "destructive" : undefined });
    onApplied(); onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto compact-form p-4 gap-2">
        <DialogHeader><DialogTitle>Bulk Edit {products.length} Selected Products</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Check each item you want to change. Unchecked items stay as they are.</p>
        <div className="grid md:grid-cols-2 gap-x-4 gap-y-2">
          <Row on={on} toggle={toggle} k="image" label="Edit Image of Selected">
            <div className="flex flex-wrap items-center gap-3">
              <Select value={imageMode} onValueChange={v => setImageMode(v as any)}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="replace">Set main image</SelectItem><SelectItem value="remove">Remove all images</SelectItem></SelectContent>
              </Select>
              {imageMode === "replace" && <>
                {image && <img src={image} alt="" className="h-14 w-14 rounded object-cover border" />}
                <Button type="button" variant="outline" onClick={() => setPicker(true)}>Choose New Image from Library</Button>
              </>}
            </div>
          </Row>
          <Row on={on} toggle={toggle} k="parts" label="Manufacturer's Parts Warranty">
            <Select value={parts} onValueChange={setParts}><SelectTrigger><SelectValue placeholder="Select warranty" /></SelectTrigger>
              <SelectContent>{WARRANTY_OPTIONS.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent></Select>
          </Row>
          <Row on={on} toggle={toggle} k="labor" label="Labor Warranty">
            <Select value={labor} onValueChange={setLabor}><SelectTrigger><SelectValue placeholder="Select warranty" /></SelectTrigger>
              <SelectContent>{WARRANTY_OPTIONS.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent></Select>
          </Row>
          <Row on={on} toggle={toggle} k="bullets" label="Edit Bullet Points of All Selected (replaces existing)">
            {bullets.map((b, i) => (
              <div key={i} className="flex gap-2">
                <Input value={b} onChange={e => setBullets(bs => bs.map((x, j) => j === i ? e.target.value : x))} placeholder={`Bullet ${i + 1}`} />
                <Button type="button" size="icon" variant="ghost" onClick={() => setBullets(bs => bs.length > 1 ? bs.filter((_, j) => j !== i) : [""])}><X className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button type="button" size="sm" variant="outline" onClick={() => setBullets(bs => [...bs, ""])}><Plus className="h-4 w-4 mr-1" />Add Another</Button>
          </Row>
          <Row on={on} toggle={toggle} k="desc" label="Product Summary / Short Description">
            <Textarea rows={4} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Short description or promotional text" />
          </Row>
          <Row on={on} toggle={toggle} k="status" label="Status">
            <Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select>
          </Row>
          <Row on={on} toggle={toggle} k="name" label="Regenerate Product Names">
            <p className="text-sm text-muted-foreground">Furnaces use: AFUE% Brand Model Location Stages Poise Furnace (e.g. "96% Goodman GR9S960403AN Residential Single Stage Up-Flow Furnace").</p>
          </Row>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!anyOn || saving || (on.image && imageMode === "replace" && !image)} onClick={apply}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Submit
          </Button>
        </DialogFooter>
        <FileManagerPicker open={picker} onOpenChange={setPicker} accept="image/*" title="Choose Product Image" onSelect={url => { setImage(url); setPicker(false); }} />
      </DialogContent>
    </Dialog>
  );
}
