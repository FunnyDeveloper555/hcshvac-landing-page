import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAdminLog } from "@/hooks/useAdminLog";
import { useQuery } from "@tanstack/react-query";

const ServiceTermsAdd = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const { toast } = useToast();
  const { logAction } = useAdminLog();

  const [formData, setFormData] = useState({
    listing_id: "",
    primary_keyword: "",
    applies_to: "",
    company_id: "",
    equipment_type: "",
    location_type: "",
    industry_category: "",
    service_type: "",
    hours_of_service: "",
    page_url: "",
    display_order: 0,
    is_active: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data: companies } = useQuery({
    queryKey: ["companies-for-terms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (editId) {
      fetchServiceTerm();
    }
  }, [editId]);

  const fetchServiceTerm = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("service_terms")
      .select("*")
      .eq("id", editId)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch service term",
        variant: "destructive",
      });
    } else if (data) {
      setFormData({
        listing_id: data.listing_id || "",
        primary_keyword: data.primary_keyword || "",
        applies_to: data.applies_to || "",
        company_id: data.company_id || "",
        equipment_type: data.equipment_type || "",
        location_type: data.location_type || "",
        industry_category: data.industry_category || "",
        service_type: data.service_type || "",
        hours_of_service: data.hours_of_service || "",
        page_url: data.page_url || "",
        display_order: data.display_order || 0,
        is_active: data.is_active ?? true,
      });
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!formData.listing_id.trim() || !formData.primary_keyword.trim() || !formData.applies_to.trim()) {
      toast({
        title: "Error",
        description: "Listing ID, Primary Keyword, and Applies To are required",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    const dataToSave = {
      ...formData,
      company_id: formData.company_id || null,
    };

    if (editId) {
      const { error } = await supabase
        .from("service_terms")
        .update(dataToSave)
        .eq("id", editId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update service term",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Service term updated successfully",
        });
        logAction("update", "service_term", editId, { listing_id: formData.listing_id });
        navigate("/admin/services/terms");
      }
    } else {
      const { data, error } = await supabase
        .from("service_terms")
        .insert(dataToSave)
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create service term",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Service term created successfully",
        });
        logAction("create", "service_term", data.id, { listing_id: formData.listing_id });
        navigate("/admin/services/terms");
      }
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">
        {editId ? "Edit Service Term" : "Add Service Term"}
      </h2>

      <Card>
        <CardHeader>
          <CardTitle>Service Term Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="listing_id">Listing ID *</Label>
              <Input
                id="listing_id"
                value={formData.listing_id}
                onChange={(e) => setFormData({ ...formData, listing_id: e.target.value })}
                placeholder="e.g., 123123"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primary_keyword">Primary Keyword *</Label>
              <Input
                id="primary_keyword"
                value={formData.primary_keyword}
                onChange={(e) => setFormData({ ...formData, primary_keyword: e.target.value })}
                placeholder="e.g., Installation"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="applies_to">Applies To (Webpage) *</Label>
              <Input
                id="applies_to"
                value={formData.applies_to}
                onChange={(e) => setFormData({ ...formData, applies_to: e.target.value })}
                placeholder="e.g., Installation Webpage"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_id">Company</Label>
              <Select
                value={formData.company_id || "none"}
                onValueChange={(value) => setFormData({ ...formData, company_id: value === "none" ? "" : value })}
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

            <div className="space-y-2">
              <Label htmlFor="equipment_type">Equipment Type</Label>
              <Input
                id="equipment_type"
                value={formData.equipment_type}
                onChange={(e) => setFormData({ ...formData, equipment_type: e.target.value })}
                placeholder="e.g., Furnace"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location_type">Location Type</Label>
              <Input
                id="location_type"
                value={formData.location_type}
                onChange={(e) => setFormData({ ...formData, location_type: e.target.value })}
                placeholder="e.g., Residential"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry_category">Industry Category</Label>
              <Input
                id="industry_category"
                value={formData.industry_category}
                onChange={(e) => setFormData({ ...formData, industry_category: e.target.value })}
                placeholder="e.g., HVAC Repair"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service_type">Service Type</Label>
              <Input
                id="service_type"
                value={formData.service_type}
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                placeholder="e.g., Furnace Installation"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours_of_service">Hours of Service</Label>
              <Input
                id="hours_of_service"
                value={formData.hours_of_service}
                onChange={(e) => setFormData({ ...formData, hours_of_service: e.target.value })}
                placeholder="e.g., 24 Hours Emergency Installation Available"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="page_url">Page URL</Label>
              <Input
                id="page_url"
                value={formData.page_url}
                onChange={(e) => setFormData({ ...formData, page_url: e.target.value })}
                placeholder="e.g., /HVAC-Repair-FurnaceInstallation-Residential-123123"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editId ? "Update" : "Create"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin/services/terms")}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceTermsAdd;
