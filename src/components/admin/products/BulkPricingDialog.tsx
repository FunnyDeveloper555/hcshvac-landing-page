import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { computeSellingPrice, describeTerms, productOurCost, termsOf, type PricingRule } from "@/lib/pricingRules";

const db = supabase as any;
const money = (n: number | null | undefined) => (n == null ? "—" : `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  products: any[];
  onApplied: () => void;
}

export default function BulkPricingDialog({ open, onOpenChange, products, onApplied }: Props) {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [ruleId, setRuleId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    db.from("pricing_rules").select("*").eq("is_active", true).order("name").then(({ data, error }: any) => {
      if (error) toast.error(error.message);
      const list = (data || []).map((r: any) => ({ ...r, markup: Number(r.markup), labor_cost: Number(r.labor_cost), round_to: Number(r.round_to) }));
      setRules(list);
      if (list.length && !list.some((r: PricingRule) => r.id === ruleId)) setRuleId(list[0].id);
    });
  }, [open]);

  const rule = rules.find((r) => r.id === ruleId);
  const rows = useMemo(() => products.map((p) => {
    const cost = productOurCost(p);
    return { p, cost, next: rule && cost != null ? computeSellingPrice(cost, rule) : null };
  }), [products, rule]);
  const applicable = rows.filter((r) => r.next != null);

  const apply = async () => {
    if (!rule || !applicable.length) return;
    setBusy(true);
    const now = new Date().toISOString();
    let ok = 0;
    for (let i = 0; i < applicable.length; i += 20) {
      const batch = applicable.slice(i, i + 20);
      const results = await Promise.all(batch.map((r) => supabase.from("products").update({ selling_price: r.next, pricing_rule_id: rule.id, price_updated_at: now } as any).eq("id", r.p.id)));
      const err = results.find((x) => x.error)?.error;
      if (err) { toast.error(`Stopped after ${ok} products: ${err.message}`); break; }
      ok += batch.length;
    }
    setBusy(false);
    if (ok) { toast.success(`Selling price updated on ${ok} products`); onApplied(); onOpenChange(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Set Pricing Rule — {products.length} products</DialogTitle></DialogHeader>
        {rules.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active pricing rules yet. Create one in Products → Pricing Rules first.</p>
        ) : (
          <div className="space-y-3">
            <Select value={ruleId} onValueChange={setRuleId}>
              <SelectTrigger><SelectValue placeholder="Choose a rule" /></SelectTrigger>
              <SelectContent>{rules.map((r) => <SelectItem key={r.id} value={r.id!}>{r.name}</SelectItem>)}</SelectContent>
            </Select>
            {rule && <p className="text-sm text-muted-foreground">Formula: {describeTerms(termsOf(rule))}{rule.round_to ? ` (round up to ${rule.round_to})` : ""}</p>}
            <div className="max-h-[50vh] overflow-auto border rounded-md">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted"><tr className="text-left"><th className="p-2">Product</th><th className="p-2 text-right">Our Cost</th><th className="p-2 text-right">Current</th><th className="p-2 text-right">New Selling Price</th></tr></thead>
                <tbody>{rows.map(({ p, cost, next }) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-2">{p.product_name}<div className="text-xs text-muted-foreground">{p.model_number || ""}</div></td>
                    <td className="p-2 text-right">{money(cost)}</td>
                    <td className="p-2 text-right">{money(p.selling_price)}</td>
                    <td className="p-2 text-right font-medium">{next == null ? <span className="text-muted-foreground text-xs">No Our Cost — skipped</span> : money(next)}</td>
                  </tr>))}</tbody>
              </table>
            </div>
            {applicable.length < rows.length && <p className="text-xs text-muted-foreground">{rows.length - applicable.length} products have no Our Cost and will be skipped.</p>}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={apply} disabled={busy || !rule || !applicable.length}>{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Apply to {applicable.length} Products</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
