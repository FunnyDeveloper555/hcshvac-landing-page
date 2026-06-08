import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAdminLog } from "@/hooks/useAdminLog";

const TITLE_OPTIONS = [
  { value: "owner_occupied", label: "Owner/Owner Occupied" },
  { value: "owner_not_occupied", label: "Owner/Not Occupied" },
  { value: "family_of_owner", label: "Family Member of Owner" },
  { value: "tenant_renter", label: "Tenant/Renter" },
  { value: "property_maintenance", label: "Property Maintenance Company" },
  { value: "contractor", label: "Contractor" },
  { value: "legal_municipality", label: "Legal/Municipality" },
  { value: "other", label: "Other" },
];

const CAUTION_OPTIONS: { key: string; label: string; needsInput?: boolean; sub?: { key: string; label: string }[] }[] = [
  { key: "call_before_arrival", label: "Call Before Arrival" },
  { key: "has_dogs", label: "Has Dogs" },
  {
    key: "handicap",
    label: "Handicap",
    sub: [
      { key: "hard_of_hearing", label: "Hard of Hearing" },
      { key: "wheel_chair", label: "Wheel Chair" },
    ],
  },
  { key: "doorbell_broken", label: "Doorbell Does not Work" },
  { key: "use_side_door", label: "Use Side Door" },
  { key: "use_back_door", label: "Use Back Door" },
  { key: "buzz_box", label: "Buzz This on Box", needsInput: true },
  { key: "other", label: "Other", needsInput: true },
];

const formatPhone = (input: string): string => {
  const digits = (input || "").replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
};

type CautionsState = {
  selected: Record<string, boolean>;
  inputs: Record<string, string>;
};

const parseCautions = (raw: string): CautionsState => {
  if (!raw) return { selected: {}, inputs: {} };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.selected) {
      return { selected: parsed.selected || {}, inputs: parsed.inputs || {} };
    }
  } catch {
    // legacy free-text — keep in "other" input
    return { selected: { other: true }, inputs: { other: raw } };
  }
  return { selected: {}, inputs: {} };
};

