import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Landmark, Loader2, Plus, Save, X } from "lucide-react";
import { DEFAULT_FINANCE_PLANS, contractorCost, monthlyPayment } from "@/lib/bundleMath";
import { money } from "./BundleEditor";

export type PlanType = "standard" | "bdr" | "ccr";
export interface PlanRow { id?: string; label: string | null; months: number; apr: number; bdr: number; sort_order: number; active: boolean; plan_type: PlanType; base_apr: number | null; understanding: string | null }
const TYPE_NAME: Record<PlanType, string> = { standard: "Standard", bdr: "Buy-Down (BDr)", ccr: "Contractor Cost (CCr)" };

export function useFinancePlans() {
  return useQuery({
    queryKey: ["finance-plans"], staleTime: 30000,
    queryFn: async (): Promise<PlanRow[]> => {
      const { data } = await supabase.from("finance_plans").select("*").order("sort_order").order("months");
      if (data?.length) return data.map((p) => ({ ...p, apr: Number(p.apr), bdr: Number(p.bdr), plan_type: (p.plan_type || "standard") as PlanType, base_apr: p.base_apr == null ? null : Number(p.base_apr) }));
      return DEFAULT_FINANCE_PLANS.map((p, i) => ({ label: null, months: p.months, apr: p.apr, bdr: p.dealerFee, sort_order: i, active: true, plan_type: "standard" as PlanType, base_apr: null, understanding: null }));
    },
  });
}

