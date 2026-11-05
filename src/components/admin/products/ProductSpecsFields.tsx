import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRODUCT_SPEC_CATEGORIES, specCategory, visibleSpecFields, type SpecField } from "@/lib/productSpecs";

type Specs = Record<string, any>;

interface Props {
  specType: string;
  onSpecTypeChange: (v: string) => void;
  specs: Specs;
  onSpecsChange: (s: Specs) => void;
  children?: React.ReactNode;
}

export function ProductSpecsFields({ specType, onSpecTypeChange, specs, onSpecsChange, children }: Props) {
  const cat = specCategory(specType);
  const fields = visibleSpecFields(cat);
  const { data: vendors = [] } = useQuery({
    queryKey: ["spec-vendors"],
    staleTime: 30000,
    queryFn: async () => {
      const { data } = await supabase.from("vendors").select("id, vendor_name").order("vendor_name");
      return (data || []) .map((v: any) => ({ id: v.id, name: v.vendor_name })) as { id: string; name: string }[];
    },
  });
  const set = (k: string, v: any) => onSpecsChange({ ...specs, [k]: v });

  const toggle = (k: string, opt: string) => {
    const cur: string[] = Array.isArray(specs[k]) ? specs[k] : [];
    set(k, cur.includes(opt) ? cur.filter((o) => o !== opt) : [...cur, opt]);
  };

  const render = (f: SpecField) => {
    const v = specs[f.key];
    switch (f.kind) {
      case "select":
        return (
          <Select value={v || "__none"} onValueChange={(x) => set(f.key, x === "__none" ? "" : x)}>
            <SelectTrigger><SelectValue placeholder={`Select ${f.label}`} /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="__none">—</SelectItem>
              {f.options!.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        );
      case "vendor":
        return (
          <Select value={v || "__none"} onValueChange={(x) => set(f.key, x === "__none" ? "" : x)}>
            <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="__none">—</SelectItem>
              {vendors.map((o) => <SelectItem key={o.id} value={o.name}>{o.name}</SelectItem>)}
            </SelectContent>
          </Select>
        );
      case "multi":
        return (
          <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
            {f.options!.map((o) => (
              <label key={o} className="flex items-center gap-2 text-sm">
                <Checkbox checked={Array.isArray(v) && v.includes(o)} onCheckedChange={() => toggle(f.key, o)} />
                {o}
              </label>
            ))}
          </div>
        );
      case "boolean":
        return (
          <label className="flex items-center gap-2 text-sm pt-2">
            <Checkbox checked={!!v} onCheckedChange={(c) => set(f.key, !!c)} /> Yes
          </label>
        );
      case "textarea":
        return <Textarea value={v || ""} onChange={(e) => set(f.key, e.target.value)} />;
      default:
        return <Input type={f.kind === "url" ? "url" : "text"} value={v || ""} onChange={(e) => set(f.key, e.target.value)} />;
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold">Product Filter Category</h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {children}
      <div className="space-y-2">
        <Label>Product Type *</Label>
        <Select value={specType || "__none"} onValueChange={(x) => onSpecTypeChange(x === "__none" ? "" : x)}>
          <SelectTrigger><SelectValue placeholder="Select product type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">None</SelectItem>
            {PRODUCT_SPEC_CATEGORIES.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      </div>
      {fields.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fields.map((f) => (
            <div key={f.key} className={`space-y-2 ${f.kind === "multi" || f.kind === "textarea" ? "md:col-span-2 lg:col-span-3" : ""}`}>
              <Label>{f.label}</Label>
              {render(f)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
