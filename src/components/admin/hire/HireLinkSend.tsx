import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Send, UserPlus, Mail, MessageSquare, Loader2 } from "lucide-react";

interface FormData {
  companyId: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  sendMethod: "sms" | "email" | "both";
  notes: string;
}

const initialFormData: FormData = {
  companyId: "",
  recipientName: "",
  recipientPhone: "",
  recipientEmail: "",
  sendMethod: "sms",
  notes: "",
};

const formatPhone = (input: string): string => {
  const digits = input.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
};

export default function HireLinkSend() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { logAction } = useAdminLog();

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
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const sendInvitation = useMutation({
    mutationFn: async () => {
      if (!formData.companyId) throw new Error("Please select a company");
      if ((formData.sendMethod === "sms" || formData.sendMethod === "both") && !formData.recipientPhone) {
        throw new Error("Phone number is required for SMS");
      }
      if ((formData.sendMethod === "email" || formData.sendMethod === "both") && !formData.recipientEmail) {
        throw new Error("Email is required for email delivery");
      }

      const { data: { user } } = await supabase.auth.getUser();

      const { data: invitation, error: inviteError } = await supabase
        .from("hire_invitations")
        .insert({
          company_id: formData.companyId,
          recipient_name: formData.recipientName || null,
          recipient_phone: formData.recipientPhone || null,
          recipient_email: formData.recipientEmail || null,
          send_method: formData.sendMethod,
          notes: formData.notes || null,
          created_by: user?.id,
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      const company = companies.find((c) => c.id === formData.companyId);
      const companyName = company?.name || "Our Company";
      const applicationUrl = `${window.location.origin}/apply/${invitation.token}`;

      if (formData.sendMethod === "sms" || formData.sendMethod === "both") {
        const { data: smsResult, error: smsError } = await supabase.functions.invoke("send-sms-hire", {
          body: {
            invitationId: invitation.id,
            phoneNumber: formData.recipientPhone,
            companyName,
            applicationUrl,
          },
        });
        if (smsError) throw new Error("Failed to send SMS: " + smsError.message);
        if (smsResult?.error) throw new Error("SMS Error: " + smsResult.error);
      }

      // Email delivery can be wired into existing send-test-email later if needed.

      return invitation;
    },
    onSuccess: (invitation) => {
      toast({
        title: "Application link sent",
        description: "The candidate has been sent a link to complete their application.",
      });
      logAction("send_hire_link", "hire_invitation", invitation.id, {
        send_method: formData.sendMethod,
      });
      navigate("/admin/new-hire/list");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      await sendInvitation.mutateAsync();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Send New Hire Application Link
          </CardTitle>
          <CardDescription>
            Send a candidate a secure link to complete their New Hire online application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="company">Pick Company *</Label>
              <Select value={formData.companyId} onValueChange={(v) => handleChange("companyId", v)}>
                <SelectTrigger><SelectValue placeholder="Select a company" /></SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Candidate Name (optional)</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={formData.recipientName}
                onChange={(e) => handleChange("recipientName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Send Method</Label>
              <RadioGroup
                value={formData.sendMethod}
                onValueChange={(v) => handleChange("sendMethod", v)}
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

            {(formData.sendMethod === "sms" || formData.sendMethod === "both") && (
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="555-123-4567"
                  value={formData.recipientPhone}
                  onChange={(e) => handleChange("recipientPhone", formatPhone(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">Must be a textable phone number</p>
              </div>
            )}

            {(formData.sendMethod === "email" || formData.sendMethod === "both") && (
              <div className="space-y-2">
                <Label htmlFor="email-input">Email Address *</Label>
                <Input
                  id="email-input"
                  type="email"
                  placeholder="candidate@example.com"
                  value={formData.recipientEmail}
                  onChange={(e) => handleChange("recipientEmail", e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Position, source, or other notes..."
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isSending}>
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {isSending ? "Sending..." : "Send Application Link"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/admin")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
