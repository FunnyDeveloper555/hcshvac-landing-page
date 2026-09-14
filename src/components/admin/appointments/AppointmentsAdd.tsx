import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from "sonner";
import { Loader2, Check, ChevronsUpDown, User, Mail, Phone, MapPin, Building2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAdminLog } from "@/hooks/useAdminLog";
import { cn } from "@/lib/utils";
import AppointmentCartPanel from "./AppointmentCartPanel";
import { VISIT_TYPES } from "@/components/admin/DiagnosticFeesAdd";
import { ourServiceVisitReasons, parseOurServices } from "@/lib/ourServices";

interface CustomerRecord {
  id: string;
  account_number: string | null;
  ship_to_first_name: string;
  ship_to_last_name: string;
  ship_to_business_name: string | null;
  ship_to_address: string;
  ship_to_suite_number: string | null;
  ship_to_city: string;
  ship_to_state: string;
  ship_to_zip_code: string;
  bill_to_same_as_ship_to: boolean | null;
  bill_to_first_name: string | null;
  bill_to_last_name: string | null;
  bill_to_business_name: string | null;
  bill_to_address: string | null;
  bill_to_suite_number: string | null;
  bill_to_city: string | null;
  bill_to_state: string | null;
  bill_to_zip_code: string | null;
  email: string;
  phone: string;
  business_phone: string | null;
  point_of_contact_phone: string | null;
  point_of_contact_email: string | null;
  company_id: string | null;
  cautions_restrictions?: string | null;
}

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
  occupied: string;
  equipment_location: string;
  calendar_id: string;
  assigned_employee_id: string;
  technician_phone: string;
  duration_minutes: string;
  sms_reminders_enabled: boolean;
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
  occupied: "",
  equipment_location: "",
  calendar_id: "",
  assigned_employee_id: "",
  technician_phone: "",
  duration_minutes: "60",
  sms_reminders_enabled: true,
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