/** Shows monthly payments for any amount using the shared finance plans. */
/** A plan picked for an estimate (snapshot, so emailed/printed terms don't change later). */
export interface PickedPlan { key: string; label: string | null; months: number; apr: number; bdr: number; understanding?: string | null }
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
  const toPick = (p: PlanRow): PickedPlan => ({ key: planKey(p), label: p.label, months: p.months, apr: p.apr, bdr: p.bdr, understanding: p.understanding });
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
          <thead><tr className="border-b text-left">{picking && <th className="py-2 w-10"><input type="checkbox" aria-label="Select all plans" checked={allOn} onChange={(e) => onSelectedChange!(e.target.checked ? active.map(toPick) : [])} /></th>}<th className="py-2">Plan</th><th>Months</th><th>APR %</th><th>Base %</th><th>BDr/CCr %</th><th className="text-right">W/O</th><th className="text-right">Monthly</th><th className="text-right">BD/CC Price</th></tr></thead>
          <tbody>
            {active.map((p, i) => (
              <tr key={p.id || i} className={`border-b ${keys.has(planKey(p)) ? "bg-muted/60" : ""}`}>
                {picking && <td><input type="checkbox" aria-label={`Offer ${planName(p)}`} checked={keys.has(planKey(p))} onChange={(e) => toggle(p, e.target.checked)} /></td>}
                <td className="py-1.5"><div>{p.label || `${p.months} months`}</div><div className="text-xs text-muted-foreground">{TYPE_NAME[p.plan_type]}</div></td><td>{p.months}</td><td>{p.apr}</td><td>{p.base_apr ?? "—"}</td><td>{p.bdr}</td>
                <td className="text-right text-muted-foreground">{p.base_apr != null ? money(monthlyPayment(amount, p.base_apr, p.months)) : "—"}</td>
                <td className="text-right font-medium">{money(monthlyPayment(amount, p.apr, p.months))}</td>
                <td className="text-right text-muted-foreground">{money(contractorCost(amount, p.bdr))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="text-xs text-muted-foreground">APR = customer rate. W/O = payment at the Base APR. BD/CC Price = contractor cost (amount × BDr/CCr %), staff only. APR 0 = Same-As-Cash.</p>
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
  const [sample, setSample] = useState(15100);
  const list = rows ?? data ?? [];
  const upd = (i: number, patch: Partial<PlanRow>) => setRows(list.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const save = async () => {
    setSaving(true);
    try {
      const keep = list.filter((r) => r.id).map((r) => r.id!);
      const existing = (data || []).filter((r) => r.id && !keep.includes(r.id)).map((r) => r.id!);
      if (existing.length) { const { error } = await supabase.from("finance_plans").delete().in("id", existing); if (error) throw error; }
      const payload = list.map((r, i) => ({ ...(r.id ? { id: r.id } : {}), label: r.label || null, months: r.months, apr: r.apr, sort_order: i, active: r.active, plan_type: r.plan_type, base_apr: r.plan_type === "standard" ? null : r.base_apr, bdr: r.plan_type === "standard" ? 0 : r.bdr, understanding: r.understanding || null }));
      const { error } = await supabase.from("finance_plans").upsert(payload);
      if (error) throw error;
      setRows(null); qc.invalidateQueries({ queryKey: ["finance-plans"] });
      toast({ title: "Finance plans saved" });
    } catch (e) {
      toast({ title: "Could not save", description: (e as Error).message, variant: "destructive" });
    } finally { setSaving(false); }
  };
  const add = (t: PlanType) => setRows([...list, t === "standard"
    ? { label: "", plan_type: t, months: 60, apr: 16.99, base_apr: null, bdr: 0, understanding: "", sort_order: list.length, active: true }
    : { label: "", plan_type: t, months: 36, apr: t === "bdr" ? 10.99 : 17.99, base_apr: 16.99, bdr: t === "bdr" ? 9 : 4.9, understanding: "", sort_order: list.length, active: true }]);
  const P = sample;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => add("standard")}><Plus className="h-4 w-4 mr-1" />Add New</Button>
        <Button size="sm" variant="outline" onClick={() => add("bdr")}><Plus className="h-4 w-4 mr-1" />Add New BDr</Button>
        <Button size="sm" variant="outline" onClick={() => add("ccr")}><Plus className="h-4 w-4 mr-1" />Add New CCr</Button>
        <Button size="sm" onClick={save} disabled={saving || !rows}>{saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}Save Plan</Button>
        <span className="ml-auto text-sm text-muted-foreground">Sample principal</span>
        <Input className="h-8 w-28" type="number" value={sample} onChange={(e) => setSample(Number(e.target.value))} aria-label="Sample principal" />
      </div>
      {list.map((r, i) => {
        const x = r.plan_type === "bdr" ? "BD" : "CC";
        return (
          <div key={r.id || `n${i}`} className="rounded-md border p-3 space-y-2">
            <div className="flex flex-wrap items-end gap-2">
              <span className="text-xs font-medium rounded bg-muted px-2 py-1">{TYPE_NAME[r.plan_type]}</span>
              <div><Label className="text-xs">Label</Label><Input className="h-8 w-28" value={r.label || ""} onChange={(e) => upd(i, { label: e.target.value })} /></div>
              <div><Label className="text-xs">Months</Label><Input className="h-8 w-20" type="number" value={r.months} onChange={(e) => upd(i, { months: Number(e.target.value) })} /></div>
              {r.plan_type !== "standard" && <div><Label className="text-xs">Base APR %</Label><Input className="h-8 w-20" type="number" step="0.01" value={r.base_apr ?? ""} onChange={(e) => upd(i, { base_apr: Number(e.target.value) })} /></div>}
              {r.plan_type !== "standard" && <div><Label className="text-xs">{x}r %</Label><Input className="h-8 w-20" type="number" step="0.01" value={r.bdr} onChange={(e) => upd(i, { bdr: Number(e.target.value) })} /></div>}
              <div><Label className="text-xs">{r.plan_type === "standard" ? "APR %" : r.plan_type === "bdr" ? "w/BD APR %" : "CC APR %"}</Label><Input className="h-8 w-20" type="number" step="0.01" value={r.apr} onChange={(e) => upd(i, { apr: Number(e.target.value) })} /></div>
              <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={r.active} onChange={(e) => upd(i, { active: e.target.checked })} />On</label>
              <Button className="ml-auto" size="icon" variant="ghost" aria-label="Remove plan" onClick={() => setRows(list.filter((_, j) => j !== i))}><X className="h-4 w-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {r.plan_type !== "standard" && r.base_apr != null && <span className="rounded-full border px-2 py-0.5">Payment W/O {x}: {money(monthlyPayment(P, r.base_apr, r.months))}</span>}
              {r.plan_type !== "standard" && <span className="rounded-full border px-2 py-0.5">{x} Price: {money(contractorCost(P, r.bdr))}</span>}
              <span className="rounded-full bg-primary text-primary-foreground px-2 py-0.5">{r.plan_type === "standard" ? "Monthly" : `w/${x} Monthly`}: {money(monthlyPayment(P, r.apr, r.months))}</span>
            </div>
            <Textarea rows={2} placeholder="Understanding — plain-English terms shown to the customer" value={r.understanding || ""} onChange={(e) => upd(i, { understanding: e.target.value })} />
          </div>
        );
      })}
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
