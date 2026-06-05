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

export default function CallScreenPop() {
  const [pop, setPop] = useState<Pop | null>(null);
  const [showCallback, setShowCallback] = useState(false);
  const [callbackDate, setCallbackDate] = useState("");
  const [callbackReason, setCallbackReason] = useState("");
  const [callbackAssign, setCallbackAssign] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

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

  useEffect(() => {
    const channel = supabase
      .channel("call-screen-pop")
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "call_logs_3cx" },
        (payload) => handleIncoming(payload.new),
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [handleIncoming]);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const since = lastCheckRef.current;
      lastCheckRef.current = new Date().toISOString();
      const { data, error } = await supabase
        .from("call_logs_3cx")
        .select("id, direction, from_number, to_number, caller_name, created_at")
        .eq("direction", "inbound")
        .gt("created_at", since)
        .order("created_at", { ascending: false })
        .limit(5);
      if (cancelled || error || !data?.length) return;
      const fresh = data.find((r) => !shownIds.current.has(r.id));
      if (fresh) handleIncoming(fresh);
    };
    tick();
    const id = setInterval(tick, 15_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [handleIncoming]);

  const triggerTest = async () => {
    const { data, error } = await supabase
      .from("call_logs_3cx")
      .select("id, direction, from_number, to_number, caller_name, created_at")
      .eq("direction", "inbound")
      .order("created_at", { ascending: false })
      .limit(1).maybeSingle();
    if (error || !data) return;
    shownIds.current.delete(data.id);
    handleIncoming(data);
  };

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
    await supabase.from("call_logs_3cx").update({
      notes: "Marked as telemarketer / blocked",
      status: "blocked",
    }).eq("id", pop.callId);
    toast({ title: "Marked as telemarketer" });
    close();
  };

  if (!pop) {
    return (
      <button
        onClick={triggerTest}
        title="Test screen pop with latest inbound call"
        className="fixed bottom-4 right-4 z-[55] flex items-center gap-2 px-3 py-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 text-xs font-medium"
      >
        <Bell className="h-3.5 w-3.5" /> Test Pop
      </button>
    );
  }

  const differentCompany =
    pop.match_type === "customer" &&
    pop.calling_in_company?.id &&
    pop.client_company?.id &&
    pop.calling_in_company.id !== pop.client_company.id;

  const callingInName = pop.calling_in_company?.name || "—";
  const clientOfName = pop.client_company?.name || pop.customer?.company_name || "—";

  return (
    <>
      <button
        onClick={triggerTest}
        className="fixed bottom-4 right-4 z-[55] flex items-center gap-2 px-3 py-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 text-xs font-medium"
      >
        <Bell className="h-3.5 w-3.5" /> Test Pop
      </button>

      <div className="fixed top-20 right-6 z-[60] w-[440px] max-h-[85vh] overflow-y-auto rounded-lg border bg-card text-card-foreground shadow-2xl animate-in slide-in-from-right-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-primary/5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Phone className="h-4 w-4 text-primary animate-pulse" />
            {pop.match_type === "employee" ? "Incoming Employee Call" : "Incoming Call"}
          </div>
          <div className="flex items-center gap-2">
            <Pin className="h-4 w-4 text-muted-foreground" />
            <button onClick={close} aria-label="Close" className="p-1 rounded hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Customer */}
          {pop.match_type === "customer" && pop.customer && (
            <>
              <div className="grid grid-cols-[110px_1fr_auto] gap-x-2 gap-y-1 text-sm">
                <span className="text-muted-foreground">Calling In On:</span>
                <span className={differentCompany ? "text-destructive font-medium" : "font-medium"}>{callingInName}</span>
                <span className="text-xs text-muted-foreground">Client Date: {fmtDate(pop.receivedAt)}</span>

                <span className="text-muted-foreground">CID NAME:</span>
                <span className="col-span-2">{pop.callerName || pop.customer.name || "—"}</span>

                <span className="text-muted-foreground">CID Phone:</span>
                <span className="col-span-2 font-mono">{pop.phone}</span>
              </div>

              <div className="border-t pt-3 grid grid-cols-[110px_1fr_auto] gap-x-2 gap-y-1 text-sm">
                <span className="text-muted-foreground">Client of:</span>
                <span className={differentCompany ? "text-destructive font-medium" : "font-medium"}>{clientOfName}</span>
                <span className="text-xs text-muted-foreground">
                  Client Date: {fmtDate(pop.customer.client_since)}
                </span>
              </div>

              <div className="text-xs space-y-1">
                <div><span className="text-muted-foreground">Registered Account Name: </span><span className="font-medium">{pop.customer.name || "—"}</span></div>
                <div><span className="text-muted-foreground">Registered Account Phone: </span><span className="font-mono">{pop.customer.registered_phone || pop.phone}</span></div>
                {pop.customer.business_name && (
                  <div><span className="text-muted-foreground">Business: </span>{pop.customer.business_name}</div>
                )}
              </div>

              <div className="border-t pt-3">
                <div className="font-bold text-sm mb-1">
                  Active Appointments: <span className="font-normal">{pop.customer.latest_appointment ? "Yes" : "No"} ({pop.customer.pending_appointments})</span>
                </div>
                {pop.customer.latest_appointment && (
                  <div className="text-xs space-y-1 mt-1">
                    <div><span className="text-muted-foreground">Appointment Type: </span>{pop.customer.latest_appointment.type || "—"}</div>
                    <div><span className="text-muted-foreground">Date / Time: </span>{fmtDate(pop.customer.latest_appointment.date)} {pop.customer.latest_appointment.time || ""}</div>
                    {pop.customer.latest_appointment.notes && (
                      <div className="text-muted-foreground italic line-clamp-2">{pop.customer.latest_appointment.notes}</div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" onClick={() => { navigate(`/admin/customers/list?edit=${pop.customer!.id}`); close(); }}>
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
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">CID NAME</div>
                  <div className="font-bold">{pop.callerName || "None"}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">CID PHONE</div>
                  <div className="font-mono">{pop.phone}</div>
                </div>
              </div>
              <div className="text-center text-sm text-muted-foreground py-6 border-y">
                No matching customer or employee record.
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={() => { navigate(`/admin/customers/add?phone=${encodeURIComponent(pop.phone)}`); close(); }}>
                  Create Profile
                </Button>
                <Button size="sm" variant="destructive" onClick={markTelemarketer}>
                  <Ban className="h-3.5 w-3.5 mr-1" /> Telemarketer (Block)
                </Button>
                <Button size="sm" variant="outline" className="ml-auto" onClick={close}>Close</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