const visitTypes: string[] = VISIT_TYPES;

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

  // The assigned company's checked "Our Services" drive the Select Visit Reason options.
  const { data: companyOurServices } = useQuery({
    queryKey: ["company-our-services", formData.company_id],
    enabled: !!formData.company_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("our_services")
        .eq("id", formData.company_id)
        .maybeSingle();
      if (error) throw error;
      return ourServiceVisitReasons(parseOurServices((data as any)?.our_services));
    },
    staleTime: 30_000,
  });

  const visitReasonOptions = companyOurServices?.length ? companyOurServices : visitTypes;


  const { data: calendarOptions } = useQuery({
    queryKey: ["calendars-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calendars")
        .select("id, calendar_name, calendar_type, company_id, employee_id, phone, google_calendar_id, is_active")
        .eq("is_active", true)
        .order("calendar_type")
        .order("calendar_name");
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });

  const { data: employeeOptions } = useQuery({
    queryKey: ["employees-for-appointment"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, phone_number")
        .order("first_name");
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [appointmentNumber, setAppointmentNumber] = useState<string | null>(null);

  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ["customers-for-appointment", customerSearch],
    queryFn: async () => {
      let q = supabase
        .from("customer_registrations")
        .select(
          "id, account_number, ship_to_first_name, ship_to_last_name, ship_to_business_name, ship_to_address, ship_to_suite_number, ship_to_city, ship_to_state, ship_to_zip_code, bill_to_same_as_ship_to, bill_to_first_name, bill_to_last_name, bill_to_business_name, bill_to_address, bill_to_suite_number, bill_to_city, bill_to_state, bill_to_zip_code, email, phone, business_phone, point_of_contact_phone, point_of_contact_email, company_id, cautions_restrictions"
        )
        .order("created_at", { ascending: false })
        .limit(50);
      const term = customerSearch.trim();
      if (term) {
        const like = `%${term}%`;
        q = q.or(
          `ship_to_first_name.ilike.${like},ship_to_last_name.ilike.${like},ship_to_business_name.ilike.${like},email.ilike.${like},phone.ilike.${like},account_number.ilike.${like}`
        );
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as CustomerRecord[];
    },
  });

  const applyCustomerToForm = (c: CustomerRecord) => {
    setSelectedCustomer(c);
    setFormData((prev) => ({
      ...prev,
      first_name: c.ship_to_first_name || "",
      last_name: c.ship_to_last_name || "",
      customer_email: c.email || c.point_of_contact_email || "",
      customer_phone: formatPhone(c.phone || c.point_of_contact_phone || c.business_phone || ""),
      address_street: [c.ship_to_address, c.ship_to_suite_number].filter(Boolean).join(", "),
      address_city: c.ship_to_city || "",
      address_state: c.ship_to_state || "",
      address_zip: c.ship_to_zip_code || "",
      appointment_type: (c.bill_to_business_name || c.ship_to_business_name) ? "commercial" : "residential",
      company_id: c.company_id || prev.company_id,
    }));
  };

  useEffect(() => {
    if (editId) {
      fetchAppointment();
    }
  }, [editId]);

  const preselectCustomerId = searchParams.get("customerId");
  useEffect(() => {
    if (!preselectCustomerId || isEditing || selectedCustomer) return;
    (async () => {
      const { data, error } = await supabase
        .from("customer_registrations")
        .select(
          "id, account_number, ship_to_first_name, ship_to_last_name, ship_to_business_name, ship_to_address, ship_to_suite_number, ship_to_city, ship_to_state, ship_to_zip_code, bill_to_same_as_ship_to, bill_to_first_name, bill_to_last_name, bill_to_business_name, bill_to_address, bill_to_suite_number, bill_to_city, bill_to_state, bill_to_zip_code, email, phone, business_phone, point_of_contact_phone, point_of_contact_email, company_id, cautions_restrictions"
        )
        .eq("id", preselectCustomerId)
        .maybeSingle();
      if (!error && data) applyCustomerToForm(data as CustomerRecord);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectCustomerId, isEditing]);

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
      setAppointmentNumber((data as any).appointment_number || null);
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
        occupied: (data as any).occupied || "",
        equipment_location: (data as any).equipment_location || "",
        calendar_id: (data as any).calendar_id || "",
        assigned_employee_id: (data as any).assigned_employee_id || "",
        technician_phone: (data as any).technician_phone || "",
        duration_minutes: String((data as any).duration_minutes ?? 60),
        sms_reminders_enabled: (data as any).sms_reminders_enabled !== false,
      });
      // Try to match an existing customer by phone
      const digits = (data.customer_phone || "").replace(/\D/g, "").slice(-10);
      if (digits.length === 10) {
        const { data: matches } = await supabase
          .from("customer_registrations")
          .select(
            "id, account_number, ship_to_first_name, ship_to_last_name, ship_to_business_name, ship_to_address, ship_to_suite_number, ship_to_city, ship_to_state, ship_to_zip_code, bill_to_same_as_ship_to, bill_to_first_name, bill_to_last_name, bill_to_business_name, bill_to_address, bill_to_suite_number, bill_to_city, bill_to_state, bill_to_zip_code, email, phone, business_phone, point_of_contact_phone, point_of_contact_email, company_id, cautions_restrictions"
          )
          .or(`phone.ilike.%${digits}%,business_phone.ilike.%${digits}%,point_of_contact_phone.ilike.%${digits}%`)
          .limit(1);
        if (matches && matches[0]) setSelectedCustomer(matches[0] as CustomerRecord);
      }
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
      visit_type: data.visit_type || null,
      scheduled_date: data.scheduled_date,
      scheduled_time: data.scheduled_time,
      notes: data.notes || null,
      company_id: data.company_id || null,
      occupied: data.occupied || null,
      equipment_location: data.equipment_location || null,
      calendar_id: data.calendar_id || null,
      assigned_employee_id: data.assigned_employee_id || null,
      technician_phone: data.technician_phone || null,
      duration_minutes: Number(data.duration_minutes) || 60,
      sms_reminders_enabled: data.sms_reminders_enabled,
    };
  };

  // Push the appointment to Google Calendar (best effort — never blocks saving)
  const syncCalendar = async (appointmentId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("sync-appointment-calendar", {
        body: { appointment_id: appointmentId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Added to the Google calendar");
    } catch (e) {
      console.error("Calendar sync failed:", e);
      toast.error("Saved, but the calendar event could not be created");
    }
  };

  // Immediate booking confirmation text to customer + technician
  const sendBookingSms = async (appointmentId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("appointment-sms", {
        body: { appointment_id: appointmentId, kind: "booking" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const sent = (data?.results || []).filter((r: any) => r.status === "sent").length;
      if (sent > 0) toast.success(`Confirmation text sent (${sent})`);
    } catch (e) {
      console.error("Booking SMS failed:", e);
      toast.error("Saved, but the confirmation text could not be sent");
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { data: result, error } = await supabase.from("appointments").insert(buildPayload(data)).select().single();
      if (error) throw error;
      await syncCalendar(result.id);
      if (data.sms_reminders_enabled) await sendBookingSms(result.id);
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments-calendar"] });
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
      await syncCalendar(editId!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments-calendar"] });
      toast.success("Appointment updated successfully");
      logAction("update", "appointment", editId!, { customer_name: `${formData.first_name} ${formData.last_name}`.trim() });
      navigate("/admin/appointments/list");
    },
    onError: (error) => {
      toast.error("Failed to update appointment: " + error.message);
    },
  });

  const handleSubmit = (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault?.();
    if (!selectedCustomer) {
      toast.error("Please select a customer");
      return;
    }
    if (!formData.first_name || !formData.last_name || !formData.customer_phone || !formData.visit_type || !formData.scheduled_date || !formData.scheduled_time || !formData.company_id) {
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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-bold">{isEditing ? "Edit Appointment" : "Book New Appointment"}</h2>
        {isEditing && appointmentNumber && (
          <div className="text-sm">
            <span className="text-muted-foreground mr-2">Appointment ID:</span>
            <span className="font-mono font-semibold">{appointmentNumber}</span>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appointment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Appointment Type */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="appointment_type">Appointment Type *</Label>
                <Select
                  value={formData.appointment_type || undefined}
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
                  value={formData.company_id || undefined}
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

            <div className="space-y-2">
              <Label htmlFor="visit_type">Visit Type *</Label>
              <Select
                value={formData.visit_type || undefined}
                onValueChange={(v) => handleChange("visit_type", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select visit type" />
                </SelectTrigger>
                <SelectContent>
                  {visitTypes.map((vt) => (
                    <SelectItem key={vt} value={vt}>
                      {vt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Customer Selector */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Customer *</h3>
              <Popover open={customerPickerOpen} onOpenChange={setCustomerPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={customerPickerOpen}
                    className="w-full justify-between"
                  >
                    {selectedCustomer ? (
                      <span className="flex items-center gap-2 truncate">
                        <User className="h-4 w-4 shrink-0" />
                        <span className="truncate">
                          {selectedCustomer.ship_to_first_name} {selectedCustomer.ship_to_last_name}
                          {selectedCustomer.ship_to_business_name ? ` — ${selectedCustomer.ship_to_business_name}` : ""}
                          {selectedCustomer.account_number ? ` (${selectedCustomer.account_number})` : ""}
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Search and select a customer…</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[--radix-popover-trigger-width] min-w-[360px]" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search by name, business, email, phone, account #…"
                      value={customerSearch}
                      onValueChange={setCustomerSearch}
                    />
                    <CommandList>
                      {customersLoading && (
                        <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
                        </div>
                      )}
                      {!customersLoading && (customers?.length ?? 0) === 0 && (
                        <CommandEmpty>No customers found.</CommandEmpty>
                      )}
                      <CommandGroup>
                        {customers?.map((c) => {
                          const label = `${c.ship_to_first_name} ${c.ship_to_last_name}`.trim();
                          const sub = [c.ship_to_business_name, c.email, c.phone, c.account_number]
                            .filter(Boolean)
                            .join(" • ");
                          return (
                            <CommandItem
                              key={c.id}
                              value={c.id}
                              onSelect={() => {
                                applyCustomerToForm(c);
                                setCustomerPickerOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedCustomer?.id === c.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{label || "(no name)"}</span>
                                {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {selectedCustomer && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card className="bg-muted/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Ship To
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <div className="font-medium">
                        {selectedCustomer.ship_to_first_name} {selectedCustomer.ship_to_last_name}
                      </div>
                      {selectedCustomer.ship_to_business_name && (
                        <div>{selectedCustomer.ship_to_business_name}</div>
                      )}
                      <div>
                        {selectedCustomer.ship_to_address}
                        {selectedCustomer.ship_to_suite_number ? `, ${selectedCustomer.ship_to_suite_number}` : ""}
                      </div>
                      <div>
                        {selectedCustomer.ship_to_city}, {selectedCustomer.ship_to_state} {selectedCustomer.ship_to_zip_code}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Bill To
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      {(() => {
                        const same = selectedCustomer.bill_to_same_as_ship_to;
                        const b = {
                          first_name: same ? selectedCustomer.ship_to_first_name : selectedCustomer.bill_to_first_name,
                          last_name: same ? selectedCustomer.ship_to_last_name : selectedCustomer.bill_to_last_name,
                          business_name: same ? selectedCustomer.ship_to_business_name : selectedCustomer.bill_to_business_name,
                          address: same ? selectedCustomer.ship_to_address : selectedCustomer.bill_to_address,
                          suite_number: same ? selectedCustomer.ship_to_suite_number : selectedCustomer.bill_to_suite_number,
                          city: same ? selectedCustomer.ship_to_city : selectedCustomer.bill_to_city,
                          state: same ? selectedCustomer.ship_to_state : selectedCustomer.bill_to_state,
                          zip_code: same ? selectedCustomer.ship_to_zip_code : selectedCustomer.bill_to_zip_code,
                        };
                        return (
                          <>
                            <div className="font-medium">
                              {b.first_name} {b.last_name}
                            </div>
                            {b.business_name && <div>{b.business_name}</div>}
                            {b.address && (
                              <div>
                                {b.address}
                                {b.suite_number ? `, ${b.suite_number}` : ""}
                              </div>
                            )}
                            {(b.city || b.state || b.zip_code) && (
                              <div>
                                {b.city}
                                {b.state ? `, ${b.state}` : ""} {b.zip_code}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/30 sm:col-span-2">
                    <CardContent className="pt-4 grid gap-3 sm:grid-cols-2 text-sm">
                      {selectedCustomer.ship_to_business_name && (
                        <div className="flex items-center gap-2 sm:col-span-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Business:</span>
                          <span className="truncate">{selectedCustomer.ship_to_business_name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Phone:</span>
                        <span>{selectedCustomer.phone || selectedCustomer.point_of_contact_phone || selectedCustomer.business_phone || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Email:</span>
                        <span className="truncate">{selectedCustomer.email || selectedCustomer.point_of_contact_email || "—"}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
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
                    value={formData.scheduled_time || undefined}
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

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Calendar</Label>
                  <Select
                    value={formData.calendar_id || undefined}
                    onValueChange={(v) => {
                      const cal = calendarOptions?.find((c) => c.id === v);
                      setFormData((prev) => ({
                        ...prev,
                        calendar_id: v,
                        technician_phone: prev.technician_phone || cal?.phone || "",
                      }));
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select calendar" /></SelectTrigger>
                    <SelectContent>
                      {calendarOptions?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.calendar_name}{c.google_calendar_id ? "" : " (not linked to Google)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Assigned Technician</Label>
                  <Select
                    value={formData.assigned_employee_id || undefined}
                    onValueChange={(v) => {
                      const emp = employeeOptions?.find((e) => e.id === v);
                      setFormData((prev) => ({
                        ...prev,
                        assigned_employee_id: v,
                        technician_phone: emp?.phone_number || prev.technician_phone,
                      }));
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select technician" /></SelectTrigger>
                    <SelectContent>
                      {employeeOptions?.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select
                    value={formData.duration_minutes}
                    onValueChange={(v) => handleChange("duration_minutes", v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["30", "45", "60", "90", "120", "180", "240"].map((m) => (
                        <SelectItem key={m} value={m}>{Number(m) >= 60 ? `${Number(m) / 60} hr` : `${m} min`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="technician_phone">Technician Mobile (for text reminders)</Label>
                  <Input
                    id="technician_phone"
                    value={formData.technician_phone}
                    onChange={(e) => handleChange("technician_phone", e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={formData.sms_reminders_enabled}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, sms_reminders_enabled: e.target.checked }))
                      }
                    />
                    Send text confirmation now and a reminder 1 hour before
                  </label>
                </div>
              </div>
            </div>

            {/* Occupied + Equipment Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Occupied By Customer at Time of Visit</Label>
                <Select value={formData.occupied} onValueChange={(v) => handleChange("occupied", v)}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="equipment_location">Equipment Location</Label>
                <Input
                  id="equipment_location"
                  value={formData.equipment_location}
                  onChange={(e) => handleChange("equipment_location", e.target.value)}
                  placeholder="e.g. Attic, Basement, Rooftop, Closet"
                />
              </div>
            </div>

            {/* Customer Cautions/Restrictions (read-only mirror) */}
            {selectedCustomer?.cautions_restrictions && (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
                <div className="text-sm font-semibold text-destructive mb-1">⚠ Customer Alerts / Cautions</div>
                <div className="text-sm whitespace-pre-wrap">{selectedCustomer.cautions_restrictions}</div>
                <div className="text-xs text-muted-foreground mt-1">Managed on the Customer profile.</div>
              </div>
            )}

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
              <Button type="button" disabled={isPending} onClick={handleSubmit}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Update Appointment" : "Create Appointment"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/admin/appointments/list")}>
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isEditing && editId && (
        <AppointmentCartPanel
          appointmentId={editId}
          companyId={formData.company_id}
          visitType={formData.visit_type}
          customerEmail={formData.customer_email}
          customerName={`${formData.first_name} ${formData.last_name}`.trim()}
        />
      )}
    </div>
  );
}
