import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MapPin, Building2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

interface Company {
  id: string;
  name: string;
  service_areas: string[] | null;
}

export default function AreasService() {
  const { companyId } = useParams<{ companyId: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompany = async () => {
      if (!companyId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("companies")
        .select("id, name, service_areas")
        .eq("id", companyId)
        .single();

      if (error) {
        console.error("Failed to load company data:", error);
        setLoading(false);
        return;
      }

      // Cast service_areas from Json to string[]
      const companyData: Company = {
        id: data.id,
        name: data.name,
        service_areas: data.service_areas as string[] | null,
      };
      
      setCompany(companyData);
      setLoading(false);
    };

    fetchCompany();
  }, [companyId]);

  // Group areas by state
  const groupAreasByState = (areas: string[]): Record<string, string[]> => {
    return areas.reduce((acc, area) => {
      const parts = area.split(", ");
      const state = parts[parts.length - 1] || "Other";
      if (!acc[state]) acc[state] = [];
      acc[state].push(area);
      return acc;
    }, {} as Record<string, string[]>);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Area's We Service</h2>
          <p className="text-muted-foreground">Please select a company from the sidebar to view service areas</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>No Company Selected</CardTitle>
            <CardDescription>Navigate to a company's page builder to manage service areas</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Service areas are configured per company. Select a company from the Page Builder menu to view and manage their service areas.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Company not found</p>
      </div>
    );
  }

  const serviceAreas = company.service_areas || [];
  const areasByState = groupAreasByState(serviceAreas);
  const totalAreas = serviceAreas.length;
  const totalStates = Object.keys(areasByState).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Area's We Service</h2>
        <p className="text-muted-foreground">Service areas registered for {company.name}</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalAreas}</p>
                <p className="text-sm text-muted-foreground">Total Service Areas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary/50 rounded-lg">
                <Building2 className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStates}</p>
                <p className="text-sm text-muted-foreground">States Covered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent/50 rounded-lg">
                <MapPin className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalAreas > 0 ? Math.round(totalAreas / totalStates) : 0}</p>
                <p className="text-sm text-muted-foreground">Avg. Cities per State</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Areas List */}
      <Card>
        <CardHeader>
          <CardTitle>Service Areas by State</CardTitle>
          <CardDescription>
            All service areas registered in the company profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalAreas === 0 ? (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No service areas have been registered yet.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add service areas in the Company Add/Edit form to see them here.
              </p>
            </div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {Object.entries(areasByState)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([state, areas]) => (
                  <AccordionItem key={state} value={state}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="font-semibold">{state}</span>
                        <Badge variant="secondary" className="ml-2">
                          {areas.length} {areas.length === 1 ? "city" : "cities"}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pt-2">
                        {areas
                          .sort((a, b) => a.localeCompare(b))
                          .map((area, index) => {
                            // Remove state from display if it's at the end
                            const displayName = area.replace(`, ${state}`, "");
                            return (
                              <div
                                key={index}
                                className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                              >
                                <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                <span className="text-sm truncate" title={area}>
                                  {displayName}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
