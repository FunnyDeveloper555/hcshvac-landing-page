import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";

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
  if (!appointment) return null;

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
                <div>{appointment.scheduled_date ? format(parseISO(appointment.scheduled_date), "MMM d, yyyy") : "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Scheduled time</div>
                <div>{appointment.scheduled_time || "—"}</div>
              </div>
              <div className="col-span-2">
                <div className="text-muted-foreground">Notes from customer</div>
                <div className="whitespace-pre-wrap">{appointment.notes || "—"}</div>
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
