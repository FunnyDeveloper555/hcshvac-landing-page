import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, MapPin, Award, Wrench, Settings, Building2 } from "lucide-react";

// Reusable brand list renderer
function BrandsList({ brands, icon: Icon, emptyMessage }: { brands: string[]; icon: React.ComponentType<{ className?: string }>; emptyMessage: string }) {
  if (brands.length === 0) {
    return (
      <div className="text-center py-8">
        <Icon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const grouped = brands.reduce((acc, brand) => {
    const letter = brand.charAt(0).toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(brand);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        <Badge variant="secondary">{brands.length} total</Badge>
        <Badge variant="outline">{Object.keys(grouped).length} categories</Badge>
      </div>
      {Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([letter, items]) => (
          <div key={letter} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-primary">{letter}</span>
              <Badge variant="secondary" className="text-xs">{items.length}</Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {items.sort().map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                  <Icon className="w-3 h-3 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate" title={item}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

// Areas renderer with state grouping
function AreasList({ areas }: { areas: string[] }) {
  if (areas.length === 0) {
    return (
      <div className="text-center py-8">
        <MapPin className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">No service areas registered yet.</p>
      </div>
    );
  }

  const grouped = areas.reduce((acc, area) => {
    const parts = area.split(", ");
    const state = parts[parts.length - 1] || "Other";
    if (!acc[state]) acc[state] = [];
    acc[state].push(area);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Badge variant="secondary">{areas.length} areas</Badge>
        <Badge variant="outline">{Object.keys(grouped).length} states</Badge>
      </div>
      <Accordion type="multiple" className="w-full">
        {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([state, stateAreas]) => (
          <AccordionItem key={state} value={state}>
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="font-semibold">{state}</span>
                <Badge variant="secondary">{stateAreas.length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pt-2">
                {stateAreas.sort().map((area, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                    <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">{area.replace(`, ${state}`, "")}</span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

export default function HvacTabbed() {
  const { companyId } = useParams<{ companyId: string }>();

  const { data: company, isLoading } = useQuery({
    queryKey: ["company-hvac-tabbed", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, service_areas, hvac_brands_install, hvac_brands_service, hvac_brands_repair, hvac_equipment_install, hvac_equipment_service, hvac_equipment_repair")
        .eq("id", companyId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-20">
        <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Company Not Found</h2>
      </div>
    );
  }

  const areas = Array.isArray(company.service_areas) ? company.service_areas as string[] : [];
  const brandsInstall = Array.isArray(company.hvac_brands_install) ? company.hvac_brands_install as string[] : [];
  const brandsService = Array.isArray(company.hvac_brands_service) ? company.hvac_brands_service as string[] : [];
  const brandsRepair = Array.isArray(company.hvac_brands_repair) ? company.hvac_brands_repair as string[] : [];
  const equipInstall = Array.isArray(company.hvac_equipment_install) ? company.hvac_equipment_install as string[] : [];
  const equipService = Array.isArray(company.hvac_equipment_service) ? company.hvac_equipment_service as string[] : [];
  const equipRepair = Array.isArray(company.hvac_equipment_repair) ? company.hvac_equipment_repair as string[] : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">HVAC Configuration</h2>
        <p className="text-muted-foreground">Manage HVAC service areas, brands, and equipment for {company.name}</p>
      </div>

      <Tabs defaultValue="areas" className="w-full">
        <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted p-1">
          <TabsTrigger value="areas" className="flex-1 min-w-[100px]">
            Areas ({areas.length})
          </TabsTrigger>
          <TabsTrigger value="brands-install" className="flex-1 min-w-[100px]">
            Brands Install ({brandsInstall.length})
          </TabsTrigger>
          <TabsTrigger value="brands-service" className="flex-1 min-w-[100px]">
            Brands Service ({brandsService.length})
          </TabsTrigger>
          <TabsTrigger value="brands-repair" className="flex-1 min-w-[100px]">
            Brands Repair ({brandsRepair.length})
          </TabsTrigger>
          <TabsTrigger value="equip-install" className="flex-1 min-w-[100px]">
            Equip. Install ({equipInstall.length})
          </TabsTrigger>
          <TabsTrigger value="equip-service" className="flex-1 min-w-[100px]">
            Equip. Service ({equipService.length})
          </TabsTrigger>
          <TabsTrigger value="equip-repair" className="flex-1 min-w-[100px]">
            Equip. Repair ({equipRepair.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="areas">
          <Card><CardHeader><CardTitle>Areas We Service</CardTitle></CardHeader><CardContent><AreasList areas={areas} /></CardContent></Card>
        </TabsContent>
        <TabsContent value="brands-install">
          <Card><CardHeader><CardTitle>Brands We Install</CardTitle></CardHeader><CardContent><BrandsList brands={brandsInstall} icon={Award} emptyMessage="No install brands selected." /></CardContent></Card>
        </TabsContent>
        <TabsContent value="brands-service">
          <Card><CardHeader><CardTitle>Brands We Service</CardTitle></CardHeader><CardContent><BrandsList brands={brandsService} icon={Wrench} emptyMessage="No service brands selected." /></CardContent></Card>
        </TabsContent>
        <TabsContent value="brands-repair">
          <Card><CardHeader><CardTitle>Brands We Repair</CardTitle></CardHeader><CardContent><BrandsList brands={brandsRepair} icon={Settings} emptyMessage="No repair brands selected." /></CardContent></Card>
        </TabsContent>
        <TabsContent value="equip-install">
          <Card><CardHeader><CardTitle>Equipment We Install</CardTitle></CardHeader><CardContent><BrandsList brands={equipInstall} icon={Award} emptyMessage="No install equipment selected." /></CardContent></Card>
        </TabsContent>
        <TabsContent value="equip-service">
          <Card><CardHeader><CardTitle>Equipment We Service</CardTitle></CardHeader><CardContent><BrandsList brands={equipService} icon={Wrench} emptyMessage="No service equipment selected." /></CardContent></Card>
        </TabsContent>
        <TabsContent value="equip-repair">
          <Card><CardHeader><CardTitle>Equipment We Repair</CardTitle></CardHeader><CardContent><BrandsList brands={equipRepair} icon={Settings} emptyMessage="No repair equipment selected." /></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
