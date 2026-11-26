import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAdminLog } from "@/hooks/useAdminLog";
import { availableProductForms, useProductForms, useProductFormElements } from "@/hooks/useProductForms";
import { orderedElements, masterElements, productFormPatch, valuesFromProduct, asObject, type FormValues } from "@/lib/productForms";
import { ProductFormFields } from "./ProductFormFields";
import { Loader2, Pencil, Plus, Trash2, ChevronLeft, ChevronRight, Settings2, Save, ArrowLeft } from "lucide-react";
import ProductsAdd from "@/components/admin/ProductsAdd";

export function ConfiguredProductEditor({ typeName, id, onSaved }: { typeName: string; id?: string; onSaved: () => void }) {
  const formsQuery = useProductForms(); const customQuery = useProductFormElements(); const client = useQueryClient();
  const config = availableProductForms(formsQuery.data).find(f => f.name === typeName);
  const elements = orderedElements(masterElements(customQuery.data), config?.fields || []);
  const [values, setValues] = useState<FormValues>({ status: "active_not_showing" }); const [busy, setBusy] = useState(false);
  const { toast } = useToast(); const { logAction } = useAdminLog();
  const productQuery = useQuery({ queryKey: ["form-product", id], enabled: !!id, staleTime: 30_000, queryFn: async () => {
    const { data, error } = await supabase.from("products").select("*").eq("id", id || "").single(); if (error) throw error; return data;
  } });
  useEffect(() => { if (productQuery.data) setValues(valuesFromProduct(productQuery.data)); }, [productQuery.data]);
  const companiesQuery = useQuery({ queryKey: ["products-companies"], staleTime: 30_000, queryFn: async () => {
    const { data, error } = await supabase.from("companies").select("id,name").eq("is_active", true).order("name"); if (error) throw error; return data || [];
  } });
  const categoriesQuery = useQuery({ queryKey: ["product-categories"], staleTime: 30_000, queryFn: async () => {
    const { data, error } = await supabase.from("product_categories").select("id,parent_id,name,level,display_order").eq("is_active", true).order("display_order"); if (error) throw error; return data || [];
  } });
  const set = (key: string, value: unknown) => setValues(previous => ({ ...previous, [key]: value }));
  const categoryPath = (categoryId: string): string => {
    const names: string[] = []; const visited = new Set<string>(); let current = categoriesQuery.data?.find(c => c.id === categoryId);
    while (current && !visited.has(current.id)) { visited.add(current.id); names.unshift(current.name); current = categoriesQuery.data?.find(c => c.id === current?.parent_id); }
    return names.join(" / ");
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!values.company_id || !String(values.product_name || "").trim()) { toast({ title: "Company and Product Name are required", variant: "destructive" }); return; }
    setBusy(true);
    try {
      const payload = productFormPatch(typeName, elements, values, productQuery.data?.specifications);
      const result = id ? await supabase.from("products").update(payload).eq("id", id).select("id").single() : await supabase.from("products").insert(payload).select("id").single();
      if (result.error) throw result.error;
      await logAction(id ? "update" : "create", "product", result.data.id, { name: String(values.product_name), product_type: typeName });
      await client.invalidateQueries({ queryKey: ["type-products"] }); await client.invalidateQueries({ queryKey: ["form-product"] });
      toast({ title: id ? "Product updated" : "Product created" }); onSaved();
    } catch (error) { toast({ title: "Unable to save product", description: error instanceof Error ? error.message : String(asObject(error).message || error), variant: "destructive" }); } finally { setBusy(false); }
  };
  if (formsQuery.isLoading || customQuery.isLoading || (id && productQuery.isLoading)) return <Loader2 className="h-6 w-6 animate-spin" />;
  if (formsQuery.error || customQuery.error || productQuery.error || companiesQuery.error || categoriesQuery.error) return <p className="text-destructive">Unable to load this product form. Please refresh and try again.</p>;
  return <form onSubmit={save} className="space-y-5 compact-form">
    <h3 className="text-xl font-semibold">{id ? "Edit" : "Add"} {typeName}</h3>
    <section className="grid md:grid-cols-3 xl:grid-cols-4 gap-4">
      <div className="space-y-2"><Label htmlFor="form-status">Item Status</Label><Select value={String(values.status || "active_not_showing")} onValueChange={v => set("status", v)}><SelectTrigger id="form-status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active_showing">Item Active (Showing)</SelectItem><SelectItem value="active_not_showing">Item Active (Not Showing)</SelectItem><SelectItem value="discontinued_showing">Item Discontinued (Showing)</SelectItem><SelectItem value="deactivated">Deactivated (Not Showing)</SelectItem></SelectContent></Select></div>
      <div className="space-y-2"><Label htmlFor="form-company">Company *</Label><Select value={String(values.company_id || "__none")} onValueChange={v => set("company_id", v === "__none" ? "" : v)}><SelectTrigger id="form-company"><SelectValue placeholder="Select company" /></SelectTrigger><SelectContent><SelectItem value="__none">Select company</SelectItem>{companiesQuery.data?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label htmlFor="form-category">Product Filter Category</Label><Select value={String(values.category_id || "__none")} onValueChange={v => set("category_id", v === "__none" ? "" : v)}><SelectTrigger id="form-category"><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent><SelectItem value="__none">—</SelectItem>{categoriesQuery.data?.map(c => <SelectItem key={c.id} value={c.id}>{categoryPath(c.id)}</SelectItem>)}</SelectContent></Select></div>
    </section>
    <ProductFormFields elements={elements} values={values} onChange={setValues} typeName={typeName} />
    <div className="flex gap-2 border-t pt-4"><Button type="submit" disabled={busy}><Save className="h-4 w-4 mr-2" />{busy ? "Saving…" : id ? "Update Product" : "Create Product"}</Button><Button type="button" variant="outline" onClick={onSaved}>Cancel</Button></div>
  </form>;
}

