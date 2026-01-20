import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Wand2, X, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FilterOption {
  id: string;
  category: string;
  value: string;
  label: string;
}

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: string;
  company_id: string | null;
  audience_types: string[];
  visit_types: string[];
  equipment_types: string[];
  location_states: string[];
  location_counties: string[];
  location_cities: string[];
  template_id: string;
  naming_pattern: string;
}

export default function CampaignForm() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = campaignId === "new";

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    company_id: "",
    audience_types: [] as string[],
    visit_types: [] as string[],
    equipment_types: [] as string[],
    location_states: [] as string[],
    location_counties: [] as string[],
    location_cities: [] as string[],
    template_id: "default",
    naming_pattern: "{audience}-{visit_type}-{equipment}-{location}",
  });

  // Fetch filter options
  const { data: filterOptions } = useQuery({
    queryKey: ["page-filter-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_filter_options")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data as FilterOption[];
    },
  });

  // Fetch companies
  const { data: companies } = useQuery({
    queryKey: ["companies-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  // Fetch states from cities table
  const { data: states } = useQuery({
    queryKey: ["distinct-states"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_distinct_states");
      if (error) throw error;
      return data as { state: string; state_code: string }[];
    },
  });

  // Fetch counties based on selected states
  const { data: counties } = useQuery({
    queryKey: ["counties", formData.location_states],
    queryFn: async () => {
      if (formData.location_states.length === 0) return [];
      const { data, error } = await supabase.rpc("get_counties_by_states", {
        state_codes: formData.location_states,
      });
      if (error) throw error;
      return data as { county: string; state_code: string }[];
    },
    enabled: formData.location_states.length > 0,
  });

  // Fetch existing campaign if editing
  const { data: existingCampaign } = useQuery({
    queryKey: ["campaign", campaignId],
    queryFn: async () => {
      if (isNew) return null;
      const { data, error } = await supabase
        .from("page_campaigns")
        .select("*")
        .eq("id", campaignId)
        .single();
      if (error) throw error;
      return data as Campaign;
    },
    enabled: !isNew,
  });

  useEffect(() => {
    if (existingCampaign) {
      setFormData({
        name: existingCampaign.name,
        description: existingCampaign.description || "",
        company_id: existingCampaign.company_id || "",
        audience_types: (existingCampaign.audience_types as string[]) || [],
        visit_types: (existingCampaign.visit_types as string[]) || [],
        equipment_types: (existingCampaign.equipment_types as string[]) || [],
        location_states: (existingCampaign.location_states as string[]) || [],
        location_counties: (existingCampaign.location_counties as string[]) || [],
        location_cities: (existingCampaign.location_cities as string[]) || [],
        template_id: existingCampaign.template_id || "default",
        naming_pattern: existingCampaign.naming_pattern || "{audience}-{visit_type}-{equipment}-{location}",
      });
    }
  }, [existingCampaign]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        company_id: formData.company_id || null,
        audience_types: formData.audience_types,
        visit_types: formData.visit_types,
        equipment_types: formData.equipment_types,
        location_states: formData.location_states,
        location_counties: formData.location_counties,
        location_cities: formData.location_cities,
        template_id: formData.template_id,
        naming_pattern: formData.naming_pattern,
      };

      if (isNew) {
        const { error } = await supabase.from("page_campaigns").insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("page_campaigns")
          .update(payload)
          .eq("id", campaignId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page-campaigns"] });
      toast.success(isNew ? "Campaign created!" : "Campaign updated!");
      navigate("/admin/page-builder/campaigns");
    },
    onError: (error) => {
      toast.error("Failed to save: " + error.message);
    },
  });

  // Generate pages mutation
  const generatePagesMutation = useMutation({
    mutationFn: async () => {
      // Build all combinations of filters
      const audiences = formData.audience_types.length > 0 ? formData.audience_types : [null];
      const visits = formData.visit_types.length > 0 ? formData.visit_types : [null];
      const equipment = formData.equipment_types.length > 0 ? formData.equipment_types : [null];
      
      // Use most specific location level: cities > counties > states
      type LocationItem = { value: string; type: 'city' | 'county' | 'state' };
      let locations: LocationItem[] = [];
      
      if (formData.location_cities.length > 0) {
        locations = formData.location_cities.map(c => ({ value: c, type: 'city' as const }));
      } else if (formData.location_counties.length > 0) {
        locations = formData.location_counties.map(c => ({ value: c, type: 'county' as const }));
      } else if (formData.location_states.length > 0) {
        locations = formData.location_states.map(s => ({ value: s, type: 'state' as const }));
      } else {
        locations = [{ value: '', type: 'state' as const }];
      }

      const pages: Array<{
        campaign_id: string;
        company_id: string | null;
        slug: string;
        title: string;
        meta_description: string;
        audience_type: string | null;
        visit_type: string | null;
        equipment_type: string | null;
        location_state: string | null;
        location_county: string | null;
        location_city: string | null;
        status: string;
      }> = [];

      // Get label maps for better titles
      const audienceLabels: Record<string, string> = {};
      const visitLabels: Record<string, string> = {};
      const equipmentLabels: Record<string, string> = {};
      
      filterOptions?.forEach((opt) => {
        if (opt.category === "audience") audienceLabels[opt.value] = opt.label;
        if (opt.category === "visit_type") visitLabels[opt.value] = opt.label;
        if (opt.category === "equipment") equipmentLabels[opt.value] = opt.label;
      });

      for (const audience of audiences) {
        for (const visit of visits) {
          for (const equip of equipment) {
            for (const location of locations) {
              // Build slug from pattern
              const locationSlug = location.value
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-]/g, "");
              
              let slug = formData.naming_pattern
                .replace("{audience}", audience || "")
                .replace("{visit_type}", visit || "")
                .replace("{equipment}", equip || "")
                .replace("{location}", locationSlug)
                .replace(/--+/g, "-")
                .replace(/^-|-$/g, "")
                .toLowerCase();

              // Build title with location name
              const locationDisplay = location.value || null;
              const parts = [
                audience ? audienceLabels[audience] || audience : null,
                equip ? equipmentLabels[equip] || equip : null,
                visit ? visitLabels[visit] || visit : null,
                locationDisplay ? `in ${locationDisplay}` : null,
              ].filter(Boolean);
              
              const title = parts.join(" ") || "Landing Page";
              const metaDesc = `Professional ${visit || "HVAC"} services for ${audience || "your"} ${equip || "heating and cooling"} needs${locationDisplay ? ` in ${locationDisplay}` : ""}.`;

              pages.push({
                campaign_id: campaignId!,
                company_id: formData.company_id || null,
                slug,
                title,
                meta_description: metaDesc,
                audience_type: audience,
                visit_type: visit,
                equipment_type: equip,
                location_state: location.type === 'state' && location.value ? location.value : null,
                location_county: location.type === 'county' ? location.value : null,
                location_city: location.type === 'city' ? location.value : null,
                status: "draft",
              });
            }
          }
        }
      }

      // Insert all pages
      const { error: insertError } = await supabase
        .from("generated_pages")
        .insert(pages);
      
      if (insertError) throw insertError;

      // Update campaign metrics
      const { error: updateError } = await supabase
        .from("page_campaigns")
        .update({ total_pages_generated: pages.length })
        .eq("id", campaignId);
      
      if (updateError) throw updateError;

      return pages.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["page-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["generated-pages", campaignId] });
      toast.success(`Generated ${count} pages successfully!`);
    },
    onError: (error) => {
      toast.error("Failed to generate pages: " + error.message);
    },
  });

  const handleToggleFilter = (category: string, value: string) => {
    const key = category as keyof typeof formData;
    const current = formData[key] as string[];
    if (current.includes(value)) {
      setFormData({ ...formData, [key]: current.filter((v) => v !== value) });
    } else {
      setFormData({ ...formData, [key]: [...current, value] });
    }
  };

  const audienceOptions = filterOptions?.filter((f) => f.category === "audience") || [];
  const visitTypeOptions = filterOptions?.filter((f) => f.category === "visit_type") || [];
  const equipmentOptions = filterOptions?.filter((f) => f.category === "equipment") || [];

  // Calculate estimated pages
  const calculateEstimatedPages = () => {
    const audiences = formData.audience_types.length || 1;
    const visits = formData.visit_types.length || 1;
    const equipment = formData.equipment_types.length || 1;
    const locations = 
      formData.location_cities.length || 
      formData.location_counties.length || 
      formData.location_states.length || 1;
    return audiences * visits * equipment * locations;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/page-builder/campaigns")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {isNew ? "Create Campaign" : "Edit Campaign"}
          </h2>
          <p className="text-muted-foreground">Configure your page generation campaign</p>
        </div>
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="filters">Page Filters</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="template">Template</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>Basic information about your campaign</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Houston HVAC Services"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Select
                    value={formData.company_id}
                    onValueChange={(v) => setFormData({ ...formData, company_id: v })}
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this campaign..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filters">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Audience Types */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Audience Types</CardTitle>
                <CardDescription>Who are these pages targeting?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {audienceOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.value}
                      checked={formData.audience_types.includes(option.value)}
                      onCheckedChange={() => handleToggleFilter("audience_types", option.value)}
                    />
                    <Label htmlFor={option.value} className="cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Visit Types */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Visit Types</CardTitle>
                <CardDescription>What type of service visits?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {visitTypeOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.value}
                      checked={formData.visit_types.includes(option.value)}
                      onCheckedChange={() => handleToggleFilter("visit_types", option.value)}
                    />
                    <Label htmlFor={option.value} className="cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Equipment Types */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Equipment Types</CardTitle>
                <CardDescription>What equipment do these pages cover?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {equipmentOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.value}
                      checked={formData.equipment_types.includes(option.value)}
                      onCheckedChange={() => handleToggleFilter("equipment_types", option.value)}
                    />
                    <Label htmlFor={option.value} className="cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="locations">
          <div className="grid gap-6 md:grid-cols-2">
            {/* States */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">States</CardTitle>
                <CardDescription>Select target states</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {formData.location_states.map((state) => (
                    <Badge key={state} variant="secondary" className="gap-1">
                      {state}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleToggleFilter("location_states", state)}
                      />
                    </Badge>
                  ))}
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {states?.map((state) => (
                    <div key={state.state_code} className="flex items-center space-x-2">
                      <Checkbox
                        id={state.state_code}
                        checked={formData.location_states.includes(state.state_code)}
                        onCheckedChange={() => handleToggleFilter("location_states", state.state_code)}
                      />
                      <Label htmlFor={state.state_code} className="cursor-pointer text-sm">
                        {state.state} ({state.state_code})
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Counties */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Counties</CardTitle>
                <CardDescription>
                  {formData.location_states.length === 0
                    ? "Select states first"
                    : "Filter by counties (optional)"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {formData.location_counties.map((county) => (
                    <Badge key={county} variant="secondary" className="gap-1">
                      {county}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleToggleFilter("location_counties", county)}
                      />
                    </Badge>
                  ))}
                </div>
                {formData.location_states.length > 0 && (
                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {counties?.map((county) => (
                      <div key={`${county.state_code}-${county.county}`} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${county.state_code}-${county.county}`}
                          checked={formData.location_counties.includes(county.county)}
                          onCheckedChange={() => handleToggleFilter("location_counties", county.county)}
                        />
                        <Label htmlFor={`${county.state_code}-${county.county}`} className="cursor-pointer text-sm">
                          {county.county}, {county.state_code}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="template">
          <Card>
            <CardHeader>
              <CardTitle>Page Template Settings</CardTitle>
              <CardDescription>Configure how pages are generated</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template">Template Style</Label>
                <Select
                  value={formData.template_id}
                  onValueChange={(v) => setFormData({ ...formData, template_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Template</SelectItem>
                    <SelectItem value="modern">Modern Template</SelectItem>
                    <SelectItem value="classic">Classic Template</SelectItem>
                    <SelectItem value="minimal">Minimal Template</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="naming">URL Naming Pattern</Label>
                <Input
                  id="naming"
                  value={formData.naming_pattern}
                  onChange={(e) => setFormData({ ...formData, naming_pattern: e.target.value })}
                  placeholder="{audience}-{visit_type}-{equipment}-{location}"
                />
                <p className="text-xs text-muted-foreground">
                  Available variables: {"{audience}"}, {"{visit_type}"}, {"{equipment}"}, {"{location}"}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Estimated Pages & Actions */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{calculateEstimatedPages()}</p>
              <p className="text-sm text-muted-foreground">Estimated Pages</p>
            </div>
            <div className="text-sm text-muted-foreground max-w-md">
              Based on your filter selections, this campaign will generate approximately{" "}
              <strong>{calculateEstimatedPages()}</strong> unique landing pages.
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/admin/page-builder/campaigns")}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!formData.name || saveMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {saveMutation.isPending ? "Saving..." : "Save Campaign"}
            </Button>
            {!isNew && (
              <>
                <Button 
                  variant="outline"
                  onClick={() => navigate(`/admin/page-builder/campaigns/${campaignId}/pages`)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Pages
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => generatePagesMutation.mutate()}
                  disabled={generatePagesMutation.isPending}
                >
                  {generatePagesMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                  )}
                  {generatePagesMutation.isPending ? "Generating..." : "Generate Pages"}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
