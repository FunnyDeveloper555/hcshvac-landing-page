import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Landmark, Loader2, Plus, Save, X } from "lucide-react";
import { DEFAULT_FINANCE_PLANS, contractorCost, monthlyPayment } from "@/lib/bundleMath";
import { money } from "./BundleEditor";

export interface PlanRow { id?: string; label: string | null; months: number; apr: number; bdr: number; sort_order: number; active: boolean }

export function useFinancePlans() {
  return useQuery({
    queryKey: ["finance-plans"], staleTime: 30000,
    queryFn: async (): Promise<PlanRow[]> => {
      const { data } = await supabase.from("finance_plans").select("*").order("sort_order").order("months");
      if (data?.length) return data.map((p) => ({ ...p, apr: Number(p.apr), bdr: Number(p.bdr) }));
      return DEFAULT_FINANCE_PLANS.map((p, i) => ({ label: null, months: p.months, apr: p.apr, bdr: p.dealerFee, sort_order: i, active: true }));
    },
  });
}

/** Shows monthly payments for any amount using the shared finance plans. */
/** A plan picked for an estimate (snapshot, so emailed/printed terms don't change later). */
export interface PickedPlan { key: string; label: string | null; months: number; apr: number; bdr: number }
export const planKey = (p: { months: number; apr: number; bdr: number }) => `${p.months}|${p.apr}|${p.bdr}`;
export const planName = (p: { label: string | null; months: number }) => p.label || `${p.months} months`;

