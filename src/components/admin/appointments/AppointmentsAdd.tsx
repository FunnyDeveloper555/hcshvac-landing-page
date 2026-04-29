import { useState, useEffect } from "react";
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
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAdminLog } from "@/hooks/useAdminLog";

type AppointmentType = "residential" | "commercial" | "non_profit" | "church" | "school" | "government" | "other";

interface FormData {
  first_name: string;
  last_name: string;
  customer_email: string;
  customer_phone: string;
  address_street: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  appointment_type: AppointmentType;
  visit_type: string;
  scheduled_date: string;
  scheduled_time: string;
  notes: string;
  company_id: string;
}

const initialFormData: FormData = {
  first_name: "",
  last_name: "",
  customer_email: "",
  customer_phone: "",
  address_street: "",
  address_city: "",
  address_state: "",
  address_zip: "",
  appointment_type: "residential",
  visit_type: "",
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

const visitTypes: string[] = [
  "Estimate New AC",
  "Estimate New Furnace",
  "Estimate New AC and Furnace",
];

const formatHour = (h: number): string => {
  const hour24 = ((h % 24) + 24) % 24;
  if (hour24 === 0) return "12 Midnight";
  if (hour24 === 12) return "12 Noon";
  const period = hour24 < 12 ? "AM" : "PM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12} ${period}`;
};

// 2-hour rolling windows starting every hour: 12 Midnight to 2 AM, 1 AM to 3 AM, ...
const timeSlots = Array.from({ length: 24 }, (_, i) => `${formatHour(i)} to ${formatHour(i + 2)}`);

// Auto-format phone to 111-111-1111
const formatPhone = (input: string): string => {
  const digits = input.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
};

// Split a full name into first/last (best-effort)
const splitName = (full: string): { first: string; last: string } => {
  const parts = (full || "").trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
};

// Split address "street, city, state zip" (best-effort)
const splitAddress = (addr: string): { street: string; city: string; state: string; zip: string } => {
  const result = { street: "", city: "", state: "", zip: "" };
  if (!addr) return result;
  const parts = addr.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 1) result.street = parts[0];
  if (parts.length >= 2) result.city = parts[1];
  if (parts.length >= 3) {
    const stateZip = parts[2].split(/\s+/);
    result.state = stateZip[0] || "";
    result.zip = stateZip.slice(1).join(" ") || "";
  }
  return result;
};

const joinAddress = (d: FormData): string => {
  const stateZip = [d.address_state, d.address_zip].filter(Boolean).join(" ");
  return [d.address_street, d.address_city, stateZip].filter(Boolean).join(", ");
};

export default function AppointmentsAdd() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const isEditing = !!editId;
  const { logAction } = useAdminLog();

  const { data: companies } = useQuery({
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

  useEffect(() => {
    if (editId) {
      fetchAppointment();
    }
  }, [editId]);

  const fetchAppointment = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", editId)
      .single();

    if (error) {
      toast.error("Failed to load appointment");
      navigate("/admin/appointments/list");
    } else if (data) {
      const { first, last } = splitName(data.customer_name);
      const addr = splitAddress(data.customer_address || "");
      setFormData({
        first_name: first,
        last_name: last,
        customer_email: data.customer_email || "",
        customer_phone: formatPhone(data.customer_phone || ""),
        address_street: addr.street,
        address_city: addr.city,
        address_state: addr.state,
        address_zip: addr.zip,
        appointment_type: data.appointment_type as AppointmentType,
        visit_type: (data as any).visit_type || "",
        scheduled_date: data.scheduled_date,
        scheduled_time: data.scheduled_time,
        notes: data.notes || "",
        company_id: data.company_id || "",
      });
    }
    setLoading(false);
  };

  const buildPayload = (data: FormData) => {
    const fullName = `${data.first_name.trim()} ${data.last_name.trim()}`.trim();
    const fullAddress = joinAddress(data);
    return {
      customer_name: fullName,
      customer_email: data.customer_email || null,
      customer_phone: data.customer_phone,
      customer_address: fullAddress || null,
      appointment_type: data.appointment_type,
      scheduled_date: data.scheduled_date,
      scheduled_time: data.scheduled_time,
      notes: data.notes || null,
      company_id: data.company_id || null,
    };
  };

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { data: result, error } = await supabase.from("appointments").insert(buildPayload(data)).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment created successfully");
      logAction("create", "appointment", data.id, { customer_name: `${formData.first_name} ${formData.last_name}`.trim() });
      navigate("/admin/appointments/list");
    },
    onError: (error) => {
      toast.error("Failed to create appointment: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { error } = await supabase.from("appointments").update(buildPayload(data)).eq("id", editId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment updated successfully");
      logAction("update", "appointment", editId!, { customer_name: `${formData.first_name} ${formData.last_name}`.trim() });
      navigate("/admin/appointments/list");
    },
    onError: (error) => {
      toast.error("Failed to update appointment: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name || !formData.customer_phone || !formData.scheduled_date || !formData.scheduled_time || !formData.company_id) {
      toast.error("Please fill in all required fields");
      return;
    }
    const digits = formData.customer_phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      toast.error("Phone number must be 10 digits");
      return;
    }

    if (isEditing) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (value: string) => {
    setFormData(prev => ({ ...prev, customer_phone: formatPhone(value) }));
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{isEditing ? "Edit Appointment" : "Book New Appointment"}</h2>

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
                <Label htmlFor="company_id">Assign to Company *</Label>
                <Select
                  value={formData.company_id}
                  onValueChange={(v) => handleChange("company_id", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
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
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleChange("first_name", e.target.value)}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleChange("last_name", e.target.value)}
                    placeholder="Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_phone">Phone Number *</Label>
                  <Input
                    id="customer_phone"
                    value={formData.customer_phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="111-111-1111"
                    inputMode="tel"
                    maxLength={12}
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
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Address</h3>
              <div className="space-y-2">
                <Label htmlFor="address_street">Street Address</Label>
                <Input
                  id="address_street"
                  value={formData.address_street}
                  onChange={(e) => handleChange("address_street", e.target.value)}
                  placeholder="123 Main St"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="address_city">City</Label>
                  <Input
                    id="address_city"
                    value={formData.address_city}
                    onChange={(e) => handleChange("address_city", e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_state">State</Label>
                  <Input
                    id="address_state"
                    value={formData.address_state}
                    onChange={(e) => handleChange("address_state", e.target.value)}
                    placeholder="State"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_zip">ZIP</Label>
                  <Input
                    id="address_zip"
                    value={formData.address_zip}
                    onChange={(e) => handleChange("address_zip", e.target.value)}
                    placeholder="12345"
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

            <div className="flex gap-2">
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Update Appointment" : "Create Appointment"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/admin/appointments/list")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