export default function ProductTypePage() {
  const { typeName = "Furnace" } = useParams(); const [params, setParams] = useSearchParams(); const navigate = useNavigate();
  const [page, setPage] = useState(0); const [search, setSearch] = useState(""); const [querySearch, setQuerySearch] = useState("");
  const { toast } = useToast(); const { logAction } = useAdminLog(); const client = useQueryClient();
  const forms = useProductForms(); const form = availableProductForms(forms.data).find(f => f.name === typeName);
  const id = params.get("id") || undefined; const editing = params.has("new") || !!id;
  useEffect(() => { setPage(0); setSearch(""); setQuerySearch(""); }, [typeName]);
  const products = useQuery({ queryKey: ["type-products", typeName, page, querySearch], staleTime: 30_000, queryFn: async () => {
    let query = supabase.from("products").select("id,product_name,model_number,brand_name,status,selling_price", { count: "exact" }).eq("spec_type", typeName);
    if (querySearch) query = query.ilike("product_name", `%${querySearch.replace(/[%_]/g, "")}%`);
    const { data, error, count } = await query.order("product_name").range(page * 25, page * 25 + 24); if (error) throw error; return { rows: data || [], count: count || 0 };
  } });
  const remove = async (productId: string, name: string) => {
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    const { error } = await supabase.from("products").delete().eq("id", productId);
    if (error) { toast({ title: "Unable to delete", description: error.message, variant: "destructive" }); return; }
    await logAction("delete", "product", productId, { name }); await client.invalidateQueries({ queryKey: ["type-products"] });
  };
  if (!form) return <div className="space-y-3"><h2 className="text-xl font-semibold">Product type not found</h2><Button onClick={() => navigate("/admin/products/form-maker")}>Open Form Maker</Button></div>;
  return <div className="space-y-5"><header className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-bold">{typeName}</h2><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => navigate("/admin/products/form-maker")}><Settings2 className="h-4 w-4 mr-2" />Form Maker</Button>{editing ? <Button variant="outline" onClick={() => setParams({})}><ArrowLeft className="h-4 w-4 mr-2" />Back to List</Button> : <Button onClick={() => setParams({ new: "1" })}><Plus className="h-4 w-4 mr-2" />Add {typeName}</Button>}</div></header>
    {editing ? <ConfiguredProductEditor key={`${typeName}-${id || "new"}`} typeName={typeName} id={id} onSaved={() => setParams({})} /> : <>
      <form onSubmit={e => { e.preventDefault(); setQuerySearch(search.trim()); setPage(0); }} className="flex gap-2 max-w-lg"><Input aria-label="Search products by name" placeholder="Search products" value={search} onChange={e => setSearch(e.target.value)} /><Button variant="outline" type="submit">Search</Button></form>
      {products.error ? <div className="space-y-2"><p className="text-destructive">Unable to load products.</p><Button onClick={() => products.refetch()}>Retry</Button></div> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Model</TableHead><TableHead>Brand</TableHead><TableHead>Status</TableHead><TableHead>Selling Price</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>
        {products.isLoading ? <TableRow><TableCell colSpan={6}>Loading…</TableCell></TableRow> : !products.data?.rows.length ? <TableRow><TableCell colSpan={6} className="text-muted-foreground">No products found.</TableCell></TableRow> : products.data.rows.map(p => <TableRow key={p.id}><TableCell className="font-medium">{p.product_name}</TableCell><TableCell>{p.model_number || "—"}</TableCell><TableCell>{p.brand_name || "—"}</TableCell><TableCell>{p.status.replace(/_/g, " ")}</TableCell><TableCell>{p.selling_price == null ? "—" : `$${p.selling_price.toFixed(2)}`}</TableCell><TableCell><div className="flex gap-1"><Button size="icon" variant="ghost" title="Edit product" aria-label={`Edit ${p.product_name}`} onClick={() => setParams({ id: p.id })}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" title="Delete product" aria-label={`Delete ${p.product_name}`} onClick={() => remove(p.id, p.product_name)}><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>)}
      </TableBody></Table></div>}
      <footer className="flex items-center justify-between gap-3"><span className="text-sm text-muted-foreground">{products.data?.count || 0} products · Page {page + 1}</span><div className="flex gap-2"><Button size="icon" variant="outline" aria-label="Previous page" title="Previous page" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button><Button size="icon" variant="outline" aria-label="Next page" title="Next page" disabled={(page + 1) * 25 >= (products.data?.count || 0)} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button></div></footer>
    </>}
  </div>;
}

/** Keep legacy editors for untouched types; configured forms apply at every catalog edit entry. */
export function FormAwareProductEntry() {
  const [params] = useSearchParams(); const id = params.get("id"); const type = params.get("type"); const forms = useProductForms(); const navigate = useNavigate();
  const query = useQuery({ queryKey: ["form-entry-type", id], enabled: !!id, staleTime: 30_000, queryFn: async () => {
    const { data, error } = await supabase.from("products").select("spec_type").eq("id", id || "").single(); if (error) throw error; return data;
  } });
  if (forms.isLoading || (id && query.isLoading)) return <Loader2 className="h-6 w-6 animate-spin" />;
  if (forms.error || query.error) return <p className="text-destructive">Unable to load product settings. Please refresh.</p>;
  const typeName = query.data?.spec_type || type;
  const saved = forms.data?.find(f => f.name === typeName);
  return saved && typeName ? <ConfiguredProductEditor key={id || typeName} id={id || undefined} typeName={typeName} onSaved={() => navigate("/admin/products/list")} /> : <ProductsAdd />;
}