import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAdminLog } from "@/hooks/useAdminLog";
import { ArrowLeft, Phone, PhoneOutgoing, PhoneIncoming } from "lucide-react";

type CallReason = 
  | "looking_for_person"
  | "login_issues"
  | "account_status"
  | "update_profile"
  | "book_appointment"
  | "cancel_appointment"
  | "service_fees_inquiry"
  | "past_records"
  | "insurance_claims"
  | "warranty_status"
  | "telemarketer"
  | "robo_dialer"
  | "other";

const callReasons: { value: CallReason; label: string }[] = [
  { value: "looking_for_person", label: "Looking For a Person" },
  { value: "login_issues", label: "Log in Issues" },
  { value: "account_status", label: "Account Status" },
  { value: "update_profile", label: "Update Profile" },
  { value: "book_appointment", label: "Book New Appointment" },
  { value: "cancel_appointment", label: "Cancel Existing Appointment" },
  { value: "service_fees_inquiry", label: "Enquire on Service Fees" },
  { value: "past_records", label: "Need Past Records" },
  { value: "insurance_claims", label: "Insurance Claims Assistance" },
  { value: "warranty_status", label: "Check Warranty Status" },
  { value: "telemarketer", label: "Telemarketer" },
  { value: "robo_dialer", label: "Robo Dialer" },
  { value: "other", label: "Other" },
];

interface FormData {
  call_direction: "incoming" | "outgoing";
  phone_number: string;
  customer_name: string;
  customer_id: string;
  call_reason: CallReason;
  notes: string;
}

const initialFormData: FormData = {
  call_direction: "incoming",
  phone_number: "",
  customer_name: "",
  customer_id: "",
  call_reason: "other",
  notes: "",
};

const CallLogAdd = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logAction } = useAdminLog();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: customers } = useQuery({
    queryKey: ["customers-for-call-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_registrations")
        .select("id, ship_to_first_name, ship_to_last_name, phone, account_number")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (field === "customer_id" && value && value !== "none") {
      const customer = customers?.find((c) => c.id === value);
      if (customer) {
        setFormData((prev) => ({
          ...prev,
          customer_id: value,
          customer_name: `${customer.ship_to_first_name} ${customer.ship_to_last_name}`,
          phone_number: customer.phone || prev.phone_number,
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.phone_number && !formData.customer_name) {
      toast({
        title: "Error",
        description: "Please enter a phone number or customer name",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const action = formData.call_direction === "incoming" ? "call_in" : "call_out";
      
      await logAction(
        action,
        "call",
        formData.customer_id || undefined,
        {
          phone_number: formData.phone_number,
          customer_name: formData.customer_name,
          call_reason: formData.call_reason,
          notes: formData.notes || null,
        }
      );

      toast({
        title: "Success",
        description: "Call logged successfully",
      });

      navigate("/admin/logs/list");
    } catch (error) {
      console.error("Error logging call:", error);
      toast({
        title: "Error",
        description: "Failed to log call",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate("/admin/logs/list")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Logs
        </Button>
        <h2 className="text-2xl font-bold">Log Phone Call</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label>Call Direction</Label>
              <RadioGroup
                value={formData.call_direction}
                onValueChange={(value) => handleChange("call_direction", value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="incoming" id="incoming" />
                  <Label htmlFor="incoming" className="flex items-center gap-2 cursor-pointer">
                    <PhoneIncoming className="h-4 w-4 text-green-600" />
                    Call In (Received)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="outgoing" id="outgoing" />
                  <Label htmlFor="outgoing" className="flex items-center gap-2 cursor-pointer">
                    <PhoneOutgoing className="h-4 w-4 text-blue-600" />
                    Called (Made)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_id">Link to Customer (Optional)</Label>
              <Select
                value={formData.customer_id || "none"}
                onValueChange={(value) => handleChange("customer_id", value === "none" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Customer</SelectItem>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.account_number} - {customer.ship_to_first_name} {customer.ship_to_last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  placeholder="630-555-1212"
                  value={formData.phone_number}
                  onChange={(e) => handleChange("phone_number", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_name">Caller/Contact Name</Label>
                <Input
                  id="customer_name"
                  placeholder="John Doe"
                  value={formData.customer_name}
                  onChange={(e) => handleChange("customer_name", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="call_reason">Reason for Call</Label>
              <Select
                value={formData.call_reason}
                onValueChange={(value) => handleChange("call_reason", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {callReasons.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about the call..."
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Logging..." : "Log Call"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/admin/logs/list")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CallLogAdd;
