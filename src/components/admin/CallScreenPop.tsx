import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Phone, X, User, Briefcase, HelpCircle, Bell } from "lucide-react";

type Pop = {
  callId: string;
  phone: string;
  callerName?: string | null;
  match_type: "customer" | "employee" | "unknown";
  customer?: {
    id: string;
    name: string | null;
    business_name: string | null;
    company_name: string | null;
    pending_appointments: number;
  };
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
  };
};

export default function CallScreenPop() {
  const [pop, setPop] = useState<Pop | null>(null);
  const navigate = useNavigate();
  const SEEN_KEY = "callpop_seen_ids_v1";
  const loadSeen = (): Set<string> => {
    try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]")); } catch { return new Set(); }
  };
  const persistSeen = (s: Set<string>) => {
    try { localStorage.setItem(SEEN_KEY, JSON.stringify([...s].slice(-500))); } catch {}
  };
  const shownIds = useRef<Set<string>>(loadSeen());
  // Look back 24h on mount so we catch any unseen calls the poller imported while away
  const lastCheckRef = useRef<string>(new Date(Date.now() - 24 * 3600_000).toISOString());

  const handleIncoming = useCallback(async (row: any) => {
    if (!row || !row.id) return;
    if (row.direction && row.direction !== "inbound") return;
    if (shownIds.current.has(row.id)) return;
    shownIds.current.add(row.id);
    persistSeen(shownIds.current);

    const phone = row.from_number || row.matched_phone;
    if (!phone) return;

    const { data, error } = await supabase.rpc("lookup_caller_by_phone", { _phone: phone });
    if (error) {
      console.error("lookup_caller_by_phone error", error);
    }
    const result = (data as any) || { match_type: "unknown" };
    setPop({
      callId: row.id,
      phone,
      callerName: row.caller_name,
      match_type: result?.match_type || "unknown",
      customer: result?.customer,
      employee: result?.employee,
    });

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 880; g.gain.value = 0.05;
      o.start(); o.stop(ctx.currentTime + 0.18);
    } catch {}
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("call-screen-pop")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "call_logs_3cx" },
        (payload) => {
          console.log("[CallScreenPop] realtime insert", payload.new);
          handleIncoming(payload.new);
        },
      )
      .subscribe((status) => {
        console.log("[CallScreenPop] channel status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [handleIncoming]);

  // Polling fallback — catches rows missed during page transitions / disconnects
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const since = lastCheckRef.current;
      lastCheckRef.current = new Date().toISOString();
      const { data, error } = await supabase
        .from("call_logs_3cx")
        .select("id, direction, from_number, caller_name, created_at")
        .eq("direction", "inbound")
        .gt("created_at", since)
        .order("created_at", { ascending: false })
        .limit(5);
      if (cancelled || error || !data?.length) return;
      // Show only the newest unshown row
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
      .select("id, direction, from_number, caller_name")
      .eq("direction", "inbound")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return;
    shownIds.current.delete(data.id);
    handleIncoming(data);
  };

  const close = () => setPop(null);

  return (
    <>
      {/* Floating test button — bottom-right */}
      <button
        onClick={triggerTest}
        title="Test screen pop with latest inbound call"
        className="fixed bottom-4 right-4 z-[55] flex items-center gap-2 px-3 py-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 text-xs font-medium"
      >
        <Bell className="h-3.5 w-3.5" /> Test Pop
      </button>

      {pop && (
        <div className="fixed top-20 right-6 z-[60] w-[380px] rounded-lg border bg-card shadow-2xl animate-in slide-in-from-right-4 duration-200">
          <div className="flex items-center justify-between px-4 py-2 border-b bg-primary/5 rounded-t-lg">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Phone className="h-4 w-4 text-primary animate-pulse" />
              Incoming Call
            </div>
            <button onClick={close} aria-label="Close" className="p-1 rounded hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5">
            {pop.match_type === "customer" && pop.customer && (
              <>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" /> Registered Customer
                    </div>
                    <div className="text-lg font-bold mt-1">{pop.customer.name || "Unnamed"}</div>
                  </div>
                  <div className="text-sm font-mono">{pop.phone}</div>
                </div>
                {(pop.customer.business_name || pop.customer.company_name) && (
                  <div className="text-sm text-muted-foreground mb-2">
                    {pop.customer.business_name || pop.customer.company_name}
                  </div>
                )}
                <div className="text-sm mb-4">
                  <span className="font-semibold">{pop.customer.pending_appointments}</span> Appointment
                  {pop.customer.pending_appointments === 1 ? "" : "s"} Pending
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1"
                    onClick={() => { navigate(`/admin/customers/list?edit=${pop.customer!.id}`); close(); }}>
                    Profile
                  </Button>
                  <Button size="sm" variant="secondary" className="flex-1"
                    onClick={() => { navigate(`/admin/appointments/list`); close(); }}>
                    Appointments
                  </Button>
                </div>
              </>
            )}

            {pop.match_type === "employee" && pop.employee && (
              <>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                      <Briefcase className="h-3 w-3" /> Employee
                    </div>
                    <div className="text-lg font-bold mt-1">
                      {pop.employee.first_name} {pop.employee.last_name}
                    </div>
                  </div>
                  <div className="text-sm font-mono">{pop.phone}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1"
                    onClick={() => { navigate(`/admin/employees`); close(); }}>
                    View Personnel Profile
                  </Button>
                </div>
              </>
            )}

            {pop.match_type === "unknown" && (
              <>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                      <HelpCircle className="h-3 w-3" /> Unknown Caller
                    </div>
                    <div className="text-lg font-bold mt-1">{pop.callerName || "No CID Name"}</div>
                  </div>
                  <div className="text-sm font-mono">{pop.phone}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1"
                    onClick={() => { navigate(`/admin/customers/add?phone=${encodeURIComponent(pop.phone)}`); close(); }}>
                    Create Profile
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
