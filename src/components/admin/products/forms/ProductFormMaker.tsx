import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAdminLog } from "@/hooks/useAdminLog";
import { useProductForms, useProductFormElements, availableProductForms } from "@/hooks/useProductForms";
import { defaultForm, masterElements, type FieldKind, type FormValues } from "@/lib/productForms";
import { ProductFormFields } from "./ProductFormFields";
import { ArrowLeft, Eye, Plus, Save, Trash2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CUSTOM_KINDS: { value: FieldKind; label: string }[] = [{ value: "textarea", label: "Text Box" }, { value: "text", label: "Text Field" }, { value: "multi", label: "Multiple Select" }, { value: "radio", label: "Single Select" }, { value: "boolean", label: "Yes / No" }, { value: "select", label: "Drop Down List" }];
export default function ProductFormMaker() {
  const formsQuery = useProductForms(); const elementsQuery = useProductFormElements();
  const forms = availableProductForms(formsQuery.data); const allElements = masterElements(elementsQuery.data);
  const [typeName, setTypeName] = useState("Furnace");
  const [selected, setSelected] = useState<string[] | null>(null);
  const [newName, setNewName] = useState(""); const [newTypeOpen, setNewTypeOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false); const [elementName, setElementName] = useState("");
  const [kind, setKind] = useState<FieldKind>("text"); const [options, setOptions] = useState([""]);
  const [search, setSearch] = useState(""); const [preview, setPreview] = useState(false); const [previewValues, setPreviewValues] = useState<FormValues>({});
  const [busy, setBusy] = useState(false); const { toast } = useToast(); const client = useQueryClient(); const { logAction } = useAdminLog(); const navigate = useNavigate();
  const current = forms.find(f => f.name === typeName) || defaultForm(typeName);
  const keys = selected || current.fields;
  const chosen = allElements.filter(f => keys.includes(f.key));
  const pickType = (name: string) => { setTypeName(name); setSelected(null); setPreview(false); setPreviewValues({}); };
  const errorToast = (error: unknown) => toast({ title: "Unable to save", description: error instanceof Error ? error.message : String(error), variant: "destructive" });
  const saveForm = async () => {
    if (!keys.includes("product_name")) { toast({ title: "Product Name is required", variant: "destructive" }); return; }
    setBusy(true);
    try {
      const payload = { name: typeName.trim(), fields: keys, is_active: current.is_active };
      const result = current.id ? await supabase.from("product_type_forms").update(payload).eq("id", current.id).select("id").single() : await supabase.from("product_type_forms").insert(payload).select("id").single();
      if (result.error) throw result.error;
      await logAction(current.id ? "update" : "create", "product_type_form", result.data.id, { name: typeName, field_count: keys.length });
      await client.invalidateQueries({ queryKey: ["product-type-forms"] }); setSelected(null);
      toast({ title: "Form saved", description: typeName });
    } catch (error) { errorToast(error); } finally { setBusy(false); }
  };
  const addType = async () => {
    const name = newName.trim(); if (!name) return;
    if (forms.some(f => f.name.toLowerCase() === name.toLowerCase())) { toast({ title: "That product type already exists", variant: "destructive" }); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.from("product_type_forms").insert({ name, fields: defaultForm(name).fields }).select("id").single(); if (error) throw error;
      await logAction("create", "product_type_form", data.id, { name }); await client.invalidateQueries({ queryKey: ["product-type-forms"] });
      pickType(name); setNewName(""); setNewTypeOpen(false);
    } catch (error) { errorToast(error); } finally { setBusy(false); }
  };
  const createElement = async () => {
    const label = elementName.trim(); const list = [...new Set(options.map(o => o.trim()).filter(Boolean))];
    if (!label || (["select", "multi", "radio"].includes(kind) && !list.length)) { toast({ title: "Enter an element name and its choices", variant: "destructive" }); return; }
    if (allElements.some(e => e.label.toLowerCase() === label.toLowerCase())) { toast({ title: "An element with this name already exists", variant: "destructive" }); return; }
    setBusy(true);
    try {
      const key = `custom_${label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "field"}_${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
      const { data, error } = await supabase.from("product_form_elements").insert({ key, label, kind, options: list }).select("id").single(); if (error) throw error;
      await logAction("create", "product_form_element", data.id, { name: label, kind }); await client.invalidateQueries({ queryKey: ["product-form-elements"] });
      setSelected([...keys, key]); setCustomOpen(false); setElementName(""); setOptions([""]); setKind("text");
    } catch (error) { errorToast(error); } finally { setBusy(false); }
  };
  const toggleActive = async () => {
    setBusy(true);
    try {
      const payload = { name: typeName, fields: keys, is_active: !current.is_active };
      const result = current.id ? await supabase.from("product_type_forms").update(payload).eq("id", current.id).select("id").single() : await supabase.from("product_type_forms").insert(payload).select("id").single();
      if (result.error) throw result.error;
      await logAction("status_change", "product_type_form", result.data.id, { name: typeName, is_active: payload.is_active }); await client.invalidateQueries({ queryKey: ["product-type-forms"] });
    } catch (error) { errorToast(error); } finally { setBusy(false); }
  };
  if (formsQuery.isLoading || elementsQuery.isLoading) return <Loader2 className="h-6 w-6 animate-spin" />;
  if (formsQuery.error || elementsQuery.error) return <div className="space-y-3"><p className="text-destructive">Unable to load product forms.</p><Button onClick={() => { formsQuery.refetch(); elementsQuery.refetch(); }}>Retry</Button></div>;
  const visible = allElements.filter(f => `${f.label} ${f.section}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-6">
    <header className="flex flex-wrap justify-between gap-3 items-center"><h2 className="text-2xl font-bold">Database Content — Form Maker</h2><Button variant="outline" onClick={() => navigate(`/admin/products/type/${encodeURIComponent(typeName)}`)}>Open {typeName}</Button></header>
    <div className="grid lg:grid-cols-[220px_minmax(0,1fr)] gap-6">
      <aside className="space-y-3 lg:border-r lg:pr-5"><div className="flex items-center justify-between"><h3 className="font-semibold">Product Type</h3><Button size="icon" variant="ghost" aria-label="Add New Product Type" title="Add New Product Type" onClick={() => setNewTypeOpen(true)}><Plus className="h-4 w-4" /></Button></div>
        <div className="flex flex-wrap lg:flex-col gap-1">{forms.map(f => <Button key={f.name} variant={f.name === typeName ? "secondary" : "ghost"} className="justify-start h-auto min-h-9 whitespace-normal text-left" onClick={() => pickType(f.name)}>{f.name}{!f.is_active && <span className="ml-2 text-muted-foreground text-xs">Hidden</span>}</Button>)}</div>
      </aside>
      <div className="min-w-0 space-y-5">
        <div className="flex flex-wrap justify-between gap-2 items-center"><h3 className="text-xl font-semibold">{preview ? "Results of Selected List" : "Choose Database Form Elements"} — {typeName}</h3><span className="text-muted-foreground text-sm">{chosen.length} selected</span></div>
        {preview ? <ProductFormFields elements={chosen} values={previewValues} onChange={setPreviewValues} typeName={typeName} /> : <>
          <Input aria-label="Search form elements" placeholder="Search elements" value={search} onChange={e => setSearch(e.target.value)} />
          {[...new Set(visible.map(f => f.section))].map(section => <section className="space-y-3 border-t pt-4" key={section}><h4 className="font-semibold">{section}</h4><div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-x-5 gap-y-3">{visible.filter(f => f.section === section).map(f => <label key={f.key} className="flex items-start gap-2 text-sm"><Checkbox aria-label={f.label} checked={keys.includes(f.key)} disabled={f.key === "product_name"} onCheckedChange={checked => setSelected(checked === true ? [...keys, f.key] : keys.filter(k => k !== f.key))} className="mt-0.5 shrink-0" /><span>{f.label}</span></label>)}</div></section>)}
        </>}
        <footer className="flex flex-wrap gap-2 border-t pt-4">
          {preview ? <Button variant="outline" onClick={() => setPreview(false)}><ArrowLeft className="h-4 w-4 mr-2" />Back To Add / Remove</Button> : <>
            <Button variant="outline" onClick={() => setSelected(["product_name"])}><Trash2 className="h-4 w-4 mr-2" />Clear All</Button>
            <Button variant="outline" onClick={() => setCustomOpen(true)}><Plus className="h-4 w-4 mr-2" />Create New Database Form Element</Button>
            <Button variant="outline" onClick={() => setPreview(true)}><Eye className="h-4 w-4 mr-2" />Preview Selected Fields</Button>
          </>}
          <Button disabled={busy} onClick={saveForm}><Save className="h-4 w-4 mr-2" />{busy ? "Saving…" : preview ? "Create Form" : "Save Form"}</Button>
          <Button variant="ghost" disabled={busy} onClick={toggleActive}>{current.is_active ? "Hide From Menu" : "Show In Menu"}</Button>
        </footer>
      </div>
    </div>
    <Dialog open={newTypeOpen} onOpenChange={setNewTypeOpen}><DialogContent><DialogHeader><DialogTitle>Add New Product Type</DialogTitle></DialogHeader><Label htmlFor="new-product-type">New Product Name</Label><Input id="new-product-type" value={newName} onChange={e => setNewName(e.target.value)} /><Button disabled={busy || !newName.trim()} onClick={addType}>Submit</Button></DialogContent></Dialog>
    <Dialog open={customOpen} onOpenChange={setCustomOpen}><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Create New Database Form Element</DialogTitle></DialogHeader>
      <Label htmlFor="element-name">Element Name</Label><Input id="element-name" value={elementName} onChange={e => setElementName(e.target.value)} />
      <Label>Element Type</Label><Select value={kind} onValueChange={value => setKind(value as FieldKind)}><SelectTrigger aria-label="Element Type"><SelectValue /></SelectTrigger><SelectContent>{CUSTOM_KINDS.map(k => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}</SelectContent></Select>
      {["select", "multi", "radio"].includes(kind) && <div className="space-y-2"><Label>List Items</Label>{options.map((option, i) => <div key={i} className="flex gap-2"><Input aria-label={`List item ${i + 1}`} value={option} onChange={e => setOptions(options.map((o, n) => n === i ? e.target.value : o))} /><Button variant="ghost" size="icon" aria-label={`Remove list item ${i + 1}`} title="Remove list item" onClick={() => setOptions(options.filter((_, n) => n !== i))}><Trash2 className="h-4 w-4" /></Button></div>)}<Button variant="outline" onClick={() => setOptions([...options, ""])}><Plus className="h-4 w-4 mr-2" />Add Another</Button></div>}
      <Button disabled={busy} onClick={createElement}>Create Element</Button>
    </DialogContent></Dialog>
  </div>;
}