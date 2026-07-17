import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdminLog } from "@/hooks/useAdminLog";
import { Send, MessageSquare, Mail, Loader2 } from "lucide-react";

interface FormData {
  companyId: string;
  invitationType: "residential" | "commercial";
  customerType: "new" | "existing";
  recipientPhone: string;
  recipientEmail: string;
  sendMethod: "sms" | "email" | "both";
  notes: string;
}

const initialFormData: FormData = {
  companyId: "",
  invitationType: "residential",
  customerType: "new",
  recipientPhone: "",
  recipientEmail: "",
  sendMethod: "sms",
  notes: "",
};

export default function SMSLinkSend() {
  const [searchParams] = useSearchParams();
  const prefillPhone = searchParams.get("phone") || "";
  const prefillEmail = searchParams.get("email") || "";
  const prefillType = searchParams.get("type");
  const prefillCustomerType = searchParams.get("customerType");
  const isLocked = searchParams.get("lock") === "1";
  const isCustomerSource = searchParams.get("source") === "customer";

  const [formData, setFormData] = useState<FormData>({
    ...initialFormData,
    recipientPhone: prefillPhone,
    recipientEmail: prefillEmail,
    invitationType: prefillType === "commercial" ? "commercial" : "residential",
    customerType: prefillCustomerType === "existing" ? "existing" : "new",
    sendMethod: prefillEmail && prefillPhone ? "both" : prefillEmail ? "email" : "sms",
  });
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { logAction } = useAdminLog();

  // Fetch active companies
  const { data: companies = [] } = useQuery({
    queryKey: ["active-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const createAndSendInvitation = useMutation({
    mutationFn: async () => {
      // Validate required fields
      if (!formData.companyId) throw new Error("Please select a company");
      if (formData.sendMethod === "sms" && !formData.recipientPhone) {
        throw new Error("Phone number is required for SMS");
      }
      if (formData.sendMethod === "email" && !formData.recipientEmail) {
        throw new Error("Email is required for email delivery");
      }
      if (formData.sendMethod === "both" && (!formData.recipientPhone || !formData.recipientEmail)) {
        throw new Error("Both phone and email are required");
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Create the invitation record
      const { data: invitation, error: inviteError } = await supabase
        .from("booking_invitations")
        .insert({
          company_id: formData.companyId,
          invitation_type: formData.invitationType,
          customer_type: formData.customerType,
          recipient_phone: formData.recipientPhone || null,
          recipient_email: formData.recipientEmail || null,
          notes: formData.notes || null,
          created_by: user?.id,
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      // Get company name for SMS
      const company = companies.find(c => c.id === formData.companyId);
      const companyName = company?.name || "Our Company";

      // Build booking URL
      const baseUrl = window.location.origin;
      const bookingUrl = `${baseUrl}/book/${invitation.token}`;

      // Send SMS if needed
      if (formData.sendMethod === "sms" || formData.sendMethod === "both") {
        const { data: smsResult, error: smsError } = await supabase.functions.invoke("send-sms-booking", {
          body: {
            invitationId: invitation.id,
            phoneNumber: formData.recipientPhone,
            companyName,
            bookingUrl,
          },
        });

        if (smsError) {
          console.error("SMS Error:", smsError);
          throw new Error("Failed to send SMS: " + smsError.message);
        }

        if (smsResult?.error) {
          throw new Error("SMS Error: " + smsResult.error);
        }
      }

      // Send Email if needed
      if (formData.sendMethod === "email" || formData.sendMethod === "both") {
        const { data: emailResult, error: emailError } = await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "booking-invite",
            recipientEmail: formData.recipientEmail,
            idempotencyKey: `booking-invite-${invitation.id}`,
            templateData: {
              customerName: "",
              companyName,
              bookingUrl,
              notes: formData.notes || undefined,
            },
            companyId: formData.companyId,
          },
        });

        if (emailError) {
          console.error("Email Error:", emailError);
          throw new Error("Failed to send email: " + emailError.message);
        }
        if (emailResult?.error) {
          throw new Error("Email Error: " + emailResult.error);
        }

        // Mark invitation as sent if only email was used
        if (formData.sendMethod === "email") {
          await supabase
            .from("booking_invitations")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", invitation.id);
        }
      }

      return invitation;
    },
    onSuccess: (invitation) => {
      toast({
        title: "Booking link sent",
        description: "The customer has been sent a link to complete their booking.",
      });
      logAction("send_booking_link", "booking_invitation", invitation.id, {
        invitation_type: formData.invitationType,
        customer_type: formData.customerType,
        send_method: formData.sendMethod,
      });
      navigate("/admin/sms-link/list");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      await createAndSendInvitation.mutateAsync();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Send Registration / Booking Link
          </CardTitle>
          <CardDescription>
            Send a link to a new or existing customer so they can register their profile and (optionally) book an appointment. Submissions appear in the Customers List.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Selection */}
            <div className="space-y-2">
              <Label htmlFor="company">Pick Company *</Label>
              <Select
                value={formData.companyId}
                onValueChange={(value) => handleChange("companyId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Customer Type */}
            <div className="space-y-2">
              <Label>Customer Type</Label>
              <RadioGroup
                value={formData.customerType}
                onValueChange={(value) => handleChange("customerType", value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="new" id="new" />
                  <Label htmlFor="new">New Customer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="existing" id="existing" />
                  <Label htmlFor="existing">Existing Customer</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Invitation Type */}
            <div className="space-y-2">
              <Label>Booking Type</Label>
              <RadioGroup
                value={formData.invitationType}
                onValueChange={(value) => handleChange("invitationType", value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="residential" id="residential" />
                  <Label htmlFor="residential">Residential</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="commercial" id="commercial" />
                  <Label htmlFor="commercial">Commercial</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Send Method */}
            <div className="space-y-2">
              <Label>Send Method</Label>
              <RadioGroup
                value={formData.sendMethod}
                onValueChange={(value) => handleChange("sendMethod", value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sms" id="sms" />
                  <Label htmlFor="sms" className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" /> SMS/Text
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="email" />
                  <Label htmlFor="email" className="flex items-center gap-1">
                    <Mail className="h-4 w-4" /> Email
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="both" />
                  <Label htmlFor="both">Both</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Phone Number */}
            {(formData.sendMethod === "sms" || formData.sendMethod === "both") && (
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.recipientPhone}
                  onChange={(e) => handleChange("recipientPhone", e.target.value)}
                  readOnly={isLocked && !!prefillPhone}
                  className={isLocked && prefillPhone ? "bg-muted cursor-not-allowed" : ""}
                />
                <p className="text-xs text-muted-foreground">
                  Must be a textable phone number
                </p>
              </div>
            )}

            {/* Email Address */}
            {(formData.sendMethod === "email" || formData.sendMethod === "both") && (
              <div className="space-y-2">
                <Label htmlFor="email-input">Email Address *</Label>
                <Input
                  id="email-input"
                  type="email"
                  placeholder="customer@example.com"
                  value={formData.recipientEmail}
                  onChange={(e) => handleChange("recipientEmail", e.target.value)}
                  readOnly={isLocked && !!prefillEmail}
                  className={isLocked && prefillEmail ? "bg-muted cursor-not-allowed" : ""}
                />
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Initial Visit Notes or Memos (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any notes for this booking..."
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button type="submit" disabled={isSending} className="flex items-center gap-2">
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isSending ? "Sending..." : "Send Booking Link"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/sms-link/list")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
