import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, Check, ChevronsUpDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

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

const CompaniesAdd = () => {
  const [uploading, setUploading] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [citySearch, setCitySearch] = useState("");
  const [cityPopoverOpen, setCityPopoverOpen] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);
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

  useEffect(() => {
    let active = true;
    const q = citySearch.trim();

    if (q.length < 2) {
      setCities([]);
      return;
    }

    const timer = setTimeout(async () => {
      setCitiesLoading(true);
      
      // Build multiple queries to search across all fields
      const { data, error } = await supabase
        .from("cities")
        .select("id, name, state, state_code, county, zip_codes")
        .or(`name.ilike.%${q}%,state_code.ilike.%${q}%,state.ilike.%${q}%,county.ilike.%${q}%,zip_codes.ilike.%${q}%`)
        .order("name")
        .limit(50);

      if (active) {
        if (error) {
          console.error("Error searching cities:", error);
          setCities([]);
        } else {
          console.log(`Found ${data?.length || 0} cities for search: "${q}"`, data?.slice(0, 3));
          const qLower = q.toLowerCase();
          const scored = (data || []).map((c) => {
            const name = c.name.toLowerCase();
            const state = c.state.toLowerCase();
            const stateCode = c.state_code.toLowerCase();
            const county = (c.county || '').toLowerCase();
            const zipCodes = (c.zip_codes || '').toLowerCase();
            let score = 0;
            if (name.startsWith(qLower)) score = 5;
            else if (name.includes(qLower)) score = 4;
            else if (zipCodes.includes(qLower)) score = 3;
            else if (county.includes(qLower)) score = 2;
            else if (state.startsWith(qLower) || stateCode.startsWith(qLower)) score = 1;
            return { c, score };
          });
          scored.sort((a, b) => b.score - a.score || a.c.name.localeCompare(b.c.name));
          setCities(scored.map((s) => s.c));
        }
        setCitiesLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [citySearch]);

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
    const city = cities.find(c => c.id === cityId);
    if (city) {
      const cityLabel = `${city.name}, ${city.state_code}`;
      if (!formData.service_areas.includes(cityLabel)) {
        setFormData(prev => ({
          ...prev,
          service_areas: [...prev.service_areas, cityLabel]
        }));
      }
    }
    setCityPopoverOpen(false);
    setCitySearch("");
  };

  const removeCity = (city: string) => {
    setFormData(prev => ({
      ...prev,
      service_areas: prev.service_areas.filter(a => a !== city)
    }));
  };

  const filteredCities = cities;

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

    const { error } = await supabase
      .from("companies")
      .insert([{
        ...formData,
        services_provided: formData.services_provided,
        service_areas: formData.service_areas,
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
          <CardDescription>Select cities from the database where the company provides services</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Popover open={cityPopoverOpen} onOpenChange={setCityPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={cityPopoverOpen}
                className="w-full justify-between"
              >
                Select cities...
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput 
                  placeholder="Search cities..." 
                  value={citySearch}
                  onValueChange={setCitySearch}
                />
                <CommandList>
                  <CommandEmpty>
                    {citiesLoading ? "Searching..." : "No cities found."}
                  </CommandEmpty>
                  <CommandGroup>
                    {filteredCities.map((city) => {
                      const cityLabel = `${city.name}, ${city.state_code}`;
                      return (
                        <CommandItem
                          key={city.id}
                          value={city.id}
                          onSelect={() => addCity(city.id)}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              formData.service_areas.includes(cityLabel)
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          />
                          {city.name}, {city.state_code}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          
          <div className="flex flex-wrap gap-2">
            {formData.service_areas.map((city) => (
              <Badge key={city} variant="secondary" className="px-3 py-1">
                {city}
                <button
                  type="button"
                  onClick={() => removeCity(city)}
                  className="ml-2 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
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
