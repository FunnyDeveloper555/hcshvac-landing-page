import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAdminLog } from "@/hooks/useAdminLog";

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
      .single();

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
        location_age_years: formData.location_age_years || null,
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

            {formData.location_type === "commercial" && (
              <>
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
                <div>
                  <Label htmlFor="hours_of_operation">Hours of Operation</Label>
                  <Input
                    id="hours_of_operation"
                    value={formData.hours_of_operation}
                    onChange={(e) => setFormData({ ...formData, hours_of_operation: e.target.value })}
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="equipment_location">Equipment Location</Label>
              <Textarea
                id="equipment_location"
                value={formData.equipment_location}
                onChange={(e) => setFormData({ ...formData, equipment_location: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="cautions_restrictions">Cautions/Restrictions</Label>
              <Textarea
                id="cautions_restrictions"
                value={formData.cautions_restrictions}
                onChange={(e) => setFormData({ ...formData, cautions_restrictions: e.target.value })}
              />
            </div>
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
