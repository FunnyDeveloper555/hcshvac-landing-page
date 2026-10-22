import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Pencil } from "lucide-react";
import { timeSlots, timeSlotsWith } from "@/lib/timeSlots";
import { getCompanyInviterEmail } from "@/lib/companyEmail";
import { useAdminLog } from "@/hooks/useAdminLog";

interface Invitation {
  id: string;
  status: string;
  sent_at: string | null;
  opened_at: string | null;
  completed_at: string | null;
  created_at: string;
  recipient_phone: string | null;
  recipient_email: string | null;
  invitation_type?: string;
  customer_type?: string;
  notes?: string | null;
}

interface Appointment {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  customer_address: string | null;
  appointment_type: string;
  status: string;
  scheduled_date: string;
  scheduled_time: string;
  notes: string | null;
  created_at: string;
  visit_summary_notes?: string | null;
  closure_photos?: string[] | null;
  cancellation_reason?: string | null;
  companies?: { name: string } | null;
}

function ClosurePhotos({ paths }: { paths: string[] }) {
  const { data: urls = [] } = useQuery({
    queryKey: ["closure-photos", paths],
    queryFn: async () => {
      const out: { path: string; url: string }[] = [];
      for (const path of paths) {
        const { data } = await supabase.storage.from("appointment-files").createSignedUrl(path, 3600);
        if (data?.signedUrl) out.push({ path, url: data.signedUrl });
      }
      return out;
    },
    enabled: paths.length > 0,
    staleTime: 300000,
  });
  if (paths.length === 0) return null;
  return (
    <div className="col-span-2">
      <div className="text-muted-foreground">Photos / videos</div>
      <div className="flex flex-wrap gap-2 pt-1">
        {urls.map((u) => (
          <a key={u.path} href={u.url} target="_blank" rel="noreferrer" className="text-primary underline text-xs break-all">
            {u.path.split("/").pop()}
          </a>
        ))}
        {urls.length === 0 && <span className="text-xs text-muted-foreground">{paths.length} file(s)</span>}
      </div>
    </div>
  );
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  invitation: Invitation | null;
}

const fmt = (d: string | null | undefined) =>
  d ? format(parseISO(d), "MMM d, yyyy h:mm a") : "—";

const statusBadge = (status?: string) => {
  switch (status) {
    case "completed":
      return <Badge className="bg-green-600">Submitted</Badge>;
    case "opened":
      return <Badge className="bg-blue-500">Opened</Badge>;
    case "sent":
      return <Badge className="bg-amber-500">Sent</Badge>;
    case "pending":
      return <Badge variant="secondary">Pending</Badge>;
    default:
      return <Badge variant="outline">{status || "Not sent"}</Badge>;
  }
};

