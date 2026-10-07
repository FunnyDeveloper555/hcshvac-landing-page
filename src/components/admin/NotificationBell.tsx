import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bell, MessageSquare, ClipboardCheck, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useState } from "react";

interface Submission {
  id: string;
  invitation_type: string;
  recipient_phone: string | null;
  recipient_email: string | null;
  completed_at: string | null;
  companies?: { name: string } | null;
}

interface InboundText {
  id: string;
  item_type: string;
  item_id: string;
  message: string | null;
  phone: string | null;
  created_at: string;
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["admin-notifications"],
    refetchInterval: 5000,
    queryFn: async () => {
      const [subs, texts] = await Promise.all([
        supabase
          .from("booking_invitations")
          .select("id, invitation_type, recipient_phone, recipient_email, completed_at, companies:company_id (name)")
          .eq("status", "completed")
          .is("seen_at", null)
          .order("completed_at", { ascending: false })
          .limit(10),
        supabase
          .from("work_item_replies")
          .select("id, item_type, item_id, message, phone, created_at")
          .eq("direction", "inbound")
          .is("read_at", null)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      return {
        submissions: (subs.data || []) as unknown as Submission[],
        texts: (texts.data || []) as unknown as InboundText[],
      };
    },
  });

  const submissions = data?.submissions || [];
  const texts = data?.texts || [];
  const count = submissions.length + texts.length;

  const markAllRead = async () => {
    if (submissions.length) {
      await supabase
        .from("booking_invitations")
        .update({ seen_at: new Date().toISOString() } as any)
        .in("id", submissions.map((s) => s.id));
    }
    if (texts.length) {
      await supabase
        .from("work_item_replies")
        .update({ read_at: new Date().toISOString() } as any)
        .in("id", texts.map((t) => t.id));
    }
    queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    queryClient.invalidateQueries({ queryKey: ["sidebar-unread-replies"] });
  };

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-semibold">Notifications</span>
          {count > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}>
              <CheckCheck className="h-3 w-3 mr-1" /> Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {count === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">You're all caught up.</p>
          ) : (
            <>
              {submissions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => go("/admin/screenpops/sms")}
                  className="flex w-full items-start gap-2 border-b px-3 py-2 text-left hover:bg-accent"
                >
                  <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">
                      New {s.invitation_type === "registration" ? "registration" : "booking"} submission
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {s.recipient_email || s.recipient_phone || "Customer"}
                      {s.companies?.name ? ` — ${s.companies.name}` : ""}
                    </span>
                    {s.completed_at && (
                      <span className="block text-xs text-muted-foreground">
                        {format(new Date(s.completed_at), "MMM d, h:mm a")}
                      </span>
                    )}
                  </span>
                </button>
              ))}
              {texts.map((t) => (
                <button
                  key={t.id}
                  onClick={() => go(`/admin/${t.item_type}s/add?id=${t.item_id}`)}
                  className="flex w-full items-start gap-2 border-b px-3 py-2 text-left hover:bg-accent"
                >
                  <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">
                      New reply on {t.item_type} {t.phone ? `from ${t.phone}` : ""}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{t.message || "(photo)"}</span>
                    <span className="block text-xs text-muted-foreground">
                      {format(new Date(t.created_at), "MMM d, h:mm a")}
                    </span>
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
