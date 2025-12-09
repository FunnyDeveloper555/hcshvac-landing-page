import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type AppointmentType = "residential" | "commercial" | "non_profit" | "church" | "school" | "government" | "other";

interface FormData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  appointment_type: AppointmentType;
  scheduled_date: string;
  scheduled_time: string;
  notes: string;
  company_id: string;
}

const initialFormData: FormData = {
  customer_name: "",
  customer_email: "",
  customer_phone: "",
  customer_address: "",
  appointment_type: "residential",
  scheduled_date: "",
  scheduled_time: "",
  notes: "",
  company_id: "",
};

const appointmentTypes: { value: AppointmentType; label: string }[] = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "non_profit", label: "Non-Profit" },
  { value: "church", label: "Church" },
  { value: "school", label: "School" },
  { value: "government", label: "Government Facility" },
  { value: "other", label: "Other" },
];

const timeSlots = [
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM",
  "5:00 PM", "5:30 PM", "6:00 PM"
];

export default function AppointmentsAdd() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const queryClient = useQueryClient();

  const { data: companies, isLoading: companiesLoading } = useQuery({
    queryKey: ["companies-active"],
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

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const insertData = {
        customer_name: data.customer_name,
        customer_email: data.customer_email || null,
        customer_phone: data.customer_phone,
        customer_address: data.customer_address || null,
        appointment_type: data.appointment_type,
        scheduled_date: data.scheduled_date,
        scheduled_time: data.scheduled_time,
        notes: data.notes || null,
        company_id: data.company_id || null,
      };
      const { error } = await supabase.from("appointments").insert(insertData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment created successfully");
      setFormData(initialFormData);
    },
    onError: (error) => {
      toast.error("Failed to create appointment: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_name || !formData.customer_phone || !formData.scheduled_date || !formData.scheduled_time) {
      toast.error("Please fill in all required fields");
      return;
    }
    createMutation.mutate(formData);
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Book New Appointment</h2>

      <Card>
        <CardHeader>
          <CardTitle>Appointment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Appointment Type */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="appointment_type">Appointment Type *</Label>
                <Select
                  value={formData.appointment_type}
                  onValueChange={(v) => handleChange("appointment_type", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {appointmentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_id">Assign to Company</Label>
                <Select
                  value={formData.company_id}
                  onValueChange={(v) => handleChange("company_id", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select company (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies?.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Customer Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Customer Information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer_name">Customer Name *</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) => handleChange("customer_name", e.target.value)}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_phone">Phone Number *</Label>
                  <Input
                    id="customer_phone"
                    value={formData.customer_phone}
                    onChange={(e) => handleChange("customer_phone", e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_email">Email</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => handleChange("customer_email", e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_address">Address</Label>
                  <Input
                    id="customer_address"
                    value={formData.customer_address}
                    onChange={(e) => handleChange("customer_address", e.target.value)}
                    placeholder="123 Main St, City, State"
                  />
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Schedule</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="scheduled_date">Date *</Label>
                  <Input
                    id="scheduled_date"
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => handleChange("scheduled_date", e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduled_time">Time *</Label>
                  <Select
                    value={formData.scheduled_time}
                    onValueChange={(v) => handleChange("scheduled_time", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Additional notes or special instructions..."
                rows={4}
              />
            </div>

            <Button type="submit" disabled={createMutation.isPending} className="w-full sm:w-auto">
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Appointment
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