export function FinanceCalculator({ amount, onAmountChange, title, selected, onSelectedChange }: {
  amount: number; onAmountChange?: (n: number) => void; title?: string;
  selected?: PickedPlan[]; onSelectedChange?: (s: PickedPlan[]) => void;
}) {
  const { data: plans = [], isLoading } = useFinancePlans();
  const active = plans.filter((p) => p.active);
  const picking = !!onSelectedChange;
  const keys = new Set((selected || []).map((p) => p.key));
  const toPick = (p: PlanRow): PickedPlan => ({ key: planKey(p), label: p.label, months: p.months, apr: p.apr, bdr: p.bdr });
  const toggle = (p: PlanRow, on: boolean) => {
    const rest = (selected || []).filter((x) => x.key !== planKey(p));
    onSelectedChange?.(on ? [...rest, toPick(p)].sort((a, b) => a.months - b.months) : rest);
  };
  const allOn = active.length > 0 && active.every((p) => keys.has(planKey(p)));
  return (
    <div className="space-y-3">
      {title && <div className="text-sm text-muted-foreground">{title}</div>}
      <div className="flex items-center gap-3 text-sm">
        <span>Cash / Check / Card:</span>
        {onAmountChange
          ? <Input className="w-40" type="number" step="0.01" value={amount || ""} onChange={(e) => onAmountChange(Number(e.target.value))} aria-label="Amount to finance" />
          : <span className="font-semibold">{money(amount)}</span>}
      </div>
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left">{picking && <th className="py-2 w-10"><input type="checkbox" aria-label="Select all plans" checked={allOn} onChange={(e) => onSelectedChange!(e.target.checked ? active.map(toPick) : [])} /></th>}<th className="py-2">Plan</th><th>Months</th><th>APR %</th><th>BDr %</th><th className="text-right">Monthly</th><th className="text-right">CC</th></tr></thead>
          <tbody>
            {active.map((p, i) => (
              <tr key={p.id || i} className={`border-b ${keys.has(planKey(p)) ? "bg-muted/60" : ""}`}>
                {picking && <td><input type="checkbox" aria-label={`Offer ${planName(p)}`} checked={keys.has(planKey(p))} onChange={(e) => toggle(p, e.target.checked)} /></td>}
                <td className="py-1.5">{p.label || `${p.months} months`}</td><td>{p.months}</td><td>{p.apr}</td><td>{p.bdr}</td>
                <td className="text-right font-medium">{money(monthlyPayment(amount, p.apr, p.months))}</td>
                <td className="text-right text-muted-foreground">{money(contractorCost(amount, p.bdr))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="text-xs text-muted-foreground">CC = amount the bank holds back (financed amount × BDr %). APR 0 = Same-As-Cash.</p>
    </div>
  );
}

/** Button that opens the calculator for a given amount — usable anywhere. */
export function FinanceButton({ amount, label = "Apply financing", title, selected, onSelectedChange }: {
  amount: number; label?: string; title?: string; selected?: PickedPlan[]; onSelectedChange?: (s: PickedPlan[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const n = selected?.length || 0;
  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)} disabled={!amount}><Landmark className="h-4 w-4 mr-1" />{label}{n ? ` (${n} picked)` : ""}</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto">
          <DialogHeader><DialogTitle>Finance Calculator</DialogTitle></DialogHeader>
          {onSelectedChange && <p className="text-sm text-muted-foreground">Tick the plan you chose with the customer, or tick several (or all) to offer them as options on the estimate.</p>}
          <FinanceCalculator amount={amount} title={title} selected={selected} onSelectedChange={onSelectedChange} />
          {onSelectedChange && <div className="flex justify-end"><Button onClick={() => setOpen(false)}>Done</Button></div>}
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Edit the loan plans every calculator uses. */
export function FinancePlansEditor() {
  const { data } = useFinancePlans();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [rows, setRows] = useState<PlanRow[] | null>(null);
  const [saving, setSaving] = useState(false);
  const list = rows ?? data ?? [];
  const upd = (i: number, patch: Partial<PlanRow>) => setRows(list.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const save = async () => {
    setSaving(true);
    try {
      const keep = list.filter((r) => r.id).map((r) => r.id!);
      const existing = (data || []).filter((r) => r.id && !keep.includes(r.id)).map((r) => r.id!);
      if (existing.length) { const { error } = await supabase.from("finance_plans").delete().in("id", existing); if (error) throw error; }
      const payload = list.map((r, i) => ({ ...(r.id ? { id: r.id } : {}), label: r.label || null, months: r.months, apr: r.apr, bdr: r.bdr, sort_order: i, active: r.active }));
      const { error } = await supabase.from("finance_plans").upsert(payload);
      if (error) throw error;
      setRows(null); qc.invalidateQueries({ queryKey: ["finance-plans"] });
      toast({ title: "Finance plans saved" });
    } catch (e) {
      toast({ title: "Could not save", description: (e as Error).message, variant: "destructive" });
    } finally { setSaving(false); }
  };
  return (
    <div className="space-y-2">
      <table className="w-full text-sm">
        <thead><tr className="border-b text-left"><th className="py-2">Label</th><th>Months</th><th>APR %</th><th>BDr %</th><th>On</th><th /></tr></thead>
        <tbody>
          {list.map((r, i) => (
            <tr key={r.id || `n${i}`} className="border-b">
              <td className="py-1 pr-2"><Input className="h-8" value={r.label || ""} placeholder={`${r.months} months`} onChange={(e) => upd(i, { label: e.target.value })} /></td>
              <td className="pr-2"><Input className="h-8 w-20" type="number" value={r.months} onChange={(e) => upd(i, { months: Number(e.target.value) })} /></td>
              <td className="pr-2"><Input className="h-8 w-20" type="number" step="0.01" value={r.apr} onChange={(e) => upd(i, { apr: Number(e.target.value) })} /></td>
              <td className="pr-2"><Input className="h-8 w-20" type="number" step="0.01" value={r.bdr} onChange={(e) => upd(i, { bdr: Number(e.target.value) })} /></td>
              <td><input type="checkbox" checked={r.active} onChange={(e) => upd(i, { active: e.target.checked })} aria-label="Plan active" /></td>
              <td className="text-right"><Button size="icon" variant="ghost" onClick={() => setRows(list.filter((_, j) => j !== i))}><X className="h-4 w-4" /></Button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setRows([...list, { label: "SAC 12", months: 12, apr: 0, bdr: 0, sort_order: list.length, active: true }])}><Plus className="h-4 w-4 mr-1" />Add plan</Button>
        <Button size="sm" onClick={save} disabled={saving || !rows}>{saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}Save plans</Button>
      </div>
    </div>
  );
}

export default function FinanceCalculatorPage() {
  const [amount, setAmount] = useState(10000);
  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-3xl font-bold">Finance Calculator</h2>
      <div className="rounded-md border p-4"><FinanceCalculator amount={amount} onAmountChange={setAmount} /></div>
      <div className="rounded-md border p-4 space-y-2">
        <Label className="text-base">Loan plans (used by every estimate and bundle)</Label>
        <FinancePlansEditor />
      </div>
    </div>
  );
}
