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
      setLoading(true);
      try {
        // Fetch all cities to get unique states
        // We'll paginate through all results
        let allCities: { state: string; state_code: string }[] = [];
        let hasMore = true;
        let page = 0;
        const pageSize = 1000;
        
        while (hasMore) {
          const { data, error } = await supabase
            .from('cities')
            .select('state, state_code')
            .range(page * pageSize, (page + 1) * pageSize - 1);
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            allCities = [...allCities, ...data];
            page++;
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }
        
        // Create unique states map
        const statesMap = new Map<string, { code: string; name: string }>();
        allCities.forEach(city => {
          if (!statesMap.has(city.state_code)) {
            statesMap.set(city.state_code, {
              code: city.state_code,
              name: city.state
            });
          }
        });
        
        const uniqueStates = Array.from(statesMap.values())
          .sort((a, b) => a.name.localeCompare(b.name));
        
        setAvailableStates(uniqueStates);
      } catch (error) {
        console.error('Error loading states:', error);
        toast({
          title: "Error",
          description: "Failed to load states",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
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
        // Fetch all counties for selected states with pagination
        let allCounties: { county: string | null; state_code: string }[] = [];
        let hasMore = true;
        let page = 0;
        const pageSize = 1000;
        
        while (hasMore) {
          const { data, error } = await supabase
            .from('cities')
            .select('county, state_code')
            .in('state_code', selectedStates)
            .not('county', 'is', null)
            .range(page * pageSize, (page + 1) * pageSize - 1);

          if (error) throw error;

          if (data && data.length > 0) {
            allCounties = [...allCounties, ...data];
            page++;
            hasMore = data.length === pageSize;
          } else {
            hasMore = false;
          }
        }

        const countyMap = new Map<string, string[]>();
        allCounties.forEach(item => {
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

  // Calculate business counts for cities using database function
  useEffect(() => {
    const calculateCounts = async () => {
      const counts = new Map<string, number>();
      
      // Collect all city/state combinations
      const allCities = Array.from(citiesByCounty.values()).flat();
      
      if (allCities.length === 0) {
        setBusinessCounts(counts);
        return;
      }

      // Get unique city names and state codes
      const cityNames = [...new Set(allCities.map(city => city.name))];
      const stateCodes = [...new Set(allCities.map(city => city.state_code))];

      try {
        // Use the database function to get counts in a single query
        const { data, error } = await supabase.rpc('get_business_counts_by_cities', {
          city_names: cityNames,
          state_codes: stateCodes
        });

        if (error) {
          console.error('Error fetching business counts:', error);
          return;
        }

        // Create a map of city-state to count
        const countMap = new Map<string, number>();
        if (data) {
          data.forEach((row: { city_name: string; state_code: string; business_count: number }) => {
            const key = `${row.city_name}-${row.state_code}`;
            countMap.set(key, row.business_count);
          });
        }

        // Map counts to city IDs
        allCities.forEach(city => {
          const key = `${city.name}-${city.state_code}`;
          const count = countMap.get(key) || 0;
          counts.set(city.id, count);
        });

        setBusinessCounts(counts);
      } catch (error) {
        console.error('Error calculating business counts:', error);
      }
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
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Local Business</h2>
        <p className="text-sm md:text-base text-muted-foreground">Filter and view businesses by location</p>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Select State</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              {availableStates.length === 0 ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading states...
                </span>
              ) : (
                `Choose states (${availableStates.length} available)`
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            <ScrollArea className="h-[250px] md:h-[400px] pr-2 md:pr-4">
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
                      className="text-xs md:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
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
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Select Counties</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              {selectedStates.length > 0
                ? "Choose counties from selected states"
                : "Select states first"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            <ScrollArea className="h-[250px] md:h-[400px] pr-2 md:pr-4">
              {selectedStates.length === 0 ? (
                <p className="text-xs md:text-sm text-muted-foreground">No states selected</p>
              ) : (
                <div className="space-y-3 md:space-y-4">
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
                          <span className="text-sm md:text-base font-medium">{state?.name}</span>
                          {expandedStates.has(stateCode) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-2 mt-2 ml-2 md:ml-4">
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
                                className="text-xs md:text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
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
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Select Cities</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              {selectedCounties.length > 0
                ? `${selectedCities.length} cities selected`
                : "Select counties first"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
            <ScrollArea className="h-[250px] md:h-[400px] pr-2 md:pr-4">
              {selectedCounties.length === 0 ? (
                <p className="text-xs md:text-sm text-muted-foreground">No counties selected</p>
              ) : (
                <div className="space-y-3 md:space-y-4">
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
                            <span className="text-sm md:text-base font-medium">{county}</span>
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
                        <CollapsibleContent className="space-y-2 mt-2 ml-2 md:ml-4">
                          {cities.map(city => {
                            const count = businessCounts.get(city.id) || 0;
                            return (
                              <div key={city.id} className="flex items-center justify-between space-x-2">
                                <div className="flex items-center space-x-2 flex-1 min-w-0">
                                  <Checkbox
                                    id={`city-${city.id}`}
                                    checked={selectedCities.includes(city.id)}
                                    onCheckedChange={() => toggleCity(city.id)}
                                  />
                                  <label
                                    htmlFor={`city-${city.id}`}
                                    className="text-xs md:text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1 truncate"
                                  >
                                    {city.name}
                                  </label>
                                </div>
                                <Badge variant="secondary" className="text-xs shrink-0">
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
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg flex-wrap">
            <Building2 className="h-4 w-4 md:h-5 md:w-5" />
            Businesses
            {businesses.length > 0 && (
              <Badge variant="secondary" className="text-xs">{businesses.length} found</Badge>
            )}
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading businesses...
              </span>
            ) : selectedCities.length === 0 ? (
              "Select cities to view businesses"
            ) : (
              `Showing businesses from selected locations`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
          {loading ? (
            <div className="flex items-center justify-center py-8 md:py-12">
              <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-muted-foreground" />
            </div>
          ) : businesses.length === 0 ? (
            <p className="text-center text-xs md:text-sm text-muted-foreground py-8 md:py-12">
              {selectedCities.length === 0
                ? "No cities selected"
                : "No businesses found in selected locations"}
            </p>
          ) : (
            <ScrollArea className="h-[400px] md:h-[600px]">
              <div className="space-y-3 md:space-y-4 pr-2 md:pr-4">
                {businesses.map(business => (
                  <Card key={business.id}>
                    <CardContent className="p-3 md:p-6">
                      <div className="space-y-2 md:space-y-3">
                        <div>
                          <h3 className="font-semibold text-sm md:text-lg leading-tight">
                            {business.company_name || "Unnamed Business"}
                          </h3>
                          {business.base_category && (
                            <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                              {business.base_category}
                              {business.detailed_category && ` • ${business.detailed_category}`}
                            </p>
                          )}
                        </div>

                        <div className="grid gap-1.5 md:gap-2 text-xs md:text-sm">
                          {business.address && (
                            <div className="flex items-start gap-2">
                              <MapPin className="h-3 w-3 md:h-4 md:w-4 mt-0.5 text-muted-foreground shrink-0" />
                              <span className="break-words">
                                {business.address}
                                {business.city && `, ${business.city}`}
                                {business.state && `, ${business.state}`}
                                {business.zip && ` ${business.zip}`}
                              </span>
                            </div>
                          )}

                          {business.telephone_number && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground shrink-0" />
                              <span>{business.telephone_number}</span>
                            </div>
                          )}

                          {business.web_address && (
                            <div className="flex items-center gap-2 min-w-0">
                              <Globe className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground shrink-0" />
                              <a
                                href={business.web_address}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline truncate"
                              >
                                {business.web_address}
                              </a>
                            </div>
                          )}
                        </div>

                        {(business.sic_2 || business.sic_4) && (
                          <div className="flex gap-1.5 md:gap-2 flex-wrap">
                            {business.sic_2 && (
                              <Badge variant="outline" className="text-xs">SIC-2: {business.sic_2}</Badge>
                            )}
                            {business.sic_4 && (
                              <Badge variant="outline" className="text-xs">SIC-4: {business.sic_4}</Badge>
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
