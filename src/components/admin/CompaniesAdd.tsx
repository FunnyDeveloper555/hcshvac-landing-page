import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, ChevronDown, ChevronUp, Plus, FolderOpen } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { THEME_OPTIONS, ThemeStyle } from "@/lib/companyThemes";
import { Textarea } from "@/components/ui/textarea";
import { FileManagerPicker } from "@/components/admin/filemanager/FileManagerPicker";

interface City {
  id: string;
  name: string;
  state: string;
  state_code: string;
  county: string | null;
  zip_codes: string | null;
}

const splitCountyNames = (county: string | null) =>
  county
    ? county.split("/").map((name) => name.trim()).filter(Boolean)
    : [];

interface PartnerCompany {
  name: string;
  url: string;
}

interface Coupon {
  title: string;
  description: string;
  code: string;
}

// HVAC Equipment types from the PDF document
const HVAC_EQUIPMENT_TYPES = [
  "Air Conditioner",
  "Furnace",
  "Hot Water Boiler",
  "Steam Boiler",
  "Water Heater",
  "Tankless Water Heater",
  "Tankless Boiler",
  "Humidifier",
  "Radiant Heating",
  "Water Softener",
  "U.V Light",
  "Dehumidifier",
  "Smart Thermostats",
];

// Plumbing Equipment types
const PLUMBING_EQUIPMENT_TYPES = [
  "Water Heater",
  "Tankless Water Heater",
  "Water Softener",
  "Sump Pump",
  "Sewage Ejector",
  "Garbage Disposal",
  "Water Filtration",
  "Backflow Preventer",
];

// Helper function to generate slug from company name
const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .replace(/^-+|-+$/g, '');
};

