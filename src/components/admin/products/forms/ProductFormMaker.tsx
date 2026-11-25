import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAdminLog } from "@/hooks/useAdminLog";
import { useProductForms, useProductFormElements, availableProductForms } from "@/hooks/useProductForms";
import { APPLICABLE_AREAS, defaultForm, masterElements, moveKey, orderedElements, type FieldKind, type FormValues } from "@/lib/productForms";
import { ProductFormFields } from "./ProductFormFields";
import { ArrowDown, ArrowLeft, ArrowUp, Eye, GripVertical, Plus, Save, Trash2, Loader2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CUSTOM_KINDS: { value: FieldKind; label: string }[] = [
  { value: "boolean", label: "Check Box (Yes / No)" }, { value: "multi", label: "Group Check Boxes" }, { value: "radio", label: "Group Radio Buttons" },
  { value: "select", label: "Drop Down / Value List" }, { value: "text", label: "Enter Text (one line)" }, { value: "textarea", label: "Text Box (paragraph)" }, { value: "number", label: "Number" },
];
const NEW = "__new__";

export default function ProductFormMaker() {
  const formsQuery = useProductForms(); const elementsQuery = useProductFormElements();
  const forms = availableProductForms(formsQuery.data); const allElements = masterElements(elementsQuery.data);
  const [typeName, setTypeName] = useState("Furnace");
  const current = typeName === NEW ? { ...defaultForm(""), fields: ["product_name"], applicable_areas: [] as string[] } : forms.find(f => f.name === typeName) || defaultForm(typeName);
  const [keys, setKeys] = useState<string[]>(current.fields);
  const [formName, setFormName] = useState(current.name);
  const [areas, setAreas] = useState<string[]>(current.applicable_areas || []);
  const [elementName, setElementName] = useState(""); const [kind, setKind] = useState<FieldKind>("text"); const [options, setOptions] = useState(["", ""]);
  const [search, setSearch] = useState(""); const [preview, setPreview] = useState(false); const [previewValues, setPreviewValues] = useState<FormValues>({});
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [busy, setBusy] = useState(false); const { toast } = useToast(); const client = useQueryClient(); const { logAction } = useAdminLog(); const navigate = useNavigate();
  const loaded = !formsQuery.isLoading && !elementsQuery.isLoading;
  // Reset the editor whenever a different form is picked (or once saved forms load).
  useEffect(() => { setKeys(current.fields); setFormName(current.name); setAreas(current.applicable_areas || []); setPreview(false); setPreviewValues({}); }, [typeName, loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const chosen = orderedElements(allElements, keys);
  const errorToast = (error: unknown) => toast({ title: "Unable to save", description: error instanceof Error ? error.message : String(error), variant: "destructive" });
  const toggle = (key: string, on: boolean) => setKeys(on ? (keys.includes(key) ? keys : [...keys, key]) : keys.filter(k => k !== key || k === "product_name"));

  const saveForm = async (activeOverride?: boolean) => {
    const name = formName.trim();
    if (!name) { toast({ title: "Enter a form name", variant: "destructive" }); return; }
    if (!keys.includes("product_name")) { toast({ title: "Product Name is required", variant: "destructive" }); return; }
    const clash = forms.find(f => f.name.toLowerCase() === name.toLowerCase() && f !== current && (f.id || typeName === NEW));
    if (clash) { toast({ title: "A form with this name already exists", variant: "destructive" }); return; }
    setBusy(true);
    try {
      const payload = { name, fields: keys, applicable_areas: areas, is_active: activeOverride ?? current.is_active };
      const result = current.id ? await supabase.from("product_type_forms").update(payload).eq("id", current.id).select("id").single() : await supabase.from("product_type_forms").insert(payload).select("id").single();
      if (result.error) throw result.error;
      // Renaming a form keeps its existing products attached to it.
      if (current.id && current.name !== name) { const { error } = await supabase.from("products").update({ spec_type: name }).eq("spec_type", current.name); if (error) throw error; }
      await logAction(current.id ? "update" : "create", "product_type_form", result.data.id, { name, field_count: keys.length, renamed_from: current.id && current.name !== name ? current.name : undefined });
      await client.invalidateQueries({ queryKey: ["product-type-forms"] });
      setTypeName(name); toast({ title: "Form saved", description: name });
    } catch (error) { errorToast(error); } finally { setBusy(false); }
  };

  const createElement = async () => {
    const label = elementName.trim(); const list = [...new Set(options.map(o => o.trim()).filter(Boolean))];
    if (!label || (["select", "multi", "radio"].includes(kind) && !list.length)) { toast({ title: "Enter an item name and its options", variant: "destructive" }); return; }
    if (allElements.some(e => e.label.toLowerCase() === label.toLowerCase())) { toast({ title: "A form item with this name already exists", variant: "destructive" }); return; }
    setBusy(true);
    try {
      const key = `custom_${label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "field"}_${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
      const { data, error } = await supabase.from("product_form_elements").insert({ key, label, kind, options: list }).select("id").single(); if (error) throw error;
      await logAction("create", "product_form_element", data.id, { name: label, kind }); await client.invalidateQueries({ queryKey: ["product-form-elements"] });
      setKeys([...keys, key]); setElementName(""); setOptions(["", ""]); setKind("text");
      toast({ title: "Form item created", description: `${label} was added to the layout` });
    } catch (error) { errorToast(error); } finally { setBusy(false); }
  };

  if (!loaded) return <Loader2 className="h-6 w-6 animate-spin" />;
  if (formsQuery.error || elementsQuery.error) return <div className="space-y-3"><p className="text-destructive">Unable to load product forms.</p><Button onClick={() => { formsQuery.refetch(); elementsQuery.refetch(); }}>Retry</Button></div>;
  const visible = [...allElements].sort((a, b) => a.label.localeCompare(b.label)).filter(f => f.label.toLowerCase().includes(search.toLowerCase()));
  const hasOptions = ["select", "multi", "radio"].includes(kind);

  return <div className="space-y-6">
    <header className="flex flex-wrap justify-between gap-3 items-end">
      <div><h2 className="text-2xl font-bold">Form Maker</h2><p className="text-muted-foreground text-sm">Pick the items a form uses, create custom items, and arrange the layout.</p></div>
      <div className="flex flex-wrap gap-2 items-end">
        <div className="space-y-1"><Label>Edit form</Label><Select value={typeName} onValueChange={setTypeName}><SelectTrigger className="w-56" aria-label="Edit form"><SelectValue placeholder="Choose a form" /></SelectTrigger><SelectContent>{typeName === NEW && <SelectItem value={NEW}>New form</SelectItem>}{forms.map(f => <SelectItem key={f.name} value={f.name}>{f.name}{!f.is_active ? " (hidden)" : ""}</SelectItem>)}</SelectContent></Select></div>
        <Button variant="outline" onClick={() => setTypeName(NEW)}><Plus className="h-4 w-4 mr-2" />New Form</Button>
        {current.id && <Button variant="outline" onClick={() => navigate(`/admin/products/type/${encodeURIComponent(current.name)}`)}>Open {current.name}</Button>}
      </div>
    </header>

    <section className="grid md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] gap-6 border rounded-lg p-4">
      <div className="space-y-2"><Label htmlFor="form-name">{typeName === NEW ? "New Form Name" : "Form Name"}</Label><Input id="form-name" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. U.V Light" /></div>
      <div className="space-y-2"><Label>Applicable Areas</Label><div className="flex flex-wrap gap-x-5 gap-y-2">{APPLICABLE_AREAS.map(a => <label key={a} className="flex items-center gap-2 text-sm"><Checkbox checked={areas.includes(a)} onCheckedChange={c => setAreas(c === true ? [...areas, a] : areas.filter(x => x !== a))} />{a}</label>)}</div></div>
    </section>

    {preview ? <section className="space-y-4">
      <h3 className="text-xl font-semibold">Form preview — {formName || "New form"}</h3>
      <ProductFormFields elements={chosen} values={previewValues} onChange={setPreviewValues} typeName={formName} />
    </section> : <div className="grid lg:grid-cols-2 gap-6">
      <section className="space-y-3 border rounded-lg p-4 min-w-0">
        <div className="flex justify-between items-center gap-2"><h3 className="font-semibold">Select Form Items to use</h3><span className="text-sm text-muted-foreground">{keys.length} selected</span></div>
        <Input aria-label="Search form items" placeholder="Search items" value={search} onChange={e => setSearch(e.target.value)} />
        <div className="max-h-[480px] overflow-y-auto grid sm:grid-cols-2 gap-x-4 gap-y-2 pr-1">{visible.map(f => <label key={f.key} className="flex items-start gap-2 text-sm"><Checkbox aria-label={f.label} checked={keys.includes(f.key)} disabled={f.key === "product_name"} onCheckedChange={c => toggle(f.key, c === true)} className="mt-0.5 shrink-0" /><span>{f.label}{f.section === "Custom Elements" && <span className="text-muted-foreground text-xs"> (custom)</span>}</span></label>)}</div>
      </section>
      <section className="space-y-3 border rounded-lg p-4 min-w-0">
        <h3 className="font-semibold">Form Layout</h3><p className="text-sm text-muted-foreground">Drag items (or use the arrows) to set the order they appear on the form.</p>
        <ol className="space-y-1 max-h-[480px] overflow-y-auto pr-1">{chosen.map((f, i) => <li key={f.key} draggable onDragStart={() => setDragIndex(i)} onDragOver={e => e.preventDefault()} onDrop={() => { if (dragIndex != null) setKeys(moveKey(keys, keys.indexOf(chosen[dragIndex].key), keys.indexOf(f.key))); setDragIndex(null); }}
          className={`flex items-center gap-2 border rounded-md px-2 py-1.5 bg-card text-sm ${dragIndex === i ? "opacity-50" : ""}`}>
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" /><span className="flex-1 min-w-0 truncate">{f.label}{f.key === "product_name" ? " *" : ""}</span>
          <Button size="icon" variant="ghost" className="h-7 w-7" aria-label={`Move ${f.label} up`} disabled={i === 0} onClick={() => setKeys(moveKey(keys, keys.indexOf(f.key), keys.indexOf(chosen[i - 1].key)))}><ArrowUp className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" aria-label={`Move ${f.label} down`} disabled={i === chosen.length - 1} onClick={() => setKeys(moveKey(keys, keys.indexOf(f.key), keys.indexOf(chosen[i + 1].key)))}><ArrowDown className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" aria-label={`Remove ${f.label}`} disabled={f.key === "product_name"} onClick={() => toggle(f.key, false)}><X className="h-4 w-4" /></Button>
        </li>)}</ol>
      </section>
      <section className="space-y-3 border rounded-lg p-4 lg:col-span-2">
        <h3 className="font-semibold">Or Create a New Custom Form Item</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label htmlFor="element-name">New Form Item Name</Label><Input id="element-name" value={elementName} onChange={e => setElementName(e.target.value)} /></div>
          <div className="space-y-2"><Label>Form Item Type</Label><Select value={kind} onValueChange={v => setKind(v as FieldKind)}><SelectTrigger aria-label="Form Item Type"><SelectValue /></SelectTrigger><SelectContent>{CUSTOM_KINDS.map(k => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}</SelectContent></Select></div>
        </div>
        {hasOptions && <div className="space-y-2 max-w-xl"><Label>Options</Label>{options.map((o, i) => <div key={i} className="flex gap-2"><Input aria-label={`Option ${i + 1}`} placeholder={`Option ${i + 1}`} value={o} onChange={e => setOptions(options.map((x, n) => n === i ? e.target.value : x))} /><Button variant="ghost" size="icon" aria-label={`Remove option ${i + 1}`} onClick={() => setOptions(options.filter((_, n) => n !== i))}><Trash2 className="h-4 w-4" /></Button></div>)}<Button variant="outline" size="sm" onClick={() => setOptions([...options, ""])}><Plus className="h-4 w-4 mr-2" />Add Option {options.length + 1}</Button></div>}
        <Button variant="secondary" disabled={busy} onClick={createElement}><Plus className="h-4 w-4 mr-2" />Create Form Item</Button>
      </section>
    </div>}

    <footer className="flex flex-wrap gap-2 border-t pt-4">
      {preview ? <Button variant="outline" onClick={() => setPreview(false)}><ArrowLeft className="h-4 w-4 mr-2" />Back To Add / Remove</Button> : <>
        <Button variant="outline" onClick={() => setKeys(["product_name"])}><Trash2 className="h-4 w-4 mr-2" />Clear All</Button>
        <Button variant="outline" onClick={() => setPreview(true)}><Eye className="h-4 w-4 mr-2" />Preview Form</Button>
      </>}
      <Button disabled={busy} onClick={() => saveForm()}><Save className="h-4 w-4 mr-2" />{busy ? "Saving…" : typeName === NEW ? "Create Form" : "Save Form"}</Button>
      {typeName !== NEW && <Button variant="ghost" disabled={busy} onClick={() => saveForm(!current.is_active)}>{current.is_active ? "Hide From Menu" : "Show In Menu"}</Button>}
    </footer>
  </div>;
}
