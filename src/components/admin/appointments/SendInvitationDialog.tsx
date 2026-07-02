import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send, MessageSquare, Mail, Loader2 } from "lucide-react";
import { getCompanyInviterEmail } from "@/lib/companyEmail";

import { useAdminLog } from "@/hooks/useAdminLog";

interface AppointmentLite {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  appointment_type: string;
  company_id: string | null;
  companies?: { name: string } | null;
}

interface Props {
  appointment: AppointmentLite | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function SendInvitationDialog({ appointment, open, onOpenChange }: Props) {
  const { logAction } = useAdminLog();
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [sendMethod, setSendMethod] = useState<"sms" | "email" | "both">("sms");
  const [invitationType, setInvitationType] = useState<"residential" | "commercial">("residential");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (appointment) {
      setPhone(appointment.customer_phone || "");
      setEmail(appointment.customer_email || "");
      setInvitationType(appointment.appointment_type === "commercial" ? "commercial" : "residential");
      setSendMethod(appointment.customer_phone ? "sms" : appointment.customer_email ? "email" : "sms");
      setNotes("");
    }
  }, [appointment]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!appointment) throw new Error("No appointment");
      if (!appointment.company_id) throw new Error("Appointment has no company assigned");
      if ((sendMethod === "sms" || sendMethod === "both") && !phone) throw new Error("Phone number is required for SMS");
      if ((sendMethod === "email" || sendMethod === "both") && !email) throw new Error("Email is required for email delivery");

      const { data: { user } } = await supabase.auth.getUser();

      const { data: invitation, error: inviteError } = await supabase
        .from("booking_invitations")
        .insert({
          company_id: appointment.company_id,
          invitation_type: invitationType,
          customer_type: "existing",
          recipient_phone: phone || null,
          recipient_email: email || null,
          notes: notes || null,
          created_by: user?.id,
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      const companyName = appointment.companies?.name || "Our Company";
      const bookingUrl = `${window.location.origin}/book/${invitation.token}`;

      if (sendMethod === "sms" || sendMethod === "both") {
        const { data: smsResult, error: smsError } = await supabase.functions.invoke("send-sms-booking", {
          body: {
            invitationId: invitation.id,
            phoneNumber: phone,
            companyName,
            bookingUrl,
          },
        });
        if (smsError) throw new Error("Failed to send SMS: " + smsError.message);
        if (smsResult?.error) throw new Error("SMS Error: " + smsResult.error);
      }

      if (sendMethod === "email" || sendMethod === "both") {
        const { data: emailResult, error: emailError } = await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "booking-invite",
            recipientEmail: email,
            idempotencyKey: `booking-invite-${invitation.id}`,
            templateData: {
              customerName: appointment.customer_name,
              companyName,
              bookingUrl,
              notes: notes || undefined,
            },
          },
        });
        if (emailError) throw new Error("Failed to send email: " + emailError.message);
        if (emailResult?.error) throw new Error("Email Error: " + emailResult.error);

        // Mark invitation as sent if only email was used
        if (sendMethod === "email") {
          await supabase
            .from("booking_invitations")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", invitation.id);
        }
      }

      return invitation;
    },
    onSuccess: (invitation) => {
      toast.success("Booking invitation sent");
      logAction("send_booking_link", "booking_invitation", invitation.id, {
        from: "appointment_list",
        appointment_id: appointment?.id,
        send_method: sendMethod,
      });
      onOpenChange(false);
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-4 w-4" /> Send Booking Invitation
          </DialogTitle>
          <DialogDescription>
            Sending to <strong>{appointment.customer_name}</strong>
            {appointment.companies?.name ? ` • ${appointment.companies.name}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Booking Type</Label>
            <RadioGroup
              value={invitationType}
              onValueChange={(v) => setInvitationType(v as "residential" | "commercial")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="residential" id="inv-res" />
                <Label htmlFor="inv-res">Residential</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="commercial" id="inv-com" />
                <Label htmlFor="inv-com">Commercial</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Send Method</Label>
            <RadioGroup
              value={sendMethod}
              onValueChange={(v) => setSendMethod(v as "sms" | "email" | "both")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sms" id="m-sms" />
                <Label htmlFor="m-sms" className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" /> SMS
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="m-email" />
                <Label htmlFor="m-email" className="flex items-center gap-1">
                  <Mail className="h-4 w-4" /> Email
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="m-both" />
                <Label htmlFor="m-both">Both</Label>
              </div>
            </RadioGroup>
          </div>

          {(sendMethod === "sms" || sendMethod === "both") && (
            <div className="space-y-2">
              <Label htmlFor="inv-phone">Phone Number</Label>
              <Input id="inv-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          )}

          {(sendMethod === "email" || sendMethod === "both") && (
            <div className="space-y-2">
              <Label htmlFor="inv-email">Email Address</Label>
              <Input id="inv-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="inv-notes">Notes (optional)</Label>
            <Textarea id="inv-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sendMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending}>
            {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
