import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";

export const VISIT_TYPES = [
  "Service Repair",
  "Estimate",
  "Warranty",
  "Inspection Report",
  "Maintenance",
  "Installation",
  "Other",
];

const PRESETS = [
  { label: "Waivable ($0)", value: 0 },
  { label: "$99", value: 99 },
  { label: "$135", value: 135 },
  { label: "$155", value: 155 },
  { label: "Custom", value: -1 },
];

export default function DiagnosticFeesAdd() {
  const [params] = useSearchParams();
  const editId = params.get("id");
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [companyId, setCompanyId] = useState<string>("__all__");
  const [visitType, setVisitType] = useState("Service Repair");
  const [preset, setPreset] = useState<string>("155");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isWaivable, setIsWaivable] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState("");

  const { data: companies } = useQuery({
    queryKey: ["companies-active-min"],
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("id, name").eq("is_active", true).order("name");
      return data || [];
    },
  });

  useEffect(() => {
    if (!editId) return;
    (async () => {
      const { data } = await supabase.from("diagnostic_fees" as any).select("*").eq("id", editId).single();
      if (data) {
        setCompanyId((data as any).company_id || "__all__");
        setVisitType((data as any).visit_type);
        const amt = Number((data as any).fee_amount);
        const matched = PRESETS.find(p => p.value === amt && p.value !== -1);
        if (matched) {
          setPreset(String(matched.value));
        } else {
          setPreset("-1");
          setCustomAmount(amt.toString());
        }
        setIsWaivable((data as any).is_waivable);
        setIsActive((data as any).is_active);
        setNotes((data as any).notes || "");
      }
    })();
  }, [editId]);

  const save = useMutation({
    mutationFn: async () => {
      const amount = preset === "-1" ? Number(customAmount) : Number(preset);
      if (isNaN(amount) || amount < 0) throw new Error("Invalid amount");
      const payload = {
        company_id: companyId === "__all__" ? null : companyId,
        visit_type: visitType,
        fee_amount: amount,
        is_waivable: isWaivable,
        is_active: isActive,
        notes: notes || null,
      };
      if (editId) {
        const { error } = await supabase.from("diagnostic_fees" as any).update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("diagnostic_fees" as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editId ? "Updated" : "Created");
      qc.invalidateQueries({ queryKey: ["diagnostic-fees"] });
      navigate("/admin/diagnostic-fees");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold">{editId ? "Edit" : "Add"} Diagnostic Fee</h2>
      <Card>
        <CardHeader><CardTitle>Fee Configuration</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Company</Label>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All companies (default)</SelectItem>
                {companies?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Visit Type *</Label>
            <Select value={visitType} onValueChange={setVisitType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {VISIT_TYPES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fee Amount *</Label>
            <Select value={preset} onValueChange={setPreset}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRESETS.map(p => <SelectItem key={p.value} value={String(p.value)}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {preset === "-1" && (
              <Input type="number" min="0" step="0.01" placeholder="Custom amount" value={customAmount} onChange={e => setCustomAmount(e.target.value)} />
            )}
          </div>
          <div className="flex items-center justify-between">
            <Label>Waivable by tech</Label>
            <Switch checked={isWaivable} onCheckedChange={setIsWaivable} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Active</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {editId ? "Update" : "Create"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin/diagnostic-fees")}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
