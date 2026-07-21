import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Mail, X, Pin, CheckCircle, Eye, Send } from "lucide-react";

type Invitation = {
  id: string;
  company_id: string | null;
  invitation_type: string;
  customer_type: string;
  recipient_phone: string | null;
  recipient_email: string | null;
  token: string;
  status: string;
  sent_at: string | null;
  opened_at: string | null;
  completed_at: string | null;
  created_at: string;
  notes: string | null;
  companies?: { name: string } | null;
};

function fmtDateTime(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString(undefined, {
      month: "short", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  } catch { return d; }
}

const statusIcon = (s: string) => {
  if (s === "completed") return <CheckCircle className="h-4 w-4 text-primary animate-pulse" />;
  if (s === "opened") return <Eye className="h-4 w-4 text-primary animate-pulse" />;
  return <Send className="h-4 w-4 text-primary animate-pulse" />;
};

const statusLabel = (s: string) => {
  if (s === "completed") return "Customer Completed Form";
  if (s === "opened") return "Customer Opened Invitation";
  if (s === "sent") return "Invitation Sent";
  return "Invitation Update";
};

export default function SMSScreenPop() {
  const [pop, setPop] = useState<Invitation | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const navigate = useNavigate();

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

  const SEEN_KEY = "smspop_seen_v1";
  const loadSeen = (): Set<string> => {
    try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]")); } catch { return new Set(); }
  };
  const persistSeen = (s: Set<string>) => {
    try { localStorage.setItem(SEEN_KEY, JSON.stringify([...s].slice(-500))); } catch {}
  };
  const shownKeys = useRef<Set<string>>(loadSeen());

  const showPop = useCallback(async (row: any, key: string) => {
    if (!row || !row.id) return;
    if (shownKeys.current.has(key)) return;
    shownKeys.current.add(key);
    persistSeen(shownKeys.current);

    let full: Invitation = row;
    if (!row.companies && row.company_id) {
      const { data } = await supabase
        .from("booking_invitations")
        .select("*, companies:company_id (name)")
        .eq("id", row.id)
        .maybeSingle();
      if (data) full = data as any;
    }
    setPop(full);

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 660; g.gain.value = 0.05;
      o.start(); o.stop(ctx.currentTime + 0.18);
    } catch {}
  }, []);

  // Manual trigger from the list
  useEffect(() => {
    const onManual = (e: Event) => {
      const row = (e as CustomEvent).detail;
      if (!row) return;
      const key = `manual:${row.id}:${row.status}`;
      shownKeys.current.delete(key);
      showPop(row, key);
    };
    window.addEventListener("smspop:show", onManual as EventListener);
    return () => window.removeEventListener("smspop:show", onManual as EventListener);
  }, [showPop]);

  // Auto toggle
  const [autoEnabled, setAutoEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem("smspop_auto_enabled") === "1"; } catch { return false; }
  });
  useEffect(() => {
    const onToggle = (e: Event) => {
      setAutoEnabled(!!(e as CustomEvent).detail?.enabled);
    };
    window.addEventListener("smspop:auto-toggle", onToggle as EventListener);
    return () => window.removeEventListener("smspop:auto-toggle", onToggle as EventListener);
  }, []);

  useEffect(() => {
    if (!autoEnabled) return;
    let cancelled = false;

    const channel = supabase
      .channel("smspop-invitations")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "booking_invitations" },
        (payload) => {
          if (cancelled) return;
          const nw: any = payload.new;
          const old: any = payload.old || {};
          // Only pop on meaningful transitions to opened or completed
          if (nw.status !== old.status && (nw.status === "opened" || nw.status === "completed")) {
            showPop(nw, `${nw.id}:${nw.status}`);
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [autoEnabled, showPop]);

  if (!pop) return null;
  const close = () => setPop(null);

  return (
    <div
      className="fixed z-[60] w-[420px] max-h-[85vh] overflow-y-auto rounded-lg border bg-card text-card-foreground shadow-2xl animate-in slide-in-from-right-4 duration-200"
      style={pos ? { top: pos.y, left: pos.x, right: "auto" } : { top: 80, right: 24 }}
    >
      <div onMouseDown={onDragStart} className="flex items-center justify-between px-4 py-2 border-b bg-primary/5 cursor-move select-none">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {statusIcon(pop.status)}
          {statusLabel(pop.status)}
        </div>
        <div className="flex items-center gap-2">
          <Pin className="h-4 w-4 text-muted-foreground" />
          <button onClick={close} aria-label="Close" className="p-1 rounded hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-4 py-1.5 border-b bg-muted/30 text-[11px] text-muted-foreground flex items-center justify-between">
        <span>Last update</span>
        <span className="font-mono text-foreground">
          {fmtDateTime(pop.completed_at || pop.opened_at || pop.sent_at || pop.created_at)}
        </span>
      </div>

      <div className="p-4 space-y-3 text-sm">
        <div className="grid grid-cols-[110px_1fr] gap-x-2 gap-y-1">
          <span className="text-muted-foreground">Company:</span>
          <span className="font-medium">{pop.companies?.name || "—"}</span>

          <span className="text-muted-foreground">Type:</span>
          <span>
            <Badge variant="outline" className="capitalize">{pop.invitation_type}</Badge>
            <span className="ml-1 text-xs text-muted-foreground capitalize">({pop.customer_type})</span>
          </span>

          <span className="text-muted-foreground">Status:</span>
          <span className="font-medium capitalize">{pop.status}</span>
        </div>

        <div className="border-t pt-2 space-y-1">
          {pop.recipient_phone && (
            <div className="flex items-center gap-1 text-xs"><MessageSquare className="h-3 w-3" />{pop.recipient_phone}</div>
          )}
          {pop.recipient_email && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{pop.recipient_email}</div>
          )}
        </div>

        <div className="border-t pt-2 grid grid-cols-3 gap-2 text-[11px]">
          <div>
            <div className="text-muted-foreground">Sent</div>
            <div>{pop.sent_at ? fmtDateTime(pop.sent_at) : "-"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Opened</div>
            <div>{pop.opened_at ? fmtDateTime(pop.opened_at) : "-"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Completed</div>
            <div>{pop.completed_at ? fmtDateTime(pop.completed_at) : "-"}</div>
          </div>
        </div>

        {pop.notes && (
          <div className="border-t pt-2 text-xs italic text-muted-foreground">{pop.notes}</div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" onClick={() => { window.open(`/book/${pop.token}`, "_blank"); }}>
            Open Form
          </Button>
          {pop.status === "completed" && (
            <Button size="sm" variant="secondary" onClick={() => { navigate("/admin/appointments/list"); close(); }}>
              View Appointments
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => { navigate("/admin/screen-pops/sms"); close(); }}>
            View List
          </Button>
          <Button size="sm" variant="destructive" className="ml-auto" onClick={close}>Close</Button>
        </div>
      </div>
    </div>
  );
}
