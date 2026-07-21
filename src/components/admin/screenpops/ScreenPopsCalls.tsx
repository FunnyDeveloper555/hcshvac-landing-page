import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Phone, Eye, Search } from "lucide-react";

type CallRow = {
  id: string;
  direction: string | null;
  from_number: string | null;
  to_number: string | null;
  caller_name: string | null;
  status: string | null;
  created_at: string;
};

function fmt(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString(undefined, {
      year: "numeric", month: "short", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return d; }
}

export default function ScreenPopsCalls() {
  const [rows, setRows] = useState<CallRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [autoPop, setAutoPop] = useState<boolean>(() => {
    try { return localStorage.getItem("callpop_auto_enabled") === "1"; } catch { return false; }
  });

  const toggleAuto = (enabled: boolean) => {
    setAutoPop(enabled);
    try { localStorage.setItem("callpop_auto_enabled", enabled ? "1" : "0"); } catch {}
    window.dispatchEvent(new CustomEvent("callpop:auto-toggle", { detail: { enabled } }));
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("call_logs_3cx")
      .select("id, direction, from_number, to_number, caller_name, status, created_at")
      .eq("direction", "inbound")
      .order("created_at", { ascending: false })
      .limit(200);
    if (!error) setRows((data as CallRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const showPop = (row: CallRow) => {
    window.dispatchEvent(new CustomEvent("callpop:show", { detail: row }));
  };

  const filtered = rows.filter((r) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      (r.from_number || "").toLowerCase().includes(s) ||
      (r.to_number || "").toLowerCase().includes(s) ||
      (r.caller_name || "").toLowerCase().includes(s)
    );
  });

  return (
    <div className="p-2 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Phone className="h-4 w-4" /> Screen Pops — Calls
        </h2>
        <Button size="sm" variant="outline" onClick={load}>Refresh</Button>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative max-w-sm flex-1 min-w-[220px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search phone or name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch id="auto-pop" checked={autoPop} onCheckedChange={toggleAuto} />
          <Label htmlFor="auto-pop" className="text-sm cursor-pointer">
            Auto Screen Pop {autoPop ? "On" : "Off"}
          </Label>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left">
                <th className="px-3 py-2">Received</th>
                <th className="px-3 py-2">From</th>
                <th className="px-3 py-2">To</th>
                <th className="px-3 py-2">Caller ID</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="px-3 py-4 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-4 text-center text-muted-foreground">No inbound calls.</td></tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} className="border-t hover:bg-muted/20">
                  <td className="px-3 py-2 whitespace-nowrap">{fmt(r.created_at)}</td>
                  <td className="px-3 py-2 font-mono">{r.from_number || "—"}</td>
                  <td className="px-3 py-2 font-mono">{r.to_number || "—"}</td>
                  <td className="px-3 py-2">{r.caller_name || "—"}</td>
                  <td className="px-3 py-2">{r.status || "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <Button size="sm" variant="outline" onClick={() => showPop(r)}>
                      <Eye className="h-3.5 w-3.5 mr-1" /> Show Pop
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