export default function SubmissionDetailsDialog({ open, onOpenChange, appointment, invitation }: Props) {
  const queryClient = useQueryClient();
  const { logAction } = useAdminLog();
  const [editing, setEditing] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [saving, setSaving] = useState<"save" | "notify" | null>(null);

  if (!appointment) return null;

  const startEdit = () => {
    setEditDate(appointment.scheduled_date || "");
    setEditTime(appointment.scheduled_time || "");
    setEditing(true);
  };

  const saveSchedule = async (notifyClient: boolean) => {
    if (!editDate || !editTime) {
      toast.error("Pick both a date and a time.");
      return;
    }
    setSaving(notifyClient ? "notify" : "save");
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ scheduled_date: editDate, scheduled_time: editTime })
        .eq("id", appointment.id);
      if (error) throw error;

      if (notifyClient) {
        const companyName = appointment.companies?.name || "Our team";
        const dateStr = format(parseISO(editDate), "EEE, MMM d, yyyy");
        const results: string[] = [];
        if (appointment.customer_phone) {
          const { error: smsErr } = await supabase.functions.invoke("send-sms", {
            body: {
              phoneNumber: appointment.customer_phone,
              message: `${companyName}: Your appointment has been updated to ${dateStr} at ${editTime}. Reply to reschedule.`,
            },
          });
          if (!smsErr) results.push("SMS");
        }
        if (appointment.customer_email) {
          const { error: emailErr } = await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "appointment-confirmation",
              recipientEmail: appointment.customer_email,
              idempotencyKey: `appt-modify-${appointment.id}-${Date.now()}`,
              fromEmail: getCompanyInviterEmail(companyName),
              fromName: companyName,
              templateData: {
                customerName: appointment.customer_name,
                companyName,
                scheduledDate: dateStr,
                scheduledTime: editTime,
                address: appointment.customer_address || undefined,
                notes: appointment.notes || undefined,
              },
            },
          });
          if (!emailErr) results.push("email");
        }
        toast.success(results.length ? `Appointment updated — client notified by ${results.join(" and ")}` : "Appointment updated (client has no phone/email on file)");
      } else {
        toast.success("Appointment date/time saved");
      }

      logAction("update", "appointment", appointment.id, {
        customer_name: appointment.customer_name,
        new_date: editDate,
        new_time: editTime,
        client_notified: notifyClient,
      });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["crm-pending-submissions"] });
      setEditing(false);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to update the appointment");
    } finally {
      setSaving(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submission Details</DialogTitle>
          <DialogDescription>
            What the customer submitted via the booking link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invitation status */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Invitation
            </h3>
            {invitation ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Status</div>
                  <div>{statusBadge(invitation.status)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Sent to</div>
                  <div>{invitation.recipient_phone || invitation.recipient_email || "—"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Sent at</div>
                  <div>{fmt(invitation.sent_at)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Opened at</div>
                  <div>{fmt(invitation.opened_at)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Submitted at</div>
                  <div>{fmt(invitation.completed_at)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Created at</div>
                  <div>{fmt(invitation.created_at)}</div>
                </div>
                {invitation.notes && (
                  <div className="col-span-2">
                    <div className="text-muted-foreground">Invitation notes</div>
                    <div className="whitespace-pre-wrap">{invitation.notes}</div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No invitation has been sent for this appointment.</p>
            )}
          </section>

          {/* Customer info */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Customer
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground">Name</div>
                <div>{appointment.customer_name || "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Phone</div>
                <div>{appointment.customer_phone || "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Email</div>
                <div>{appointment.customer_email || "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Type</div>
                <div className="capitalize">{appointment.appointment_type?.replace(/_/g, " ")}</div>
              </div>
              <div className="col-span-2">
                <div className="text-muted-foreground">Address</div>
                <div>{appointment.customer_address || "—"}</div>
              </div>
            </div>
          </section>

          {/* Appointment details */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Appointment
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground">Scheduled date</div>
                {editing ? (
                  <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="mt-1" />
                ) : (
                  <div>{appointment.scheduled_date ? format(parseISO(appointment.scheduled_date), "MMM d, yyyy") : "—"}</div>
                )}
              </div>
              <div>
                <div className="text-muted-foreground">Scheduled time</div>
                {editing ? (
                  <Select value={editTime || undefined} onValueChange={setEditTime}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlotsWith(editTime).map((t) => (
                        <SelectItem key={t} value={t}>
                          {timeSlots.includes(t) ? t : `${t} (customer requested)`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div>{appointment.scheduled_time || "—"}</div>
                )}
              </div>
              <div className="col-span-2">
                {editing ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" variant="outline" disabled={!!saving} onClick={() => saveSchedule(false)}>
                      {saving === "save" && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                      Save
                    </Button>
                    <Button size="sm" disabled={!!saving} onClick={() => saveSchedule(true)}>
                      {saving === "notify" && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                      Update client
                    </Button>
                    <Button size="sm" variant="ghost" disabled={!!saving} onClick={() => setEditing(false)}>
                      Back
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={startEdit}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Modify
                  </Button>
                )}
              </div>
              <div className="col-span-2">
                <div className="text-muted-foreground">Notes from customer</div>
                <div className="whitespace-pre-wrap">{appointment.notes || "—"}</div>
              </div>
            </div>
          </section>

          {/* Close-out / cancellation */}
          {(appointment.visit_summary_notes || appointment.cancellation_reason || (appointment.closure_photos?.length ?? 0) > 0) && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Close-out
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {appointment.visit_summary_notes && (
                  <div className="col-span-2">
                    <div className="text-muted-foreground">Visit summary notes</div>
                    <div className="whitespace-pre-wrap">{appointment.visit_summary_notes}</div>
                  </div>
                )}
                {appointment.cancellation_reason && (
                  <div className="col-span-2">
                    <div className="text-muted-foreground">Cancellation reason</div>
                    <div className="whitespace-pre-wrap">{appointment.cancellation_reason}</div>
                  </div>
                )}
                <ClosurePhotos paths={appointment.closure_photos || []} />
              </div>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
