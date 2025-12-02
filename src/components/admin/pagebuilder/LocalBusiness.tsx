import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, ChevronDown, ChevronUp, Building2, Phone, Globe, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Business {
  id: string;
  company_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  telephone_number: string | null;
  web_address: string | null;
  sic_2: string | null;
  sic_4: string | null;
  base_category: string | null;
  detailed_category: string | null;
  exact_category: string | null;
}

interface City {
  id: string;
  name: string;
  state: string;
  state_code: string;
  county: string | null;
  zip_codes: string | null;
}

export default function LocalBusiness() {
  const [loading, setLoading] = useState(false);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedCounties, setSelectedCounties] = useState<Array<{county: string, stateCode: string}>>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [availableStates, setAvailableStates] = useState<{code: string, name: string}[]>([]);
  const [countiesByState, setCountiesByState] = useState<Map<string, string[]>>(new Map());
  const [citiesByCounty, setCitiesByCounty] = useState<Map<string, City[]>>(new Map());
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [businessCounts, setBusinessCounts] = useState<Map<string, number>>(new Map());
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set());
  const [expandedCounties, setExpandedCounties] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Load states on mount
  useEffect(() => {
    const loadStates = async () => {
      try {
        // Use RPC or fetch with a high limit to get all unique states
        const { data, error } = await supabase
          .from('cities')
          .select('state, state_code')
          .limit(10000) // Fetch enough records to cover all states
          .order('state');

        if (error) throw error;

        // Create unique states map
        const uniqueStates = Array.from(
          new Map(data?.map(item => [item.state_code, { code: item.state_code, name: item.state }]) || [])
            .values()
        ).sort((a, b) => a.name.localeCompare(b.name));

        setAvailableStates(uniqueStates);
      } catch (error) {
        console.error('Error loading states:', error);
        toast({
          title: "Error",
          description: "Failed to load states",
          variant: "destructive",
        });
      }
    };

    loadStates();
  }, [toast]);

  // Load counties when states are selected
  useEffect(() => {
    if (selectedStates.length === 0) {
      setCountiesByState(new Map());
      return;
    }

    const loadCounties = async () => {
      try {
        const { data, error } = await supabase
          .from('cities')
          .select('county, state_code')
          .in('state_code', selectedStates)
          .not('county', 'is', null)
          .limit(10000); // Fetch enough records to cover all counties

        if (error) throw error;

        const countyMap = new Map<string, string[]>();
        data?.forEach(item => {
          if (item.county) {
            const counties = countyMap.get(item.state_code) || [];
            if (!counties.includes(item.county)) {
              counties.push(item.county);
            }
            countyMap.set(item.state_code, counties.sort());
          }
        });

        setCountiesByState(countyMap);
      } catch (error) {
        console.error('Error loading counties:', error);
      }
    };

    loadCounties();
  }, [selectedStates]);

  // Load cities when counties are selected
  useEffect(() => {
    if (selectedCounties.length === 0) {
      setCitiesByCounty(new Map());
      return;
    }

    const loadCities = async () => {
      try {
        const cityMap = new Map<string, City[]>();
        
        for (const {county, stateCode} of selectedCounties) {
          const { data, error } = await supabase
            .from('cities')
            .select('*')
            .eq('state_code', stateCode)
            .eq('county', county)
            .order('name');

          if (error) throw error;

          const key = `${county}-${stateCode}`;
          cityMap.set(key, data || []);
        }

        setCitiesByCounty(cityMap);
      } catch (error) {
        console.error('Error loading cities:', error);
      }
    };

    loadCities();
  }, [selectedCounties]);

  // Load businesses when cities are selected
  useEffect(() => {
    if (selectedCities.length === 0) {
      setBusinesses([]);
      return;
    }

    const loadBusinesses = async () => {
      setLoading(true);
      try {
        // Get all selected city data with their state information
        const selectedCityData = Array.from(citiesByCounty.values())
          .flat()
          .filter(city => selectedCities.includes(city.id));

        // Fetch businesses for each city-state combination
        const allBusinesses: Business[] = [];
        
        for (const city of selectedCityData) {
          const { data, error } = await supabase
            .from('business')
            .select('*')
            .eq('city', city.name)
            .eq('state', city.state_code)
            .order('company_name');

          if (error) {
            console.error(`Error loading businesses for ${city.name}, ${city.state_code}:`, error);
            continue;
          }

          if (data) {
            allBusinesses.push(...data);
          }
        }

        setBusinesses(allBusinesses);
      } catch (error) {
        console.error('Error loading businesses:', error);
        toast({
          title: "Error",
          description: "Failed to load businesses",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadBusinesses();
  }, [selectedCities, citiesByCounty, toast]);

  // Calculate business counts for cities
  useEffect(() => {
    const calculateCounts = async () => {
      const counts = new Map<string, number>();
      
      for (const cities of citiesByCounty.values()) {
        for (const city of cities) {
          try {
            const { count, error } = await supabase
              .from('business')
              .select('*', { count: 'exact', head: true })
              .eq('city', city.name)
              .eq('state', city.state_code);

            if (!error && count !== null) {
              counts.set(city.id, count);
            }
          } catch (error) {
            console.error('Error counting businesses:', error);
          }
        }
      }
      
      setBusinessCounts(counts);
    };

    if (citiesByCounty.size > 0) {
      calculateCounts();
    }
  }, [citiesByCounty]);

  const toggleStateSelection = (stateCode: string) => {
    setSelectedStates(prev => 
      prev.includes(stateCode)
        ? prev.filter(s => s !== stateCode)
        : [...prev, stateCode]
    );
    // Clear related selections
    setSelectedCounties(prev => prev.filter(c => c.stateCode !== stateCode));
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

  const toggleCountyExpanded = (key: string) => {
    setExpandedCounties(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const toggleCounty = (county: string, stateCode: string) => {
    const exists = selectedCounties.some(
      c => c.county === county && c.stateCode === stateCode
    );

    if (exists) {
      setSelectedCounties(prev =>
        prev.filter(c => !(c.county === county && c.stateCode === stateCode))
      );
      // Clear related city selections
      const key = `${county}-${stateCode}`;
      const citiesToRemove = citiesByCounty.get(key)?.map(c => c.id) || [];
      setSelectedCities(prev => prev.filter(id => !citiesToRemove.includes(id)));
    } else {
      setSelectedCounties(prev => [...prev, { county, stateCode }]);
    }
  };

  const toggleCity = (cityId: string) => {
    setSelectedCities(prev =>
      prev.includes(cityId)
        ? prev.filter(id => id !== cityId)
        : [...prev, cityId]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Local Business</h2>
        <p className="text-muted-foreground">Filter and view businesses by location</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Select State</CardTitle>
            <CardDescription>
              {availableStates.length === 0
                ? "Loading states..."
                : `Choose states to filter businesses (scroll to see all ${availableStates.length} states)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {availableStates.map(state => (
                  <div key={state.code} className="flex items-center space-x-2">
                    <Checkbox
                      id={`state-${state.code}`}
                      checked={selectedStates.includes(state.code)}
                      onCheckedChange={() => toggleStateSelection(state.code)}
                    />
                    <label
                      htmlFor={`state-${state.code}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {state.name}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* County Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Counties</CardTitle>
            <CardDescription>
              {selectedStates.length > 0
                ? "Choose counties from selected states"
                : "Select states first"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              {selectedStates.length === 0 ? (
                <p className="text-sm text-muted-foreground">No states selected</p>
              ) : (
                <div className="space-y-4">
                  {selectedStates.map(stateCode => {
                    const state = availableStates.find(s => s.code === stateCode);
                    const counties = countiesByState.get(stateCode) || [];
                    
                    return (
                      <Collapsible
                        key={stateCode}
                        open={expandedStates.has(stateCode)}
                        onOpenChange={() => toggleStateExpanded(stateCode)}
                      >
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded-md">
                          <span className="font-medium">{state?.name}</span>
                          {expandedStates.has(stateCode) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-2 mt-2 ml-4">
                          {counties.map(county => (
                            <div key={`${county}-${stateCode}`} className="flex items-center space-x-2">
                              <Checkbox
                                id={`county-${county}-${stateCode}`}
                                checked={selectedCounties.some(
                                  c => c.county === county && c.stateCode === stateCode
                                )}
                                onCheckedChange={() => toggleCounty(county, stateCode)}
                              />
                              <label
                                htmlFor={`county-${county}-${stateCode}`}
                                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {county}
                              </label>
                            </div>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* City Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Cities</CardTitle>
            <CardDescription>
              {selectedCounties.length > 0
                ? `${selectedCities.length} cities selected`
                : "Select counties first"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              {selectedCounties.length === 0 ? (
                <p className="text-sm text-muted-foreground">No counties selected</p>
              ) : (
                <div className="space-y-4">
                  {selectedCounties.map(({county, stateCode}) => {
                    const key = `${county}-${stateCode}`;
                    const cities = citiesByCounty.get(key) || [];
                    
                    return (
                      <Collapsible
                        key={key}
                        open={expandedCounties.has(key)}
                        onOpenChange={() => toggleCountyExpanded(key)}
                      >
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted rounded-md">
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{county}</span>
                            <span className="text-xs text-muted-foreground">
                              {cities.length} cities
                            </span>
                          </div>
                          {expandedCounties.has(key) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-2 mt-2 ml-4">
                          {cities.map(city => {
                            const count = businessCounts.get(city.id) || 0;
                            return (
                              <div key={city.id} className="flex items-center justify-between space-x-2">
                                <div className="flex items-center space-x-2 flex-1">
                                  <Checkbox
                                    id={`city-${city.id}`}
                                    checked={selectedCities.includes(city.id)}
                                    onCheckedChange={() => toggleCity(city.id)}
                                  />
                                  <label
                                    htmlFor={`city-${city.id}`}
                                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                  >
                                    {city.name}
                                  </label>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {count}
                                </Badge>
                              </div>
                            );
                          })}
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Business Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Businesses
            {businesses.length > 0 && (
              <Badge variant="secondary">{businesses.length} found</Badge>
            )}
          </CardTitle>
          <CardDescription>
            {loading
              ? "Loading businesses..."
              : selectedCities.length === 0
              ? "Select cities to view businesses"
              : `Showing businesses from selected locations`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : businesses.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              {selectedCities.length === 0
                ? "No cities selected"
                : "No businesses found in selected locations"}
            </p>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {businesses.map(business => (
                  <Card key={business.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {business.company_name || "Unnamed Business"}
                          </h3>
                          {business.base_category && (
                            <p className="text-sm text-muted-foreground">
                              {business.base_category}
                              {business.detailed_category && ` • ${business.detailed_category}`}
                            </p>
                          )}
                        </div>

                        <div className="grid gap-2 text-sm">
                          {business.address && (
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                              <span>
                                {business.address}
                                {business.city && `, ${business.city}`}
                                {business.state && `, ${business.state}`}
                                {business.zip && ` ${business.zip}`}
                              </span>
                            </div>
                          )}

                          {business.telephone_number && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{business.telephone_number}</span>
                            </div>
                          )}

                          {business.web_address && (
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              <a
                                href={business.web_address}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                {business.web_address}
                              </a>
                            </div>
                          )}
                        </div>

                        {(business.sic_2 || business.sic_4) && (
                          <div className="flex gap-2 flex-wrap">
                            {business.sic_2 && (
                              <Badge variant="outline">SIC-2: {business.sic_2}</Badge>
                            )}
                            {business.sic_4 && (
                              <Badge variant="outline">SIC-4: {business.sic_4}</Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
