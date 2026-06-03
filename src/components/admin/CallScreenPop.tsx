import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Phone, X, User, Briefcase, HelpCircle } from "lucide-react";

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

  const handleIncoming = useCallback(async (row: any) => {
    if (!row || row.direction !== "inbound") return;
    const phone = row.from_number || row.matched_phone;
    if (!phone) return;

    const { data, error } = await supabase.rpc("lookup_caller_by_phone", { _phone: phone });
    if (error) {
      console.error("lookup_caller_by_phone error", error);
      return;
    }
    const result = data as any;
    setPop({
      callId: row.id,
      phone,
      callerName: row.caller_name,
      match_type: result?.match_type || "unknown",
      customer: result?.customer,
      employee: result?.employee,
    });

    // Audio ping (best effort, fails silently if blocked)
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 880; g.gain.value = 0.05;
      o.start(); o.stop(ctx.currentTime + 0.18);
    } catch {}
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("call-screen-pop")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "call_logs_3cx" },
        (payload) => handleIncoming(payload.new),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [handleIncoming]);

  if (!pop) return null;

  const close = () => setPop(null);

  return (
    <div className="fixed top-20 right-6 z-[60] w-[380px] rounded-lg border bg-card shadow-2xl animate-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-primary/5 rounded-t-lg">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Phone className="h-4 w-4 text-primary animate-pulse" />
          Incoming Call
        </div>
        <button onClick={close} aria-label="Close" className="p-1 rounded hover:bg-muted">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
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
              <Button
                size="sm"
                className="flex-1"
                onClick={() => { navigate(`/admin/customers/list?edit=${pop.customer!.id}`); close(); }}
              >
                Profile
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="flex-1"
                onClick={() => { navigate(`/admin/appointments/list`); close(); }}
              >
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
              <Button
                size="sm"
                className="flex-1"
                onClick={() => { navigate(`/admin/employees`); close(); }}
              >
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
              <Button
                size="sm"
                className="flex-1"
                onClick={() => { navigate(`/admin/customers/add?phone=${encodeURIComponent(pop.phone)}`); close(); }}
              >
                Create Profile
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
