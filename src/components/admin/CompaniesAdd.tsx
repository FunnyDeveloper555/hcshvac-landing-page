import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const SERVICES = [
  "Heating Services",
  "Air Conditioning Services",
  "Plumbing",
  "Electrical",
  "Boilers Hot Water",
  "Boilers Steam",
  "Boilers Tankless",
  "Hot Water Heaters",
  "Hot Water Heaters Tankless",
  "Residential (Hvac)",
  "Commercial (Hvac)",
  "Industrial (Hvac)",
  "Educational Facilities (Hvac)",
  "Hvac Service",
  "Hvac Repair",
  "Hvac Furnace Installation",
  "Hvac Furnace Repair",
  "Hvac Furnace Service",
  "Hvac Air Conditioning Repair",
  "Hvac Air Conditioning Service",
  "Hvac Air Conditioning Installation",
  "Mini Split Repair",
  "Mini Split Service",
  "Mini Split Installation",
];

interface City {
  id: string;
  name: string;
  state: string;
  state_code: string;
  county: string | null;
  zip_codes: string | null;
}

interface CountyWithCities {
  county: string;
  state_code: string;
  cities: City[];
}

const CompaniesAdd = () => {
  const [uploading, setUploading] = useState(false);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedCounties, setSelectedCounties] = useState<string[]>([]);
  const [availableStates, setAvailableStates] = useState<{code: string, name: string}[]>([]);
  const [countiesByState, setCountiesByState] = useState<Map<string, string[]>>(new Map());
  const [citiesByCounty, setCitiesByCounty] = useState<Map<string, City[]>>(new Map());
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set());
  const [expandedCounties, setExpandedCounties] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: "",
    company_address: "",
    company_city: "",
    company_state: "",
    company_zip_code: "",
    company_phone: "",
    company_email_primary: "",
    company_support_email: "",
    poc_first_name: "",
    poc_last_name: "",
    poc_phone: "",
    poc_email: "",
    poc_title: "",
    secondary_poc_first_name: "",
    secondary_poc_last_name: "",
    secondary_poc_phone: "",
    secondary_poc_email: "",
    secondary_poc_title: "",
    display_order: 0,
    is_active: true,
    logo_url: "",
    services_provided: [] as string[],
    service_areas: [] as string[],
    brands_installed: [] as string[],
    brands_serviced: [] as string[],
    affiliations: {
      bbb: "",
      angies_list: "",
      google: "",
      yelp: "",
      yahoo: "",
      bing: "",
      manta: "",
      houzz: "",
      facebook: "",
      instagram: "",
      tiktok: "",
      nextdoor: "",
      youtube: "",
    },
    inventory_parts: "",
    inventory_equipment: "",
    inventory_locations: "",
  });
  const [brandInput, setBrandInput] = useState("");
  const [serviceInput, setServiceInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load all unique states on mount
  useEffect(() => {
    const loadStates = async () => {
      const allStates = new Map<string, {code: string, name: string}>();
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const { data: batch, error: batchError } = await supabase
          .from("cities")
          .select("state, state_code")
          .order("state")
          .range(offset, offset + batchSize - 1);
        
        if (batchError) {
          console.error("Error loading states batch:", batchError);
          break;
        }
        
        if (batch && batch.length > 0) {
          batch.forEach(item => {
            if (!allStates.has(item.state_code)) {
              allStates.set(item.state_code, { code: item.state_code, name: item.state });
            }
          });
          
          if (batch.length < batchSize) {
            hasMore = false;
          } else {
            offset += batchSize;
          }
        } else {
          hasMore = false;
        }
      }
      
      const uniqueStates = Array.from(allStates.values()).sort((a, b) => a.name.localeCompare(b.name));
      console.log("Total unique states loaded:", uniqueStates.length);
      setAvailableStates(uniqueStates);
    };
    loadStates();
  }, []);

  // Load counties when states are selected
  useEffect(() => {
    const loadCounties = async () => {
      if (selectedStates.length === 0) {
        setCountiesByState(new Map());
        setSelectedCounties([]);
        return;
      }

      const newCountiesByState = new Map<string, string[]>();

      for (const stateCode of selectedStates) {
        const { data, error } = await supabase
          .from("cities")
          .select("county")
          .eq("state_code", stateCode)
          .not("county", "is", null);
        
        if (!error && data) {
          const uniqueCounties = Array.from(new Set(data.map(item => item.county).filter(Boolean))) as string[];
          newCountiesByState.set(stateCode, uniqueCounties.sort());
        }
      }

      setCountiesByState(newCountiesByState);
      
      // Remove selected counties that are no longer in selected states
      const allAvailableCounties = Array.from(newCountiesByState.values()).flat();
      setSelectedCounties(prev => prev.filter(c => allAvailableCounties.includes(c)));
    };
    loadCounties();
  }, [selectedStates]);

  // Load cities when counties are selected
  useEffect(() => {
    const loadCities = async () => {
      if (selectedCounties.length === 0) {
        setCitiesByCounty(new Map());
        setSelectedCities([]);
        return;
      }

      const newCitiesByCounty = new Map<string, City[]>();

      for (const county of selectedCounties) {
        const { data, error } = await supabase
          .from("cities")
          .select("id, name, state, state_code, county, zip_codes")
          .eq("county", county)
          .order("name");

        if (!error && data) {
          newCitiesByCounty.set(county, data);
        }
      }

      setCitiesByCounty(newCitiesByCounty);
      
      // Remove selected cities that are no longer available
      const allAvailableCityIds = Array.from(newCitiesByCounty.values())
        .flat()
        .map(c => c.id);
      setSelectedCities(prev => prev.filter(id => allAvailableCityIds.includes(id)));
    };
    loadCities();
  }, [selectedCounties]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 2MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath);

      setFormData({ ...formData, logo_url: publicUrl });

      toast({
        title: "Success",
        description: "Logo uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload logo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const toggleService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services_provided: prev.services_provided.includes(service)
        ? prev.services_provided.filter(s => s !== service)
        : [...prev.services_provided, service]
    }));
  };

  const addCity = (cityId: string) => {
    if (selectedCities.includes(cityId)) {
      setSelectedCities(prev => prev.filter(id => id !== cityId));
    } else {
      setSelectedCities(prev => [...prev, cityId]);
    }
  };

  const toggleCounty = (county: string) => {
    setSelectedCounties(prev =>
      prev.includes(county)
        ? prev.filter(c => c !== county)
        : [...prev, county]
    );
  };

  const toggleCity = (cityId: string) => {
    setSelectedCities(prev =>
      prev.includes(cityId)
        ? prev.filter(id => id !== cityId)
        : [...prev, cityId]
    );
  };

  const toggleStateExpanded = (stateCode: string) => {
    setExpandedStates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stateCode)) {
        newSet.delete(stateCode);
      } else {
        newSet.add(stateCode);
      }
      return newSet;
    });
  };

  const toggleCountyExpanded = (county: string) => {
    setExpandedCounties(prev => {
      const newSet = new Set(prev);
      if (newSet.has(county)) {
        newSet.delete(county);
      } else {
        newSet.add(county);
      }
      return newSet;
    });
  };

  const addBrand = () => {
    if (brandInput.trim()) {
      setFormData(prev => ({
        ...prev,
        brands_installed: [...prev.brands_installed, brandInput.trim()]
      }));
      setBrandInput("");
    }
  };

  const removeBrand = (brand: string) => {
    setFormData(prev => ({
      ...prev,
      brands_installed: prev.brands_installed.filter(b => b !== brand)
    }));
  };

  const addServiceBrand = () => {
    if (serviceInput.trim()) {
      setFormData(prev => ({
        ...prev,
        brands_serviced: [...prev.brands_serviced, serviceInput.trim()]
      }));
      setServiceInput("");
    }
  };

  const removeServiceBrand = (brand: string) => {
    setFormData(prev => ({
      ...prev,
      brands_serviced: prev.brands_serviced.filter(b => b !== brand)
    }));
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      toast({
        title: "Validation Error",
        description: "Company name is required",
        variant: "destructive",
      });
      return;
    }

    // Build service areas from selected cities
    const serviceAreas: string[] = [];
    citiesByCounty.forEach((cities) => {
      cities.forEach(city => {
        if (selectedCities.includes(city.id)) {
          serviceAreas.push(`${city.name}, ${city.state_code}`);
        }
      });
    });

    const { error } = await supabase
      .from("companies")
      .insert([{
        ...formData,
        service_areas: serviceAreas,
        services_provided: formData.services_provided,
        brands_installed: formData.brands_installed,
        brands_serviced: formData.brands_serviced,
        affiliations: formData.affiliations,
      }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create company",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Company created successfully",
      });
      navigate("/admin/companies/active");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Add New Company</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>Basic company details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter company name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_address">Company Address</Label>
              <Input
                id="company_address"
                value={formData.company_address}
                onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                placeholder="Enter address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_city">City</Label>
              <Input
                id="company_city"
                value={formData.company_city}
                onChange={(e) => setFormData({ ...formData, company_city: e.target.value })}
                placeholder="Enter city"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_state">State</Label>
              <Input
                id="company_state"
                value={formData.company_state}
                onChange={(e) => setFormData({ ...formData, company_state: e.target.value })}
                placeholder="Enter state"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_zip_code">Zip Code</Label>
              <Input
                id="company_zip_code"
                value={formData.company_zip_code}
                onChange={(e) => setFormData({ ...formData, company_zip_code: e.target.value })}
                placeholder="Enter zip code"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_phone">Company Phone</Label>
              <Input
                id="company_phone"
                value={formData.company_phone}
                onChange={(e) => setFormData({ ...formData, company_phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_email_primary">Primary Email</Label>
              <Input
                id="company_email_primary"
                type="email"
                value={formData.company_email_primary}
                onChange={(e) => setFormData({ ...formData, company_email_primary: e.target.value })}
                placeholder="Enter email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_support_email">Support Email</Label>
              <Input
                id="company_support_email"
                type="email"
                value={formData.company_support_email}
                onChange={(e) => setFormData({ ...formData, company_support_email: e.target.value })}
                placeholder="Enter support email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">Company Logo</Label>
            <div className="flex items-center gap-4">
              {formData.logo_url && (
                <img
                  src={formData.logo_url}
                  alt="Logo preview"
                  className="w-16 h-16 object-contain border rounded"
                />
              )}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Logo
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Point of Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="poc_first_name">First Name</Label>
              <Input
                id="poc_first_name"
                value={formData.poc_first_name}
                onChange={(e) => setFormData({ ...formData, poc_first_name: e.target.value })}
                placeholder="Enter first name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="poc_last_name">Last Name</Label>
              <Input
                id="poc_last_name"
                value={formData.poc_last_name}
                onChange={(e) => setFormData({ ...formData, poc_last_name: e.target.value })}
                placeholder="Enter last name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="poc_phone">Phone</Label>
              <Input
                id="poc_phone"
                value={formData.poc_phone}
                onChange={(e) => setFormData({ ...formData, poc_phone: e.target.value })}
                placeholder="Enter phone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="poc_email">Email</Label>
              <Input
                id="poc_email"
                type="email"
                value={formData.poc_email}
                onChange={(e) => setFormData({ ...formData, poc_email: e.target.value })}
                placeholder="Enter email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="poc_title">Title</Label>
              <Input
                id="poc_title"
                value={formData.poc_title}
                onChange={(e) => setFormData({ ...formData, poc_title: e.target.value })}
                placeholder="Enter title"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Secondary Point of Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="secondary_poc_first_name">First Name</Label>
              <Input
                id="secondary_poc_first_name"
                value={formData.secondary_poc_first_name}
                onChange={(e) => setFormData({ ...formData, secondary_poc_first_name: e.target.value })}
                placeholder="Enter first name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary_poc_last_name">Last Name</Label>
              <Input
                id="secondary_poc_last_name"
                value={formData.secondary_poc_last_name}
                onChange={(e) => setFormData({ ...formData, secondary_poc_last_name: e.target.value })}
                placeholder="Enter last name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary_poc_phone">Phone</Label>
              <Input
                id="secondary_poc_phone"
                value={formData.secondary_poc_phone}
                onChange={(e) => setFormData({ ...formData, secondary_poc_phone: e.target.value })}
                placeholder="Enter phone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary_poc_email">Email</Label>
              <Input
                id="secondary_poc_email"
                type="email"
                value={formData.secondary_poc_email}
                onChange={(e) => setFormData({ ...formData, secondary_poc_email: e.target.value })}
                placeholder="Enter email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary_poc_title">Title</Label>
              <Input
                id="secondary_poc_title"
                value={formData.secondary_poc_title}
                onChange={(e) => setFormData({ ...formData, secondary_poc_title: e.target.value })}
                placeholder="Enter title"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Company Profile - Services Provided</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {SERVICES.map((service) => (
              <div key={service} className="flex items-center space-x-2">
                <Checkbox
                  id={service}
                  checked={formData.services_provided.includes(service)}
                  onCheckedChange={() => toggleService(service)}
                />
                <Label htmlFor={service} className="cursor-pointer">{service}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Company Service Area</CardTitle>
          <CardDescription>Select states and counties where the company provides services</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* State Selection */}
          <div className="space-y-2">
            <Label>Select your State/s you Operate In</Label>
            <Select
              value=""
              onValueChange={(stateCode) => {
                if (!selectedStates.includes(stateCode)) {
                  setSelectedStates(prev => [...prev, stateCode]);
                  setExpandedStates(prev => new Set([...prev, stateCode]));
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select states..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] bg-background z-50">
                {availableStates.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    Loading states...
                  </div>
                ) : (
                  availableStates.map((state) => (
                    <SelectItem 
                      key={state.code} 
                      value={state.code}
                      disabled={selectedStates.includes(state.code)}
                    >
                      {state.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            
            {selectedStates.length > 0 && (
              <div className="text-sm text-muted-foreground">
                You Choose: {selectedStates.map(code => availableStates.find(s => s.code === code)?.name).join(", ")}
              </div>
            )}
          </div>

          {/* County Selection by State */}
          {selectedStates.length > 0 && (
            <div className="space-y-2">
              <Label>Select your "Counties" you Operate In Per Selected "State"</Label>
              <div className="space-y-3 border rounded-lg p-4">
                {selectedStates.map((stateCode) => {
                  const state = availableStates.find(s => s.code === stateCode);
                  const counties = countiesByState.get(stateCode) || [];
                  const isExpanded = expandedStates.has(stateCode);
                  
                  return (
                    <Collapsible
                      key={stateCode}
                      open={isExpanded}
                      onOpenChange={() => toggleStateExpanded(stateCode)}
                    >
                      <div className="space-y-2">
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className="flex items-center justify-between w-full p-2 bg-muted rounded hover:bg-muted/80"
                          >
                            <span className="font-medium">{state?.name}</span>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent className="space-y-1 pl-4">
                          {counties.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-2">No counties available</p>
                          ) : (
                            counties.map((county) => (
                              <div key={county} className="flex items-center space-x-2 py-1">
                                <Checkbox
                                  id={`county-${stateCode}-${county}`}
                                  checked={selectedCounties.includes(county)}
                                  onCheckedChange={() => toggleCounty(county)}
                                />
                                <label
                                  htmlFor={`county-${stateCode}-${county}`}
                                  className="text-sm cursor-pointer flex-1"
                                >
                                  {county}
                                </label>
                              </div>
                            ))
                          )}
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            </div>
          )}

          {/* City Selection by County */}
          {selectedCounties.length > 0 && (
            <div className="space-y-2">
              <Label>Select your "Cities/Townships" you Operate In Per Selected "County"</Label>
              <div className="space-y-3 border rounded-lg p-4">
                {selectedCounties.map((county) => {
                  const cities = citiesByCounty.get(county) || [];
                  const isExpanded = expandedCounties.has(county);
                  const selectedCitiesInCounty = cities.filter(c => selectedCities.includes(c.id)).length;
                  const stateCode = cities[0]?.state_code || '';
                  
                  return (
                    <Collapsible
                      key={county}
                      open={isExpanded}
                      onOpenChange={() => toggleCountyExpanded(county)}
                    >
                      <div className="space-y-2">
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className="flex items-center justify-between w-full p-2 bg-muted rounded hover:bg-muted/80"
                          >
                            <span className="font-medium">
                              {county}, {stateCode} ({cities.length} Cities/Townships Listed)
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent className="space-y-1 pl-4">
                          <div className="border rounded p-3 bg-background min-h-[100px]">
                            {cities.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No cities available</p>
                            ) : (
                              <div className="space-y-1">
                                {cities.map((city) => (
                                  <div key={city.id} className="flex items-center space-x-2 py-1">
                                    <Checkbox
                                      id={`city-${city.id}`}
                                      checked={selectedCities.includes(city.id)}
                                      onCheckedChange={() => toggleCity(city.id)}
                                    />
                                    <label
                                      htmlFor={`city-${city.id}`}
                                      className="text-sm cursor-pointer flex-1"
                                    >
                                      {city.name}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            )}
                            {selectedCitiesInCounty > 0 && (
                              <div className="text-right text-sm text-muted-foreground mt-2 pt-2 border-t">
                                {selectedCitiesInCounty} Cities/Townships Selected
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Brands You Install</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={brandInput}
              onChange={(e) => setBrandInput(e.target.value)}
              placeholder="Enter brand name"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBrand())}
            />
            <Button type="button" onClick={addBrand}>Add Brand</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.brands_installed.map((brand) => (
              <div key={brand} className="flex items-center gap-2 bg-secondary px-3 py-1 rounded-md">
                <span>{brand}</span>
                <button
                  type="button"
                  onClick={() => removeBrand(brand)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Brands You Service</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={serviceInput}
              onChange={(e) => setServiceInput(e.target.value)}
              placeholder="Enter brand name"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addServiceBrand())}
            />
            <Button type="button" onClick={addServiceBrand}>Add Brand</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.brands_serviced.map((brand) => (
              <div key={brand} className="flex items-center gap-2 bg-secondary px-3 py-1 rounded-md">
                <span>{brand}</span>
                <button
                  type="button"
                  onClick={() => removeServiceBrand(brand)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Who are you Affiliated with?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bbb">BBB</Label>
              <Input
                id="bbb"
                type="url"
                value={formData.affiliations.bbb}
                onChange={(e) => setFormData({ ...formData, affiliations: { ...formData.affiliations, bbb: e.target.value } })}
                placeholder="Enter URL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                type="url"
                value={formData.affiliations.facebook}
                onChange={(e) => setFormData({ ...formData, affiliations: { ...formData.affiliations, facebook: e.target.value } })}
                placeholder="Enter URL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="angies_list">Angies List</Label>
              <Input
                id="angies_list"
                type="url"
                value={formData.affiliations.angies_list}
                onChange={(e) => setFormData({ ...formData, affiliations: { ...formData.affiliations, angies_list: e.target.value } })}
                placeholder="Enter URL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                type="url"
                value={formData.affiliations.instagram}
                onChange={(e) => setFormData({ ...formData, affiliations: { ...formData.affiliations, instagram: e.target.value } })}
                placeholder="Enter URL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="google">Google</Label>
              <Input
                id="google"
                type="url"
                value={formData.affiliations.google}
                onChange={(e) => setFormData({ ...formData, affiliations: { ...formData.affiliations, google: e.target.value } })}
                placeholder="Enter URL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tiktok">TikTok</Label>
              <Input
                id="tiktok"
                type="url"
                value={formData.affiliations.tiktok}
                onChange={(e) => setFormData({ ...formData, affiliations: { ...formData.affiliations, tiktok: e.target.value } })}
                placeholder="Enter URL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="yelp">Yelp</Label>
              <Input
                id="yelp"
                type="url"
                value={formData.affiliations.yelp}
                onChange={(e) => setFormData({ ...formData, affiliations: { ...formData.affiliations, yelp: e.target.value } })}
                placeholder="Enter URL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextdoor">NextDoor</Label>
              <Input
                id="nextdoor"
                type="url"
                value={formData.affiliations.nextdoor}
                onChange={(e) => setFormData({ ...formData, affiliations: { ...formData.affiliations, nextdoor: e.target.value } })}
                placeholder="Enter URL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="yahoo">Yahoo</Label>
              <Input
                id="yahoo"
                type="url"
                value={formData.affiliations.yahoo}
                onChange={(e) => setFormData({ ...formData, affiliations: { ...formData.affiliations, yahoo: e.target.value } })}
                placeholder="Enter URL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="youtube">YouTube</Label>
              <Input
                id="youtube"
                type="url"
                value={formData.affiliations.youtube}
                onChange={(e) => setFormData({ ...formData, affiliations: { ...formData.affiliations, youtube: e.target.value } })}
                placeholder="Enter URL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bing">Bing</Label>
              <Input
                id="bing"
                type="url"
                value={formData.affiliations.bing}
                onChange={(e) => setFormData({ ...formData, affiliations: { ...formData.affiliations, bing: e.target.value } })}
                placeholder="Enter URL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manta">Manta</Label>
              <Input
                id="manta"
                type="url"
                value={formData.affiliations.manta}
                onChange={(e) => setFormData({ ...formData, affiliations: { ...formData.affiliations, manta: e.target.value } })}
                placeholder="Enter URL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="houzz">Houzz</Label>
              <Input
                id="houzz"
                type="url"
                value={formData.affiliations.houzz}
                onChange={(e) => setFormData({ ...formData, affiliations: { ...formData.affiliations, houzz: e.target.value } })}
                placeholder="Enter URL"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inventory_parts">Parts</Label>
            <Input
              id="inventory_parts"
              value={formData.inventory_parts}
              onChange={(e) => setFormData({ ...formData, inventory_parts: e.target.value })}
              placeholder="Enter parts information"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inventory_equipment">Equipment</Label>
            <Input
              id="inventory_equipment"
              value={formData.inventory_equipment}
              onChange={(e) => setFormData({ ...formData, inventory_equipment: e.target.value })}
              placeholder="Enter equipment information"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inventory_locations">Locations</Label>
            <Input
              id="inventory_locations"
              value={formData.inventory_locations}
              onChange={(e) => setFormData({ ...formData, inventory_locations: e.target.value })}
              placeholder="Enter locations information"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_active: checked })
              }
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_order">Display Order</Label>
            <Input
              id="display_order"
              type="number"
              value={formData.display_order}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  display_order: parseInt(e.target.value) || 0,
                })
              }
              placeholder="0"
            />
          </div>

          <Button onClick={handleSave} className="w-full">Create Company</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompaniesAdd;