const CompaniesAdd = () => {
  const [uploading, setUploading] = useState(false);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedCounties, setSelectedCounties] = useState<Array<{county: string, stateCode: string}>>([]);
  const [availableStates, setAvailableStates] = useState<{code: string, name: string}[]>([]);
  const [availableServices, setAvailableServices] = useState<Array<{ id: string; title: string }>>([]);
  const [availableBrands, setAvailableBrands] = useState<Array<{ id: string; name: string }>>([]);
  const [countiesByState, setCountiesByState] = useState<Map<string, string[]>>(new Map());
  const [citiesByCounty, setCitiesByCounty] = useState<Map<string, City[]>>(new Map());
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set());
  const [expandedCounties, setExpandedCounties] = useState<Set<string>>(new Set());
  // Saved labels are consumed after the selected counties' city rows load.
  // Restoring ids earlier is racy because the dependent city effect can clear them.
  const pendingSavedAreasRef = useRef<string[] | null>(null);
  // True once the saved service areas were successfully mapped back to city selections
  // (or when there is nothing to map). Guards against wiping saved areas on save.
  const [areasHydrated, setAreasHydrated] = useState(false);

  
  // Brand input states
  const [hvacBrandInstallInput, setHvacBrandInstallInput] = useState("");
  const [hvacBrandServiceInput, setHvacBrandServiceInput] = useState("");
  const [hvacBrandRepairInput, setHvacBrandRepairInput] = useState("");
  
  // Partner company input
  const [partnerNameInput, setPartnerNameInput] = useState("");
  const [partnerUrlInput, setPartnerUrlInput] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
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
    website_title: "",
    website_tagline: "",
    website_description: "",
    primary_color: "#0ea5e9",
    hero_image_url: "",
    theme_style: "modern" as ThemeStyle,
    // New fields
    financing_enabled: false,
    financing_provider: "",
    financing_url: "",
    coupons: [] as Coupon[],
    partner_companies: [] as PartnerCompany[],
    hvac_brands_install: [] as string[],
    hvac_brands_service: [] as string[],
    hvac_brands_repair: [] as string[],
    hvac_equipment_install: [] as string[],
    hvac_equipment_service: [] as string[],
    hvac_equipment_repair: [] as string[],
    plumbing_equipment_install: [] as string[],
    plumbing_equipment_service: [] as string[],
    plumbing_equipment_repair: [] as string[],
  });
  const [brandInput, setBrandInput] = useState("");
  const [serviceInput, setServiceInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPickerOpen, setLogoPickerOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditing = !!editId;
  const [loading, setLoading] = useState(false);

  // Load company data when editing
  useEffect(() => {
    const loadCompanyData = async () => {
      if (!editId) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", editId)
        .maybeSingle();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load company data",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (data) {
        const companyData = data as Record<string, unknown>;
        setFormData({
          name: data.name || "",
          slug: (companyData.slug as string) || "",
          company_address: data.company_address || "",
          company_city: data.company_city || "",
          company_state: data.company_state || "",
          company_zip_code: data.company_zip_code || "",
          company_phone: data.company_phone || "",
          company_email_primary: data.company_email_primary || "",
          company_support_email: data.company_support_email || "",
          poc_first_name: data.poc_first_name || "",
          poc_last_name: data.poc_last_name || "",
          poc_phone: data.poc_phone || "",
          poc_email: data.poc_email || "",
          poc_title: data.poc_title || "",
          secondary_poc_first_name: data.secondary_poc_first_name || "",
          secondary_poc_last_name: data.secondary_poc_last_name || "",
          secondary_poc_phone: data.secondary_poc_phone || "",
          secondary_poc_email: data.secondary_poc_email || "",
          secondary_poc_title: data.secondary_poc_title || "",
          display_order: data.display_order || 0,
          is_active: data.is_active ?? true,
          logo_url: data.logo_url || "",
          services_provided: Array.isArray(data.services_provided) ? data.services_provided as string[] : [],
          service_areas: Array.isArray(data.service_areas) ? data.service_areas as string[] : [],
          brands_installed: Array.isArray(data.brands_installed) ? data.brands_installed as string[] : [],
          brands_serviced: Array.isArray(data.brands_serviced) ? data.brands_serviced as string[] : [],
          affiliations: typeof data.affiliations === 'object' && data.affiliations !== null ? {
            bbb: (data.affiliations as Record<string, string>).bbb || "",
            angies_list: (data.affiliations as Record<string, string>).angies_list || "",
            google: (data.affiliations as Record<string, string>).google || "",
            yelp: (data.affiliations as Record<string, string>).yelp || "",
            yahoo: (data.affiliations as Record<string, string>).yahoo || "",
            bing: (data.affiliations as Record<string, string>).bing || "",
            manta: (data.affiliations as Record<string, string>).manta || "",
            houzz: (data.affiliations as Record<string, string>).houzz || "",
            facebook: (data.affiliations as Record<string, string>).facebook || "",
            instagram: (data.affiliations as Record<string, string>).instagram || "",
            tiktok: (data.affiliations as Record<string, string>).tiktok || "",
            nextdoor: (data.affiliations as Record<string, string>).nextdoor || "",
            youtube: (data.affiliations as Record<string, string>).youtube || "",
          } : {
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
          inventory_parts: data.inventory_parts || "",
          inventory_equipment: data.inventory_equipment || "",
          inventory_locations: data.inventory_locations || "",
          website_title: (companyData.website_title as string) || "",
          website_tagline: (companyData.website_tagline as string) || "",
          website_description: (companyData.website_description as string) || "",
          primary_color: (companyData.primary_color as string) || "#0ea5e9",
          hero_image_url: (companyData.hero_image_url as string) || "",
          theme_style: ((companyData.theme_style as string) || "modern") as ThemeStyle,
          // New fields
          financing_enabled: (companyData.financing_enabled as boolean) || false,
          financing_provider: (companyData.financing_provider as string) || "",
          financing_url: (companyData.financing_url as string) || "",
          // Convert legacy coupons to new format if they exist, or use new coupons array
          coupons: Array.isArray(companyData.coupons) && (companyData.coupons as Coupon[]).length > 0
            ? (companyData.coupons as Coupon[])
            : [
                ...(companyData.coupon_1_title ? [{ title: companyData.coupon_1_title as string, description: (companyData.coupon_1_description as string) || '', code: (companyData.coupon_1_code as string) || '' }] : []),
                ...(companyData.coupon_2_title ? [{ title: companyData.coupon_2_title as string, description: (companyData.coupon_2_description as string) || '', code: (companyData.coupon_2_code as string) || '' }] : []),
                ...(companyData.coupon_3_title ? [{ title: companyData.coupon_3_title as string, description: (companyData.coupon_3_description as string) || '', code: (companyData.coupon_3_code as string) || '' }] : []),
              ],
          partner_companies: Array.isArray(companyData.partner_companies) ? companyData.partner_companies as PartnerCompany[] : [],
          hvac_brands_install: Array.isArray(companyData.hvac_brands_install) ? companyData.hvac_brands_install as string[] : [],
          hvac_brands_service: Array.isArray(companyData.hvac_brands_service) ? companyData.hvac_brands_service as string[] : [],
          hvac_brands_repair: Array.isArray(companyData.hvac_brands_repair) ? companyData.hvac_brands_repair as string[] : [],
          hvac_equipment_install: Array.isArray(companyData.hvac_equipment_install) ? companyData.hvac_equipment_install as string[] : [],
          hvac_equipment_service: Array.isArray(companyData.hvac_equipment_service) ? companyData.hvac_equipment_service as string[] : [],
          hvac_equipment_repair: Array.isArray(companyData.hvac_equipment_repair) ? companyData.hvac_equipment_repair as string[] : [],
          plumbing_equipment_install: Array.isArray(companyData.plumbing_equipment_install) ? companyData.plumbing_equipment_install as string[] : [],
          plumbing_equipment_service: Array.isArray(companyData.plumbing_equipment_service) ? companyData.plumbing_equipment_service as string[] : [],
          plumbing_equipment_repair: Array.isArray(companyData.plumbing_equipment_repair) ? companyData.plumbing_equipment_repair as string[] : [],
        });

        // Restore the state / county / city selections from the saved service areas
        const savedAreas = Array.isArray(data.service_areas) ? (data.service_areas as string[]) : [];
        if (savedAreas.length > 0) {
          pendingSavedAreasRef.current = savedAreas;
          // Labels are either "City, ST" (legacy) or "City, County, ST".
          const parsed = savedAreas
            .map((area) => {
              const parts = String(area).split(",").map((p) => p.trim());
              if (parts.length < 2) return null;
              return {
                name: parts[0],
                county: parts.length >= 3 ? parts[parts.length - 2] : null,
                stateCode: parts[parts.length - 1],
              };
            })
            .filter(Boolean) as Array<{ name: string; county: string | null; stateCode: string }>;

          if (parsed.length > 0) {
            const { data: cityRows } = await supabase
              .from("cities")
              .select("id, name, state_code, county")
              .in("state_code", [...new Set(parsed.map((p) => p.stateCode))])
              .in("name", [...new Set(parsed.map((p) => p.name))]);

            const rows = cityRows || [];
            type CityRow = { id: string; name: string; state_code: string; county: string | null };
            const matched: CityRow[] = [];
            const ambiguous: Array<{ p: typeof parsed[number]; candidates: CityRow[] }> = [];

            // Pass 1: resolve labels that map to exactly one city (or carry a county).
            parsed.forEach((p) => {
              const candidates = rows.filter(
                (c) => c.name === p.name && c.state_code === p.stateCode
              );
              if (candidates.length === 0) return;
              const exact = p.county
                ? candidates.find((c) => c.county === p.county)
                : undefined;
              if (exact || candidates.length === 1) {
                const chosen = exact || candidates[0];
                if (!matched.some((m) => m.id === chosen.id)) matched.push(chosen);
              } else {
                ambiguous.push({ p, candidates });
              }
            });

            // Pass 2: for legacy "City, ST" labels that match several counties,
            // only restore a candidate when its county was established by an
            // unambiguous saved city. Never guess: choosing an arbitrary county
            // makes the edit form select cities the company never saved.
            const knownCounties = new Set(
              matched.flatMap((m) =>
                splitCountyNames(m.county).map((county) => `${county}|${m.state_code}`)
              )
            );
            ambiguous.forEach(({ candidates }) => {
              const preferred = candidates.find((c) =>
                splitCountyNames(c.county).some((county) =>
                  knownCounties.has(`${county}|${c.state_code}`)
                )
              );
              if (preferred && !matched.some((m) => m.id === preferred.id)) {
                matched.push(preferred);
              }
            });


            if (matched.length > 0) {
              setSelectedStates([...new Set(matched.map((c) => c.state_code))]);
              const countyKeys = new Set<string>();
              const counties: Array<{ county: string; stateCode: string }> = [];
              matched.forEach((c) => {
                splitCountyNames(c.county).forEach((county) => {
                  const key = `${county}|${c.state_code}`;
                  if (!countyKeys.has(key)) {
                    countyKeys.add(key);
                    counties.push({ county, stateCode: c.state_code });
                  }
                });
              });
              setSelectedCounties(counties);
            }
          }
        } else {

          // Nothing saved yet — selections are authoritative from the start
          setAreasHydrated(true);
        }

      }
      setLoading(false);
    };

    loadCompanyData();
  }, [editId, toast]);


  // Load services, states, and brands on mount
  useEffect(() => {
    const loadServices = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('id, title')
          .eq('is_active', true)
          .order('display_order');
        
        if (error) throw error;
        setAvailableServices(data || []);
      } catch (error) {
        console.error('Error fetching services:', error);
        toast({
          title: "Error",
          description: "Failed to load services",
          variant: "destructive",
        });
      }
    };

    const loadBrands = async () => {
      try {
        const { data, error } = await supabase
          .from('brands')
          .select('id, name')
          .eq('is_active', true)
          .order('name');
        
        if (error) throw error;
        setAvailableBrands(data || []);
      } catch (error) {
        console.error('Error fetching brands:', error);
        toast({
          title: "Error",
          description: "Failed to load brands",
          variant: "destructive",
        });
      }
    };

    const loadStates = async () => {
      try {
        const { data, error } = await supabase.rpc('get_distinct_states');
        if (error) throw error;
        
        const uniqueStates = (data || []).map((s: { state: string; state_code: string }) => ({
          code: s.state_code,
          name: s.state,
        }));
        
        setAvailableStates(uniqueStates);
      } catch (error) {
        console.error("Error loading states:", error);
      }
    };
    
    loadServices();
    loadBrands();
    loadStates();
  }, [toast]);

  // Load counties when states are selected using RPC
  useEffect(() => {
    let cancelled = false;

    const loadCounties = async () => {
      if (selectedStates.length === 0) {
        setCountiesByState(new Map());
        setSelectedCounties([]);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('get_counties_by_states', {
          state_codes: selectedStates
        });

        if (error) throw error;
        if (cancelled) return;

        const newCountiesByState = new Map<string, string[]>();
        (data || []).forEach((item: { county: string; state_code: string }) => {
          const counties = newCountiesByState.get(item.state_code) || [];
          splitCountyNames(item.county).forEach((county) => {
            if (!counties.includes(county)) counties.push(county);
          });
          newCountiesByState.set(item.state_code, counties);
        });

        setCountiesByState(newCountiesByState);
        setSelectedCounties(prev => prev.filter(c => selectedStates.includes(c.stateCode)));
      } catch (error) {
        console.error("Error loading counties:", error);
      }
    };
    loadCounties();
    return () => {
      cancelled = true;
    };
  }, [selectedStates]);

  // Load cities when counties are selected - single batched query
  useEffect(() => {
    let cancelled = false;

    const loadCities = async () => {
      if (selectedCounties.length === 0) {
        setCitiesByCounty(new Map());
        setSelectedCities([]);
        return;
      }

      try {
        const stateCodes = [...new Set(selectedCounties.map(c => c.stateCode))];
        const countyFilters = [...new Set(selectedCounties.map(c => c.county))]
          .map((county) => `county.ilike.%${county}%`)
          .join(",");

        let cityQuery = supabase
          .from("cities")
          .select("id, name, state, state_code, county, zip_codes")
          .in("state_code", stateCodes)
          .order("name");
        if (countyFilters) cityQuery = cityQuery.or(countyFilters);
        const { data, error } = await cityQuery;

        if (error) throw error;
        if (cancelled) return;

        const newCitiesByCounty = new Map<string, City[]>();
        (data || []).forEach(city => {
          if (!city.county) return;
          splitCountyNames(city.county).forEach((county) => {
            const countyKey = `${county}|${city.state_code}`;
            if (selectedCounties.some(c => c.county === county && c.stateCode === city.state_code)) {
              const existing = newCitiesByCounty.get(countyKey) || [];
              if (!existing.some((item) => item.id === city.id)) existing.push(city);
              newCitiesByCounty.set(countyKey, existing);
            }
          });
        });

        setCitiesByCounty(newCitiesByCounty);
        const allAvailableCityIds = Array.from(newCitiesByCounty.values()).flat().map(c => c.id);
        const pendingSavedAreas = pendingSavedAreasRef.current;
        if (pendingSavedAreas) {
          const savedKeys = pendingSavedAreas.map((area) => {
            const parts = String(area).split(",").map((part) => part.trim());
            return {
              name: parts[0],
              county: parts.length >= 3 ? parts[parts.length - 2] : null,
              stateCode: parts[parts.length - 1],
            };
          });
          const restoredIds = (data || [])
            .filter((city) => savedKeys.some((saved) =>
              city.name === saved.name &&
              city.state_code === saved.stateCode &&
              (!saved.county || splitCountyNames(city.county).includes(saved.county))
            ))
            .map((city) => city.id);
          setSelectedCities([...new Set(restoredIds)]);
          pendingSavedAreasRef.current = null;
          setAreasHydrated(true);
        } else {
          setSelectedCities(prev => prev.filter(id => allAvailableCityIds.includes(id)));
        }
      } catch (error) {
        console.error("Error loading cities:", error);
      }
    };
    loadCities();
    return () => {
      cancelled = true;
    };
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

  const toggleService = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      services_provided: prev.services_provided.includes(serviceId)
        ? prev.services_provided.filter(s => s !== serviceId)
        : [...prev.services_provided, serviceId]
    }));
  };

  const toggleCounty = (county: string, stateCode: string) => {
    setSelectedCounties(prev => {
      const exists = prev.some(c => c.county === county && c.stateCode === stateCode);
      if (exists) {
        return prev.filter(c => !(c.county === county && c.stateCode === stateCode));
      } else {
        return [...prev, { county, stateCode }];
      }
    });
  };

  const toggleCity = (cityId: string) => {
    setSelectedCities(prev =>
      prev.includes(cityId)
        ? prev.filter(id => id !== cityId)
        : [...prev, cityId]
    );
  };

  const toggleStateSelection = (stateCode: string) => {
    setSelectedStates(prev => {
      if (prev.includes(stateCode)) {
        return prev.filter(code => code !== stateCode);
      }
      return [...prev, stateCode];
    });

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

  const toggleSelectAllStates = () => {
    const allSelected = availableStates.length > 0 && selectedStates.length === availableStates.length;
    setSelectedStates(allSelected ? [] : availableStates.map(s => s.code));
  };

  const selectAllCountiesForState = (stateCode: string) => {
    const stateCounties = countiesByState.get(stateCode) || [];
    const allSelected = stateCounties.length > 0 && stateCounties.every(county =>
      selectedCounties.some(c => c.county === county && c.stateCode === stateCode)
    );
    if (allSelected) {
      setSelectedCounties(prev => prev.filter(c => c.stateCode !== stateCode));
    } else {
      setSelectedCounties(prev => {
        const withoutState = prev.filter(c => c.stateCode !== stateCode);
        const additions = stateCounties.map(county => ({ county, stateCode }));
        return [...withoutState, ...additions];
      });
    }
  };

  const selectAllCitiesForCounty = (countyKey: string) => {
    const cities = citiesByCounty.get(countyKey) || [];
    const allSelected = cities.length > 0 && cities.every(city => selectedCities.includes(city.id));
    if (allSelected) {
      setSelectedCities(prev => prev.filter(id => !cities.some(c => c.id === id)));
    } else {
      setSelectedCities(prev => Array.from(new Set([...prev, ...cities.map(c => c.id)])));
    }
  };

  // Legacy brand functions (keeping for backwards compatibility)
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

  // New brand management functions for HVAC
  const addHvacBrand = (type: 'install' | 'service' | 'repair') => {
    const inputMap = {
      install: { value: hvacBrandInstallInput, setter: setHvacBrandInstallInput, field: 'hvac_brands_install' as const },
      service: { value: hvacBrandServiceInput, setter: setHvacBrandServiceInput, field: 'hvac_brands_service' as const },
      repair: { value: hvacBrandRepairInput, setter: setHvacBrandRepairInput, field: 'hvac_brands_repair' as const },
    };
    const { value, setter, field } = inputMap[type];
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
      setter("");
    }
  };

  const removeHvacBrand = (type: 'install' | 'service' | 'repair', brand: string) => {
    const fieldMap = {
      install: 'hvac_brands_install' as const,
      service: 'hvac_brands_service' as const,
      repair: 'hvac_brands_repair' as const,
    };
    setFormData(prev => ({
      ...prev,
      [fieldMap[type]]: prev[fieldMap[type]].filter(b => b !== brand)
    }));
  };

  // Equipment type toggle functions
  const toggleEquipment = (category: 'hvac' | 'plumbing', type: 'install' | 'service' | 'repair', equipment: string) => {
    const fieldName = `${category}_equipment_${type}` as keyof typeof formData;
    setFormData(prev => {
      const current = prev[fieldName] as string[];
      return {
        ...prev,
        [fieldName]: current.includes(equipment)
          ? current.filter(e => e !== equipment)
          : [...current, equipment]
      };
    });
  };

  // Partner company functions
  const addPartnerCompany = () => {
    if (partnerNameInput.trim()) {
      setFormData(prev => ({
        ...prev,
        partner_companies: [...prev.partner_companies, { name: partnerNameInput.trim(), url: partnerUrlInput.trim() }]
      }));
      setPartnerNameInput("");
      setPartnerUrlInput("");
    }
  };

  const removePartnerCompany = (index: number) => {
    setFormData(prev => ({
      ...prev,
      partner_companies: prev.partner_companies.filter((_, i) => i !== index)
    }));
  };

  // Coupon management functions
  const addCoupon = () => {
    setFormData(prev => ({
      ...prev,
      coupons: [...prev.coupons, { title: '', description: '', code: '' }]
    }));
  };

  const updateCoupon = (index: number, field: keyof Coupon, value: string) => {
    setFormData(prev => ({
      ...prev,
      coupons: prev.coupons.map((coupon, i) => 
        i === index ? { ...coupon, [field]: value } : coupon
      )
    }));
  };

  const removeCoupon = (index: number) => {
    setFormData(prev => ({
      ...prev,
      coupons: prev.coupons.filter((_, i) => i !== index)
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

    // Build service areas from the current city selection.
    // When the saved areas could not be mapped back to cities (areasHydrated === false)
    // we keep whatever was stored so an edit never silently wipes them.
    let serviceAreas: string[] = formData.service_areas;
    if (areasHydrated || !isEditing) {
      const labels = new Set<string>();

      // State/county changes can occur immediately before Save, before the
      // dependent city-loading effect has pruned selectedCities. Re-read the
      // selected rows and keep only cities that still belong to the current
      // state/county selection so stale IDs can never restore old areas.
      if (selectedCities.length > 0 && selectedStates.length > 0 && selectedCounties.length > 0) {
        const { data: selectedCityRows, error: cityLookupError } = await supabase
          .from("cities")
          .select("id, name, county, state_code")
          .in("id", selectedCities);

        if (cityLookupError) {
          toast({
            title: "Error",
            description: "Failed to validate the selected service areas",
            variant: "destructive",
          });
          return;
        }

        (selectedCityRows || []).forEach((city) => {
          const matchingCounty = splitCountyNames(city.county).find((county) =>
            selectedCounties.some(
              (selected) => selected.county === county && selected.stateCode === city.state_code
            )
          );
          if (!selectedStates.includes(city.state_code) || !matchingCounty) return;

          labels.add(
            matchingCounty
              ? `${city.name}, ${matchingCounty}, ${city.state_code}`
              : `${city.name}, ${city.state_code}`
          );
        });
      }
      serviceAreas = Array.from(labels).sort();
    }


    const companyData = {
      ...formData,
      service_areas: serviceAreas,
      services_provided: formData.services_provided,
      brands_installed: formData.brands_installed,
      brands_serviced: formData.brands_serviced,
      affiliations: formData.affiliations,
      // Cast arrays to JSON for Supabase
      coupons: formData.coupons as unknown as Record<string, unknown>[],
      partner_companies: formData.partner_companies as unknown as Record<string, unknown>[],
      hvac_brands_install: formData.hvac_brands_install,
      hvac_brands_service: formData.hvac_brands_service,
      hvac_brands_repair: formData.hvac_brands_repair,
      hvac_equipment_install: formData.hvac_equipment_install,
      hvac_equipment_service: formData.hvac_equipment_service,
      hvac_equipment_repair: formData.hvac_equipment_repair,
      plumbing_equipment_install: formData.plumbing_equipment_install,
      plumbing_equipment_service: formData.plumbing_equipment_service,
      plumbing_equipment_repair: formData.plumbing_equipment_repair,
    };

    let error;
    let savedCompany: { id: string; service_areas: string[] | null } | null = null;

    if (isEditing && editId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await supabase
        .from("companies")
        .update(companyData as any)
        .eq("id", editId)
        .select("id, service_areas")
        .maybeSingle();
      error = result.error;
      savedCompany = result.data as { id: string; service_areas: string[] | null } | null;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await supabase
        .from("companies")
        .insert([companyData as any]);
      error = result.error;
    }

    if (error || (isEditing && !savedCompany)) {
      toast({
        title: "Error",
        description: error?.message || (isEditing ? "Company update was not saved" : "Failed to create company"),
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: isEditing ? "Company updated successfully" : "Company created successfully",
      });
      navigate("/admin/companies/active");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">{isEditing ? "Edit Company" : "Add New Company"}</h2>
      
      {/* Company Information */}
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
                onChange={(e) => {
                  const newName = e.target.value;
                  setFormData({ 
                    ...formData, 
                    name: newName,
                    slug: formData.slug === '' || formData.slug === generateSlug(formData.name) 
                      ? generateSlug(newName) 
                      : formData.slug
                  });
                }}
                placeholder="Enter company name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Website Subdomain (slug) *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                  placeholder="e.g., bestcomforthvac"
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">.hcshvac.com</span>
              </div>
              {formData.slug && (
                <p className="text-xs text-muted-foreground">
                  Landing page URL: <span className="text-primary font-medium">{formData.slug}.hcshvac.com</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="theme_style">Website Theme</Label>
              <Select
                value={formData.theme_style}
                onValueChange={(value: ThemeStyle) => setFormData({ ...formData, theme_style: value })}
              >
                <SelectTrigger id="theme_style" className="w-full bg-background">
                  <SelectValue placeholder="Select a theme" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {THEME_OPTIONS.map((theme) => (
                    <SelectItem key={theme.value} value={theme.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{theme.label}</span>
                        <span className="text-xs text-muted-foreground">{theme.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <div className="flex-1 flex gap-2">
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLogoPickerOpen(true)}
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Browse Files
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financing Section */}
      <Card>
        <CardHeader>
          <CardTitle>Financing</CardTitle>
          <CardDescription>Configure financing options for customers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="financing_enabled"
              checked={formData.financing_enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, financing_enabled: checked })}
            />
            <Label htmlFor="financing_enabled">Enable Financing Options</Label>
          </div>
          
          {formData.financing_enabled && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="financing_provider">Financing Provider</Label>
                <Input
                  id="financing_provider"
                  value={formData.financing_provider}
                  onChange={(e) => setFormData({ ...formData, financing_provider: e.target.value })}
                  placeholder="e.g., Synchrony, GreenSky"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="financing_url">Financing Application URL</Label>
                <Input
                  id="financing_url"
                  type="url"
                  value={formData.financing_url}
                  onChange={(e) => setFormData({ ...formData, financing_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Points of Contact */}
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

      {/* Services Provided */}
      <Card>
        <CardHeader>
          <CardTitle>Company Profile - Services Provided</CardTitle>
        </CardHeader>
        <CardContent>
          {availableServices.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading services...</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {availableServices.map((service) => (
                <div key={service.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={service.id}
                    checked={formData.services_provided.includes(service.id)}
                    onCheckedChange={() => toggleService(service.id)}
                  />
                  <Label htmlFor={service.id} className="cursor-pointer">{service.title}</Label>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Area */}
      <Card>
        <CardHeader>
          <CardTitle>Company Service Area</CardTitle>
          <CardDescription>Select states and counties where the company provides services</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* State Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Select your State/s you Operate In</Label>
              {availableStates.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAllStates}
                >
                  {selectedStates.length === availableStates.length ? "Clear All" : "Select All"}
                </Button>
              )}
            </div>
            <div className="border rounded-lg p-4">
              {availableStates.length === 0 ? (
                <p className="text-sm text-muted-foreground">Loading states...</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {availableStates.map((state) => (
                    <div key={state.code} className="flex items-center space-x-2">
                      <Checkbox
                        id={`state-${state.code}`}
                        checked={selectedStates.includes(state.code)}
                        onCheckedChange={() => toggleStateSelection(state.code)}
                      />
                      <label
                        htmlFor={`state-${state.code}`}
                        className="text-sm cursor-pointer"
                      >
                        {state.name}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

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
                            <span className="font-medium">{state?.name} ({counties.length} Counties)</span>
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </CollapsibleTrigger>

                        {counties.length > 0 && (
                          <div className="flex justify-end pl-4">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => selectAllCountiesForState(stateCode)}
                            >
                              {counties.every(county => selectedCounties.some(c => c.county === county && c.stateCode === stateCode))
                                ? "Clear All"
                                : "Select All"}
                            </Button>
                          </div>
                        )}
                        
                        <CollapsibleContent className="space-y-1 pl-4">
                          <div className="border rounded p-3 bg-background grid grid-cols-2 md:grid-cols-3 gap-2">
                            {counties.map((county) => (
                              <div key={county} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`county-${stateCode}-${county}`}
                                  checked={selectedCounties.some(c => c.county === county && c.stateCode === stateCode)}
                                  onCheckedChange={() => toggleCounty(county, stateCode)}
                                />
                                <label
                                  htmlFor={`county-${stateCode}-${county}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {county}
                                </label>
                              </div>
                            ))}
                          </div>
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
                {selectedCounties.map((countyObj) => {
                  const countyKey = `${countyObj.county}|${countyObj.stateCode}`;
                  const cities = citiesByCounty.get(countyKey) || [];
                  const isExpanded = expandedCounties.has(countyKey);
                  const selectedCitiesInCounty = cities.filter(c => selectedCities.includes(c.id)).length;
                  
                  return (
                    <Collapsible
                      key={countyKey}
                      open={isExpanded}
                      onOpenChange={() => toggleCountyExpanded(countyKey)}
                    >
                      <div className="space-y-2">
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className="flex items-center justify-between w-full p-2 bg-muted rounded hover:bg-muted/80"
                          >
                            <span className="font-medium">
                              {countyObj.county}, {countyObj.stateCode} ({cities.length} Cities/Townships Listed)
                            </span>
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </CollapsibleTrigger>

                        {cities.length > 0 && (
                          <div className="flex justify-end pl-4">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => selectAllCitiesForCounty(countyKey)}
                            >
                              {cities.every(city => selectedCities.includes(city.id))
                                ? "Clear All"
                                : "Select All"}
                            </Button>
                          </div>
                        )}
                        
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

      {/* HVAC Brands - Install (with checkboxes from brands table) */}
      <Card>
        <CardHeader>
          <CardTitle>Brands We Install (Heating and Cooling)</CardTitle>
          <CardDescription>Select HVAC equipment brands you install from the master list ({formData.hvac_brands_install.length} selected)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {availableBrands.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading brands...</p>
          ) : (
            <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {availableBrands.map((brand) => (
                  <div key={brand.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`brand-install-${brand.id}`}
                      checked={formData.hvac_brands_install.includes(brand.name)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({
                            ...prev,
                            hvac_brands_install: [...prev.hvac_brands_install, brand.name]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            hvac_brands_install: prev.hvac_brands_install.filter(b => b !== brand.name)
                          }));
                        }
                      }}
                    />
                    <label
                      htmlFor={`brand-install-${brand.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {brand.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
          {formData.hvac_brands_install.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <span className="text-sm text-muted-foreground">Selected:</span>
              {formData.hvac_brands_install.map((brand) => (
                <Badge key={brand} variant="secondary" className="px-3 py-1">
                  {brand}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      hvac_brands_install: prev.hvac_brands_install.filter(b => b !== brand)
                    }))}
                    className="ml-2 text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* HVAC Brands - Service (with checkboxes from brands table) */}
      <Card>
        <CardHeader>
          <CardTitle>Brands We Service (Heating and Cooling)</CardTitle>
          <CardDescription>Select HVAC equipment brands you service from the master list ({formData.hvac_brands_service.length} selected)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {availableBrands.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading brands...</p>
          ) : (
            <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {availableBrands.map((brand) => (
                  <div key={brand.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`brand-service-${brand.id}`}
                      checked={formData.hvac_brands_service.includes(brand.name)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({
                            ...prev,
                            hvac_brands_service: [...prev.hvac_brands_service, brand.name]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            hvac_brands_service: prev.hvac_brands_service.filter(b => b !== brand.name)
                          }));
                        }
                      }}
                    />
                    <label
                      htmlFor={`brand-service-${brand.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {brand.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
          {formData.hvac_brands_service.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <span className="text-sm text-muted-foreground">Selected:</span>
              {formData.hvac_brands_service.map((brand) => (
                <Badge key={brand} variant="secondary" className="px-3 py-1">
                  {brand}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      hvac_brands_service: prev.hvac_brands_service.filter(b => b !== brand)
                    }))}
                    className="ml-2 text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* HVAC Brands - Repair (with checkboxes from brands table) */}
      <Card>
        <CardHeader>
          <CardTitle>Brands We Repair (Heating and Cooling)</CardTitle>
          <CardDescription>Select HVAC equipment brands you repair from the master list ({formData.hvac_brands_repair.length} selected)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {availableBrands.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading brands...</p>
          ) : (
            <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {availableBrands.map((brand) => (
                  <div key={brand.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`brand-repair-${brand.id}`}
                      checked={formData.hvac_brands_repair.includes(brand.name)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({
                            ...prev,
                            hvac_brands_repair: [...prev.hvac_brands_repair, brand.name]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            hvac_brands_repair: prev.hvac_brands_repair.filter(b => b !== brand.name)
                          }));
                        }
                      }}
                    />
                    <label
                      htmlFor={`brand-repair-${brand.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {brand.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
          {formData.hvac_brands_repair.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <span className="text-sm text-muted-foreground">Selected:</span>
              {formData.hvac_brands_repair.map((brand) => (
                <Badge key={brand} variant="secondary" className="px-3 py-1">
                  {brand}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      hvac_brands_repair: prev.hvac_brands_repair.filter(b => b !== brand)
                    }))}
                    className="ml-2 text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* HVAC Equipment Types */}
      <Card>
        <CardHeader>
          <CardTitle>HVAC Equipment Types</CardTitle>
          <CardDescription>Select equipment types for Install, Service, and Repair</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="font-semibold">Equipment We Install</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 border rounded-lg p-4">
              {HVAC_EQUIPMENT_TYPES.map((equipment) => (
                <div key={`install-${equipment}`} className="flex items-center space-x-2">
                  <Checkbox
                    id={`hvac-install-${equipment}`}
                    checked={formData.hvac_equipment_install.includes(equipment)}
                    onCheckedChange={() => toggleEquipment('hvac', 'install', equipment)}
                  />
                  <label htmlFor={`hvac-install-${equipment}`} className="text-sm cursor-pointer">
                    {equipment}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">Equipment We Service</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 border rounded-lg p-4">
              {HVAC_EQUIPMENT_TYPES.map((equipment) => (
                <div key={`service-${equipment}`} className="flex items-center space-x-2">
                  <Checkbox
                    id={`hvac-service-${equipment}`}
                    checked={formData.hvac_equipment_service.includes(equipment)}
                    onCheckedChange={() => toggleEquipment('hvac', 'service', equipment)}
                  />
                  <label htmlFor={`hvac-service-${equipment}`} className="text-sm cursor-pointer">
                    {equipment}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">Equipment We Repair</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 border rounded-lg p-4">
              {HVAC_EQUIPMENT_TYPES.map((equipment) => (
                <div key={`repair-${equipment}`} className="flex items-center space-x-2">
                  <Checkbox
                    id={`hvac-repair-${equipment}`}
                    checked={formData.hvac_equipment_repair.includes(equipment)}
                    onCheckedChange={() => toggleEquipment('hvac', 'repair', equipment)}
                  />
                  <label htmlFor={`hvac-repair-${equipment}`} className="text-sm cursor-pointer">
                    {equipment}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plumbing Equipment Types */}
      <Card>
        <CardHeader>
          <CardTitle>Plumbing Equipment Types</CardTitle>
          <CardDescription>Select plumbing equipment types for Install, Service, and Repair</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="font-semibold">Equipment We Install</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 border rounded-lg p-4">
              {PLUMBING_EQUIPMENT_TYPES.map((equipment) => (
                <div key={`plumbing-install-${equipment}`} className="flex items-center space-x-2">
                  <Checkbox
                    id={`plumbing-install-${equipment}`}
                    checked={formData.plumbing_equipment_install.includes(equipment)}
                    onCheckedChange={() => toggleEquipment('plumbing', 'install', equipment)}
                  />
                  <label htmlFor={`plumbing-install-${equipment}`} className="text-sm cursor-pointer">
                    {equipment}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">Equipment We Service</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 border rounded-lg p-4">
              {PLUMBING_EQUIPMENT_TYPES.map((equipment) => (
                <div key={`plumbing-service-${equipment}`} className="flex items-center space-x-2">
                  <Checkbox
                    id={`plumbing-service-${equipment}`}
                    checked={formData.plumbing_equipment_service.includes(equipment)}
                    onCheckedChange={() => toggleEquipment('plumbing', 'service', equipment)}
                  />
                  <label htmlFor={`plumbing-service-${equipment}`} className="text-sm cursor-pointer">
                    {equipment}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">Equipment We Repair</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 border rounded-lg p-4">
              {PLUMBING_EQUIPMENT_TYPES.map((equipment) => (
                <div key={`plumbing-repair-${equipment}`} className="flex items-center space-x-2">
                  <Checkbox
                    id={`plumbing-repair-${equipment}`}
                    checked={formData.plumbing_equipment_repair.includes(equipment)}
                    onCheckedChange={() => toggleEquipment('plumbing', 'repair', equipment)}
                  />
                  <label htmlFor={`plumbing-repair-${equipment}`} className="text-sm cursor-pointer">
                    {equipment}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Home Page Coupons */}
      <Card>
        <CardHeader>
          <CardTitle>Home Page Coupons</CardTitle>
          <CardDescription>Add promotional coupons for your landing page ({formData.coupons.length} added)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.coupons.map((coupon, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Coupon {index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCoupon(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor={`coupon_${index}_title`}>Title</Label>
                  <Input
                    id={`coupon_${index}_title`}
                    value={coupon.title}
                    onChange={(e) => updateCoupon(index, 'title', e.target.value)}
                    placeholder="e.g., $50 OFF"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`coupon_${index}_code`}>Code</Label>
                  <Input
                    id={`coupon_${index}_code`}
                    value={coupon.code}
                    onChange={(e) => updateCoupon(index, 'code', e.target.value)}
                    placeholder="e.g., SAVE50"
                  />
                </div>
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor={`coupon_${index}_description`}>Description</Label>
                  <Input
                    id={`coupon_${index}_description`}
                    value={coupon.description}
                    onChange={(e) => updateCoupon(index, 'description', e.target.value)}
                    placeholder="e.g., Any HVAC Service"
                  />
                </div>
              </div>
            </div>
          ))}
          
          <Button type="button" variant="outline" onClick={addCoupon} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Coupon
          </Button>
          
          {formData.coupons.length === 0 && (
            <p className="text-sm text-muted-foreground text-center">No coupons added yet. Click "Add Coupon" to create one.</p>
          )}
        </CardContent>
      </Card>

      {/* Partner Companies */}
      <Card>
        <CardHeader>
          <CardTitle>Partner Companies</CardTitle>
          <CardDescription>Add partner companies that appear on your landing page (up to 8)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.partner_companies.length < 8 && (
            <div className="flex gap-2">
              <Input
                value={partnerNameInput}
                onChange={(e) => setPartnerNameInput(e.target.value)}
                placeholder="Company name"
                className="flex-1"
              />
              <Input
                value={partnerUrlInput}
                onChange={(e) => setPartnerUrlInput(e.target.value)}
                placeholder="Website URL (optional)"
                className="flex-1"
              />
              <Button type="button" onClick={addPartnerCompany}>
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          )}
          
          {formData.partner_companies.length > 0 && (
            <div className="grid gap-2 md:grid-cols-2">
              {formData.partner_companies.map((partner, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <span className="font-medium">{partner.name}</span>
                    {partner.url && (
                      <span className="text-sm text-muted-foreground ml-2">({partner.url})</span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePartnerCompany(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {formData.partner_companies.length === 0 && (
            <p className="text-sm text-muted-foreground">No partner companies added yet</p>
          )}
        </CardContent>
      </Card>

      {/* Legacy Brands (keeping for backwards compatibility) */}
      <Card>
        <CardHeader>
          <CardTitle>Brands You Install (Legacy)</CardTitle>
          <CardDescription>General brands list - use the new HVAC sections above for better organization</CardDescription>
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
          <CardTitle>Brands You Service (Legacy)</CardTitle>
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

      {/* Affiliations */}
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

      {/* Inventory */}
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

      {/* Status and Actions */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_order">Display Order</Label>
            <Input
              id="display_order"
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>

          <Button onClick={handleSave} className="w-full">{isEditing ? "Update Company" : "Create Company"}</Button>
        </CardContent>
      </Card>
    </div>

      <FileManagerPicker
        open={logoPickerOpen}
        onOpenChange={setLogoPickerOpen}
        accept="image/*"
        title="Select Logo from File Manager"
        onSelect={(fileUrl) => {
          setFormData({ ...formData, logo_url: fileUrl });
        }}
      />
    </>
  );
};

export default CompaniesAdd;
