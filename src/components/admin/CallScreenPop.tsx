import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Phone, X, Pin, Bell, Ban } from "lucide-react";

type Company = { id: string; name: string } | null;

type Pop = {
  callId: string;
  phone: string;
  toNumber?: string | null;
  callerName?: string | null;
  receivedAt: string;
  match_type: "customer" | "employee" | "unknown";
  calling_in_company?: Company;
  client_company?: Company;
  customer?: {
    id: string;
    name: string | null;
    business_name: string | null;
    company_name: string | null;
    registered_phone: string | null;
    client_since: string | null;
    pending_appointments: number;
    latest_appointment: {
      id: string;
      type: string | null;
      date: string | null;
      time: string | null;
      status: string | null;
      notes: string | null;
    } | null;
  };
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    status: string;
  };
};

function fmtDate(d?: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString(); } catch { return d; }
}

function fmtDateTime(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString(undefined, {
      year: "numeric", month: "short", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  } catch { return d; }
}

export default function CallScreenPop() {
  const [pop, setPop] = useState<Pop | null>(null);
  const [showCallback, setShowCallback] = useState(false);
  const [callbackDate, setCallbackDate] = useState("");
  const [callbackReason, setCallbackReason] = useState("");
  const [callbackAssign, setCallbackAssign] = useState("");
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const onDragStart = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    dragRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 100, ev.clientX - dragRef.current.dx)),
        y: Math.max(0, Math.min(window.innerHeight - 50, ev.clientY - dragRef.current.dy)),
      });
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };


  const SEEN_KEY = "callpop_seen_ids_v1";
  const loadSeen = (): Set<string> => {
    try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]")); } catch { return new Set(); }
  };
  const persistSeen = (s: Set<string>) => {
    try { localStorage.setItem(SEEN_KEY, JSON.stringify([...s].slice(-500))); } catch {}
  };
  const shownIds = useRef<Set<string>>(loadSeen());
  const lastCheckRef = useRef<string>(new Date(Date.now() - 24 * 3600_000).toISOString());

  const handleIncoming = useCallback(async (row: any) => {
    if (!row || !row.id) return;
    if (row.direction && row.direction !== "inbound") return;
    if (shownIds.current.has(row.id)) return;
    shownIds.current.add(row.id);
    persistSeen(shownIds.current);

    const phone = row.from_number || row.matched_phone;
    if (!phone) return;

    // Suppress screen pop for blocked numbers
    try {
      const { data: blocked } = await supabase.rpc("is_phone_blocked", { _phone: phone } as any);
      if (blocked === true) {
        await supabase.from("call_logs_3cx").update({
          status: "blocked",
          notes: "Auto-suppressed: number is on blocklist",
        }).eq("id", row.id);
        return;
      }
    } catch (e) { console.error("is_phone_blocked error", e); }

    const { data, error } = await supabase.rpc("lookup_caller_by_phone", {
      _phone: phone,
      _to_number: row.to_number ?? null,
    } as any);
    if (error) console.error("lookup_caller_by_phone error", error);
    const result = (data as any) || { match_type: "unknown" };

    setPop({
      callId: row.id,
      phone,
      toNumber: row.to_number,
      callerName: row.caller_name,
      receivedAt: row.created_at || new Date().toISOString(),
      match_type: result?.match_type || "unknown",
      calling_in_company: result?.calling_in_company || null,
      client_company: result?.client_company || null,
      customer: result?.customer,
      employee: result?.employee,
    });
    setShowCallback(false);
    setCallbackDate(""); setCallbackReason(""); setCallbackAssign("");

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 880; g.gain.value = 0.05;
      o.start(); o.stop(ctx.currentTime + 0.18);
    } catch {}
  }, []);

  // Automatic screen pop (realtime + polling) is disabled.
  // Screen pops are only triggered manually from the ScreenPops → Calls list
  // via the "callpop:show" window event.
  useEffect(() => {
    const onManual = (e: Event) => {
      const row = (e as CustomEvent).detail;
      if (!row) return;
      shownIds.current.delete(row.id);
      handleIncoming({ ...row, direction: "inbound" });
    };
    window.addEventListener("callpop:show", onManual as EventListener);
    return () => window.removeEventListener("callpop:show", onManual as EventListener);
  }, [handleIncoming]);

  const close = () => setPop(null);

  const saveCallback = async () => {
    if (!pop || !callbackDate) {
      toast({ title: "Pick a callback date", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("call_logs_3cx").update({
      notes: `Callback scheduled for ${callbackDate}. ${callbackAssign ? "Assigned to " + callbackAssign + ". " : ""}${callbackReason}`,
    }).eq("id", pop.callId);
    if (error) { toast({ title: "Failed to save", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Call back scheduled", description: `For ${callbackDate}` });
    close();
  };

  const markTelemarketer = async () => {
    if (!pop) return;
    const digits = (pop.phone || "").replace(/\D/g, "");
    const last10 = digits.slice(-10);
    if (last10.length < 7) {
      toast({ title: "Invalid phone number", variant: "destructive" });
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    const { error: blockErr } = await supabase.from("blocked_numbers").upsert({
      phone_last10: last10,
      original_phone: pop.phone,
      reason: "telemarketer",
      blocked_by: userData.user?.id ?? null,
    }, { onConflict: "phone_last10" });
    if (blockErr) {
      toast({ title: "Failed to block number", description: blockErr.message, variant: "destructive" });
      return;
    }
    await supabase.from("call_logs_3cx").update({
      notes: "Marked as telemarketer / blocked",
      status: "blocked",
    }).eq("id", pop.callId);
    toast({ title: "Number blocked", description: "Future calls from this number will be auto-suppressed." });
    close();
  };

  if (!pop) {
    return null;
  }

  const differentCompany =
    pop.match_type === "customer" &&
    pop.calling_in_company?.id &&
    pop.client_company?.id &&
    pop.calling_in_company.id !== pop.client_company.id;

  const callingInName = pop.calling_in_company?.name || "—";
  const clientOfName = pop.client_company?.name || pop.customer?.company_name || "—";
  const sameCompany =
    pop.match_type === "customer" &&
    (!pop.calling_in_company?.id ||
      !pop.client_company?.id ||
      pop.calling_in_company.id === pop.client_company.id);
  const callingInClientDate = sameCompany ? fmtDate(pop.customer?.client_since) : "N/A";

  return (
    <>
      <style>{`
        @keyframes callpop-blink {
          0%, 100% { background-color: hsl(var(--destructive) / 0.15); }
          50% { background-color: hsl(var(--destructive) / 0.5); }
        }
        .callpop-blink { animation: callpop-blink 0.8s ease-in-out infinite; border-radius: 4px; padding: 0 4px; }
      `}</style>
      <button
        onClick={triggerTest}
        className="fixed bottom-4 right-4 z-[55] flex items-center gap-2 px-3 py-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 text-xs font-medium"
      >
        <Bell className="h-3.5 w-3.5" /> Test Pop
      </button>

      <div
        className={`fixed z-[60] w-[460px] max-h-[85vh] overflow-y-auto rounded-lg border bg-card text-card-foreground shadow-2xl animate-in slide-in-from-right-4 duration-200 ${differentCompany ? "ring-2 ring-destructive" : ""}`}
        style={pos ? { top: pos.y, left: pos.x, right: "auto" } : { top: 80, right: 24 }}
      >
        {/* Header */}
        <div onMouseDown={onDragStart} className="flex items-center justify-between px-4 py-2 border-b bg-primary/5 cursor-move select-none">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Phone className="h-4 w-4 text-primary animate-pulse" />
            {pop.match_type === "employee"
              ? "Screen Pop (Employee)"
              : pop.match_type === "unknown"
              ? "Screen Pop (NEW Unknown Caller)"
              : differentCompany
              ? "Screen Pop (Registered — Different Company)"
              : "Screen Pop (Known Registered Caller)"}
          </div>
          <div className="flex items-center gap-2">
            <Pin className="h-4 w-4 text-muted-foreground" />
            <button onClick={close} aria-label="Close" className="p-1 rounded hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-4 py-1.5 border-b bg-muted/30 text-[11px] text-muted-foreground flex items-center justify-between">
          <span>Call received</span>
          <span className="font-mono text-foreground">{fmtDateTime(pop.receivedAt)}</span>
        </div>

        <div className="p-5 space-y-4">
          {/* Customer */}
          {pop.match_type === "customer" && pop.customer && (
            <>
              <div className="grid grid-cols-[110px_1fr_auto] gap-x-2 gap-y-1 text-sm">
                <span className="text-muted-foreground">Calling In On:</span>
                <span className={differentCompany ? "callpop-blink font-semibold" : "font-medium"}>{callingInName}</span>
                <span className="text-xs text-muted-foreground">Client Date: {callingInClientDate}</span>

                <span className="text-muted-foreground">CID NAME:</span>
                <span className="col-span-2">{pop.callerName || pop.customer.name || "—"}</span>

                <span className="text-muted-foreground">CID Phone:</span>
                <span className="col-span-2 font-mono">{pop.phone}</span>
              </div>

              <div className="border-t pt-3 grid grid-cols-[110px_1fr_auto] gap-x-2 gap-y-1 text-sm">
                <span className="text-muted-foreground">Client of:</span>
                <span className={differentCompany ? "callpop-blink font-semibold" : "font-medium"}>{clientOfName}</span>
                <span className="text-xs text-muted-foreground">
                  Client Date: {fmtDate(pop.customer.client_since)}
                </span>
              </div>

              {differentCompany && (
                <div className="callpop-blink text-xs font-semibold text-center py-2">
                  ⚠ Registered with a DIFFERENT company — verify before assisting
                </div>
              )}

              <div className="text-xs space-y-1">
                <div><span className="text-muted-foreground">Registered Account Name: </span><span className="font-medium">{pop.customer.name || "—"}</span></div>
                <div><span className="text-muted-foreground">Registered Account Phone: </span><span className="font-mono">{pop.customer.registered_phone || pop.phone}</span></div>
                <div><span className="text-muted-foreground">Registered Account Phone 2: </span><span className="font-mono">—</span></div>
                {pop.customer.business_name && (
                  <div><span className="text-muted-foreground">Business: </span>{pop.customer.business_name}</div>
                )}
              </div>

              <div className="border-t pt-3 text-sm space-y-1">
                <div className="font-bold">
                  Active Appointments: <span className="font-normal">{pop.customer.latest_appointment ? "Yes" : "No"} ({pop.customer.pending_appointments})</span>
                </div>
                <div className="text-xs"><span className="text-muted-foreground">Appointment Type: </span>{pop.customer.latest_appointment?.type || "N/A"}</div>
                <div className="text-xs"><span className="text-muted-foreground">Appointment Date / Time: </span>{pop.customer.latest_appointment ? `${fmtDate(pop.customer.latest_appointment.date)} ${pop.customer.latest_appointment.time || ""}` : "N/A"}</div>
                <div className="text-xs"><span className="text-muted-foreground">Assigned To: </span>{pop.customer.latest_appointment ? "—" : "N/A"}</div>
                {pop.customer.latest_appointment?.notes && (
                  <div className="text-xs text-muted-foreground italic line-clamp-2">{pop.customer.latest_appointment.notes}</div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" onClick={() => { navigate(`/admin/customers/add?id=${pop.customer!.id}`); close(); }}>
                  View Profile
                </Button>
                {pop.customer.latest_appointment && (
                  <Button size="sm" variant="secondary"
                    onClick={() => { navigate(`/admin/appointments/list`); close(); }}>
                    View Appointment
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setShowCallback((v) => !v)}>
                  {differentCompany ? "Follow up Call Back" : "Schedule Call Back"}
                </Button>
                <Button size="sm" variant="destructive" className="ml-auto" onClick={close}>Close</Button>
              </div>

              {showCallback && (
                <div className="border-t pt-3 space-y-2 text-sm">
                  <div>
                    <Label className="text-xs">Scheduled For</Label>
                    <Input type="date" value={callbackDate} onChange={(e) => setCallbackDate(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Reason / Notes</Label>
                    <Textarea rows={2} value={callbackReason} onChange={(e) => setCallbackReason(e.target.value)} placeholder="Call back and inform of something..." />
                  </div>
                  <div>
                    <Label className="text-xs">Assign To (Department or Person)</Label>
                    <Input value={callbackAssign} onChange={(e) => setCallbackAssign(e.target.value)} />
                  </div>
                  <p className="text-[11px] text-muted-foreground italic">
                    Applied to Employee Calendar and Company General Appointment Calendars.
                  </p>
                  <Button size="sm" onClick={saveCallback}>Save Call Back</Button>
                </div>
              )}
            </>
          )}

          {/* Employee */}
          {pop.match_type === "employee" && pop.employee && (
            <>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Employee:</div>
                  <div className="font-bold">{pop.employee.first_name} {pop.employee.last_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">PHONE:</div>
                  <div className="font-mono">{pop.phone}</div>
                </div>
              </div>
              <div className="text-sm border-t pt-3 space-y-1">
                <div><span className="text-muted-foreground">HCS Employment Status: </span><span className="font-medium">{pop.employee.status}</span></div>
                {pop.calling_in_company?.name && (
                  <div><span className="text-muted-foreground">Assigned To: </span>{pop.calling_in_company.name}</div>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={() => { navigate(`/admin/employees`); close(); }}>
                  View Personnel Profile
                </Button>
                <Button size="sm" variant="outline" onClick={() => { navigate(`/admin/calls`); close(); }}>
                  Call History
                </Button>
                <Button size="sm" variant="destructive" className="ml-auto" onClick={close}>Close</Button>
              </div>
            </>
          )}

          {/* Unknown */}
          {pop.match_type === "unknown" && (
            <>
              <div className="grid grid-cols-[110px_1fr_auto] gap-x-2 gap-y-1 text-sm">
                <span className="text-muted-foreground">Calling In On:</span>
                <span className="font-medium">{callingInName}</span>
                <span className="text-xs text-muted-foreground">Client Date: N/A</span>

                <span className="text-muted-foreground">CID NAME:</span>
                <span className="col-span-2">{pop.callerName || "Unknown / Telemarketer / SPAM"}</span>

                <span className="text-muted-foreground">CID Phone:</span>
                <span className="col-span-2 font-mono">{pop.phone}</span>
              </div>

              <div className="border-t pt-3 text-xs space-y-1">
                <div><span className="text-muted-foreground">Client of: </span>N/A</div>
                <div><span className="text-muted-foreground">Registered Account Name: </span>N/A</div>
                <div><span className="text-muted-foreground">Registered Account Phone: </span>N/A</div>
                <div><span className="text-muted-foreground">Registered Account Phone 2: </span>N/A</div>
              </div>

              <div className="border-t pt-3 text-xs space-y-1">
                <div className="font-bold text-sm">Active Appointments: <span className="font-normal">No</span></div>
                <div><span className="text-muted-foreground">Appointment Type: </span>N/A</div>
                <div><span className="text-muted-foreground">Appointment Date / Time: </span>N/A</div>
                <div><span className="text-muted-foreground">Assigned To: </span>N/A</div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" onClick={() => {
                  const params = new URLSearchParams({ phone: pop.phone });
                  if (pop.callerName) params.set("name", pop.callerName);
                  navigate(`/admin/customers/add?${params.toString()}`);
                  close();
                }}>
                  Create Profile
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowCallback((v) => !v)}>
                  Schedule Call Back
                </Button>
                <Button size="sm" variant="destructive" onClick={markTelemarketer}>
                  <Ban className="h-3.5 w-3.5 mr-1" /> Block
                </Button>
                <Button size="sm" variant="ghost" className="ml-auto" onClick={close}>Close</Button>
              </div>

              {showCallback && (
                <div className="border-t pt-3 space-y-2 text-sm">
                  <div>
                    <Label className="text-xs">Scheduled For</Label>
                    <Input type="date" value={callbackDate} onChange={(e) => setCallbackDate(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Reason / Notes</Label>
                    <Textarea rows={2} value={callbackReason} onChange={(e) => setCallbackReason(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Assign To (Department or Person)</Label>
                    <Input value={callbackAssign} onChange={(e) => setCallbackAssign(e.target.value)} />
                  </div>
                  <Button size="sm" onClick={saveCallback}>Save Call Back</Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