const CustomersAdd = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const editId = searchParams.get("id");
  const isEditing = !!editId;
  const { toast } = useToast();
  const { logAction } = useAdminLog();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    ship_to_first_name: "",
    ship_to_last_name: "",
    ship_to_business_name: "",
    ship_to_address: "",
    ship_to_suite_number: "",
    ship_to_city: "",
    ship_to_state: "",
    ship_to_zip_code: "",
    bill_to_same_as_ship_to: true,
    bill_to_first_name: "",
    bill_to_last_name: "",
    bill_to_business_name: "",
    bill_to_address: "",
    bill_to_suite_number: "",
    bill_to_city: "",
    bill_to_state: "",
    bill_to_zip_code: "",
    location_type: "residential",
    residential_type: "",
    residential_occupancy: "",
    building_occupied: "",
    point_of_contact_name: "",
    point_of_contact_phone: "",
    point_of_contact_email: "",
    equipment_location: "",
    type_of_use: "",
    cautions_restrictions: "",
    hours_of_operation: "",
    location_age_years: null as number | null,
    // New fields
    company_id: "",
    warranty_status: "active",
    title_to_location: "",

    initial_visit_notes: "",
    security_gate_access: null as boolean | null,
    lock_boxes_codes: "",
    ems_monitoring: null as boolean | null,
    ems_provider_info: "",
    build_year: null as number | null,
    housing_type: "",
    occupied_by: "",
    responsible_billing_party: "",
    business_type: "",
    corporation_name: "",
    business_phone: "",
  });

  // Fetch companies for dropdown
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
      fetchCustomer();
    }
  }, [editId]);

  const fetchCustomer = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("customer_registrations")
      .select("*")
      .eq("id", editId)
      .maybeSingle();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load customer",
        variant: "destructive",
      });
      navigate("/admin/customers/list");
    } else if (data) {
      setFormData({
        email: data.email || "",
        phone: data.phone || "",
        ship_to_first_name: data.ship_to_first_name,
        ship_to_last_name: data.ship_to_last_name,
        ship_to_business_name: data.ship_to_business_name || "",
        ship_to_address: data.ship_to_address,
        ship_to_suite_number: data.ship_to_suite_number || "",
        ship_to_city: data.ship_to_city,
        ship_to_state: data.ship_to_state,
        ship_to_zip_code: data.ship_to_zip_code,
        bill_to_same_as_ship_to: data.bill_to_same_as_ship_to ?? true,
        bill_to_first_name: data.bill_to_first_name || "",
        bill_to_last_name: data.bill_to_last_name || "",
        bill_to_business_name: data.bill_to_business_name || "",
        bill_to_address: data.bill_to_address || "",
        bill_to_suite_number: data.bill_to_suite_number || "",
        bill_to_city: data.bill_to_city || "",
        bill_to_state: data.bill_to_state || "",
        bill_to_zip_code: data.bill_to_zip_code || "",
        location_type: data.location_type,
        residential_type: data.residential_type || "",
        residential_occupancy: data.residential_occupancy || "",
        building_occupied: data.building_occupied || "",
        point_of_contact_name: data.point_of_contact_name || "",
        point_of_contact_phone: data.point_of_contact_phone || "",
        point_of_contact_email: data.point_of_contact_email || "",
        equipment_location: data.equipment_location || "",
        type_of_use: data.type_of_use || "",
        cautions_restrictions: data.cautions_restrictions || "",
        hours_of_operation: data.hours_of_operation || "",
        location_age_years: data.location_age_years,
        company_id: data.company_id || "",
        warranty_status: data.warranty_status || "active",
        title_to_location: data.title_to_location || "",
        
        initial_visit_notes: data.initial_visit_notes || "",
        security_gate_access: data.security_gate_access,
        lock_boxes_codes: data.lock_boxes_codes || "",
        ems_monitoring: data.ems_monitoring,
        ems_provider_info: data.ems_provider_info || "",
        build_year: data.build_year,
        housing_type: data.housing_type || "",
        occupied_by: data.occupied_by || "",
        responsible_billing_party: data.responsible_billing_party || "",
        business_type: data.business_type || "",
        corporation_name: data.corporation_name || "",
        business_phone: data.business_phone || "",
      });
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.ship_to_first_name || !formData.ship_to_last_name || !formData.ship_to_address ||
      !formData.ship_to_city || !formData.ship_to_state || !formData.ship_to_zip_code) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const customerData = {
        ...formData,
        company_id: formData.company_id === "none" ? null : formData.company_id || null,
        location_age_years: formData.location_age_years || null,
        build_year: formData.build_year || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("customer_registrations")
          .update(customerData)
          .eq("id", editId);

        if (error) throw error;

        toast({ title: "Customer updated successfully" });
        logAction("update", "customer", editId, {
          customer_name: `${formData.ship_to_first_name} ${formData.ship_to_last_name}`
        });
      } else {
        const { data, error } = await supabase
          .from("customer_registrations")
          .insert([customerData])
          .select()
          .single();

        if (error) throw error;

        toast({ title: "Customer created successfully" });
        logAction("create", "customer", data.id, {
          customer_name: `${formData.ship_to_first_name} ${formData.ship_to_last_name}`
        });
      }

      navigate("/admin/customers/list");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">{isEditing ? "Edit Customer" : "Add New Customer"}</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Assignment & Status */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment & Status</CardTitle>
            <CardDescription>Assign customer to a company and set warranty status</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="company_id">Assign to Company</Label>
              <Select
                value={formData.company_id}
                onValueChange={(value) => setFormData({ ...formData, company_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
              <SelectContent>
                  <SelectItem value="none">No Company</SelectItem>
                  {companies?.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="warranty_status">Warranty Status</Label>
              <Select
                value={formData.warranty_status}
                onValueChange={(value) => setFormData({ ...formData, warranty_status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="none">No Warranty</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="location_type">Location Type *</Label>
              <Select
                value={formData.location_type}
                onValueChange={(value) => setFormData({ ...formData, location_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Customer contact details</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Commercial-specific fields */}
        {formData.location_type === "commercial" && (
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Commercial customer details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="corporation_name">Corporation Name</Label>
                  <Input
                    id="corporation_name"
                    value={formData.corporation_name}
                    onChange={(e) => setFormData({ ...formData, corporation_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="business_type">Business Type</Label>
                  <Input
                    id="business_type"
                    value={formData.business_type}
                    onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="business_phone">Business Phone</Label>
                  <Input
                    id="business_phone"
                    value={formData.business_phone}
                    onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="hours_of_operation">Hours of Operation</Label>
                  <Input
                    id="hours_of_operation"
                    value={formData.hours_of_operation}
                    onChange={(e) => setFormData({ ...formData, hours_of_operation: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="point_of_contact_name">Point of Contact</Label>
                  <Input
                    id="point_of_contact_name"
                    value={formData.point_of_contact_name}
                    onChange={(e) => setFormData({ ...formData, point_of_contact_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="point_of_contact_phone">Contact Phone</Label>
                  <Input
                    id="point_of_contact_phone"
                    value={formData.point_of_contact_phone}
                    onChange={(e) => setFormData({ ...formData, point_of_contact_phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="point_of_contact_email">Contact Email</Label>
                  <Input
                    id="point_of_contact_email"
                    type="email"
                    value={formData.point_of_contact_email}
                    onChange={(e) => setFormData({ ...formData, point_of_contact_email: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ship To Address */}
        <Card>
          <CardHeader>
            <CardTitle>Ship To Address</CardTitle>
            <CardDescription>Primary service location</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ship_to_first_name">First Name *</Label>
                <Input
                  id="ship_to_first_name"
                  value={formData.ship_to_first_name}
                  onChange={(e) => setFormData({ ...formData, ship_to_first_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="ship_to_last_name">Last Name *</Label>
                <Input
                  id="ship_to_last_name"
                  value={formData.ship_to_last_name}
                  onChange={(e) => setFormData({ ...formData, ship_to_last_name: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="ship_to_business_name">Business Name</Label>
              <Input
                id="ship_to_business_name"
                value={formData.ship_to_business_name}
                onChange={(e) => setFormData({ ...formData, ship_to_business_name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="ship_to_address">Address *</Label>
                <Input
                  id="ship_to_address"
                  value={formData.ship_to_address}
                  onChange={(e) => setFormData({ ...formData, ship_to_address: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="ship_to_suite_number">Suite/Unit</Label>
                <Input
                  id="ship_to_suite_number"
                  value={formData.ship_to_suite_number}
                  onChange={(e) => setFormData({ ...formData, ship_to_suite_number: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="ship_to_city">City *</Label>
                <Input
                  id="ship_to_city"
                  value={formData.ship_to_city}
                  onChange={(e) => setFormData({ ...formData, ship_to_city: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="ship_to_state">State *</Label>
                <Input
                  id="ship_to_state"
                  value={formData.ship_to_state}
                  onChange={(e) => setFormData({ ...formData, ship_to_state: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="ship_to_zip_code">Zip Code *</Label>
                <Input
                  id="ship_to_zip_code"
                  value={formData.ship_to_zip_code}
                  onChange={(e) => setFormData({ ...formData, ship_to_zip_code: e.target.value })}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bill To Address */}
        <Card>
          <CardHeader>
            <CardTitle>Bill To Address</CardTitle>
            <div className="flex items-center space-x-2 mt-2">
              <Checkbox
                id="bill_to_same"
                checked={formData.bill_to_same_as_ship_to}
                onCheckedChange={(checked) => setFormData({ ...formData, bill_to_same_as_ship_to: !!checked })}
              />
              <Label htmlFor="bill_to_same">Same as ship to address</Label>
            </div>
          </CardHeader>
          {!formData.bill_to_same_as_ship_to && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bill_to_first_name">First Name</Label>
                  <Input
                    id="bill_to_first_name"
                    value={formData.bill_to_first_name}
                    onChange={(e) => setFormData({ ...formData, bill_to_first_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="bill_to_last_name">Last Name</Label>
                  <Input
                    id="bill_to_last_name"
                    value={formData.bill_to_last_name}
                    onChange={(e) => setFormData({ ...formData, bill_to_last_name: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="bill_to_business_name">Business Name</Label>
                <Input
                  id="bill_to_business_name"
                  value={formData.bill_to_business_name}
                  onChange={(e) => setFormData({ ...formData, bill_to_business_name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="bill_to_address">Address</Label>
                  <Input
                    id="bill_to_address"
                    value={formData.bill_to_address}
                    onChange={(e) => setFormData({ ...formData, bill_to_address: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="bill_to_suite_number">Suite/Unit</Label>
                  <Input
                    id="bill_to_suite_number"
                    value={formData.bill_to_suite_number}
                    onChange={(e) => setFormData({ ...formData, bill_to_suite_number: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="bill_to_city">City</Label>
                  <Input
                    id="bill_to_city"
                    value={formData.bill_to_city}
                    onChange={(e) => setFormData({ ...formData, bill_to_city: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="bill_to_state">State</Label>
                  <Input
                    id="bill_to_state"
                    value={formData.bill_to_state}
                    onChange={(e) => setFormData({ ...formData, bill_to_state: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="bill_to_zip_code">Zip Code</Label>
                  <Input
                    id="bill_to_zip_code"
                    value={formData.bill_to_zip_code}
                    onChange={(e) => setFormData({ ...formData, bill_to_zip_code: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="responsible_billing_party">Responsible Billing Party</Label>
                <Input
                  id="responsible_billing_party"
                  value={formData.responsible_billing_party}
                  onChange={(e) => setFormData({ ...formData, responsible_billing_party: e.target.value })}
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Location Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Location Profile</CardTitle>
            <CardDescription>Property details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.location_type === "residential" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="build_year">Build Year</Label>
                    <Input
                      id="build_year"
                      type="number"
                      value={formData.build_year || ""}
                      onChange={(e) => setFormData({ ...formData, build_year: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="e.g., 1995"
                    />
                  </div>
                  <div>
                    <Label htmlFor="housing_type">Housing Type</Label>
                    <Select
                      value={formData.housing_type}
                      onValueChange={(value) => setFormData({ ...formData, housing_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single_family">Single Family</SelectItem>
                        <SelectItem value="townhouse">Townhouse</SelectItem>
                        <SelectItem value="condo">Condo</SelectItem>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="duplex">Duplex</SelectItem>
                        <SelectItem value="mobile_home">Mobile Home</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="occupied_by">Occupied By</Label>
                    <Select
                      value={formData.occupied_by}
                      onValueChange={(value) => setFormData({ ...formData, occupied_by: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Owner</SelectItem>
                        <SelectItem value="renter">Renter</SelectItem>
                        <SelectItem value="vacant">Vacant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="residential_type">Residential Type</Label>
                    <Input
                      id="residential_type"
                      value={formData.residential_type}
                      onChange={(e) => setFormData({ ...formData, residential_type: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="residential_occupancy">Residential Occupancy</Label>
                    <Input
                      id="residential_occupancy"
                      value={formData.residential_occupancy}
                      onChange={(e) => setFormData({ ...formData, residential_occupancy: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <Label>Your Formal Title to the Ship To Location</Label>
              <RadioGroup
                value={formData.title_to_location}
                onValueChange={(value) => setFormData({ ...formData, title_to_location: value })}
                className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2"
              >
                {TITLE_OPTIONS.map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={opt.value} id={`title_${opt.value}`} />
                    <Label htmlFor={`title_${opt.value}`} className="font-normal">{opt.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="equipment_location">Equipment Location</Label>
              <Textarea
                id="equipment_location"
                value={formData.equipment_location}
                onChange={(e) => setFormData({ ...formData, equipment_location: e.target.value })}
              />
            </div>

            <div>
              <Label>Cautions / Restrictions ALERTS</Label>
              <div className="space-y-2 mt-2 border rounded-md p-3">
                {CAUTION_OPTIONS.map((opt) => {
                  const state = parseCautions(formData.cautions_restrictions);
                  const checked = !!state.selected[opt.key];
                  const updateSelected = (next: boolean) => {
                    const newState = { ...state, selected: { ...state.selected, [opt.key]: next } };
                    setFormData({ ...formData, cautions_restrictions: JSON.stringify(newState) });
                  };
                  const updateInput = (val: string) => {
                    const newState = { ...state, inputs: { ...state.inputs, [opt.key]: val } };
                    setFormData({ ...formData, cautions_restrictions: JSON.stringify(newState) });
                  };
                  return (
                    <div key={opt.key} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`caution_${opt.key}`}
                          checked={checked}
                          onCheckedChange={(c) => updateSelected(!!c)}
                        />
                        <Label htmlFor={`caution_${opt.key}`} className="font-normal">{opt.label}</Label>
                        {opt.needsInput && checked && (
                          <Input
                            className="ml-2 h-8 max-w-xs"
                            value={state.inputs[opt.key] || ""}
                            onChange={(e) => updateInput(e.target.value)}
                            placeholder="Enter details"
                          />
                        )}
                      </div>
                      {opt.sub && checked && (
                        <div className="ml-6 space-y-1">
                          {opt.sub.map((s) => {
                            const subChecked = !!state.selected[s.key];
                            return (
                              <div key={s.key} className="flex items-center gap-2">
                                <Checkbox
                                  id={`caution_${s.key}`}
                                  checked={subChecked}
                                  onCheckedChange={(c) => {
                                    const cur = parseCautions(formData.cautions_restrictions);
                                    const ns = { ...cur, selected: { ...cur.selected, [s.key]: !!c } };
                                    setFormData({ ...formData, cautions_restrictions: JSON.stringify(ns) });
                                  }}
                                />
                                <Label htmlFor={`caution_${s.key}`} className="font-normal">{s.label}</Label>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Commercial-specific Location Information */}
        {formData.location_type === "commercial" && (
          <Card>
            <CardHeader>
              <CardTitle>Location Information</CardTitle>
              <CardDescription>Things we need for our tech to know</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Is there a Security Gate Access?</Label>
                <RadioGroup
                  value={formData.security_gate_access === null ? "" : formData.security_gate_access ? "yes" : "no"}
                  onValueChange={(value) => setFormData({ ...formData, security_gate_access: value === "yes" })}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="security_yes" />
                    <Label htmlFor="security_yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="security_no" />
                    <Label htmlFor="security_no">No</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="lock_boxes_codes">Lock Boxes or Access Codes</Label>
                <Input
                  id="lock_boxes_codes"
                  value={formData.lock_boxes_codes}
                  onChange={(e) => setFormData({ ...formData, lock_boxes_codes: e.target.value })}
                  placeholder="Enter any access codes or lock box information"
                />
              </div>

              <div>
                <Label>Is there an EMS (Energy Management Service) Monitoring your Location?</Label>
                <RadioGroup
                  value={formData.ems_monitoring === null ? "" : formData.ems_monitoring ? "yes" : "no"}
                  onValueChange={(value) => setFormData({ ...formData, ems_monitoring: value === "yes" })}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="ems_yes" />
                    <Label htmlFor="ems_yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="ems_no" />
                    <Label htmlFor="ems_no">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.ems_monitoring && (
                <div>
                  <Label htmlFor="ems_provider_info">EMS Provider Information</Label>
                  <Textarea
                    id="ems_provider_info"
                    value={formData.ems_provider_info}
                    onChange={(e) => setFormData({ ...formData, ems_provider_info: e.target.value })}
                    placeholder="Please provide Name, Phone Number and account identification information"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Initial Visit Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Initial Visit Notes</CardTitle>
            <CardDescription>Any notes or memos for the initial visit</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              id="initial_visit_notes"
              value={formData.initial_visit_notes}
              onChange={(e) => setFormData({ ...formData, initial_visit_notes: e.target.value })}
              rows={4}
            />
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {isEditing ? "Update Customer" : "Create Customer"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/admin/customers/list")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CustomersAdd;
