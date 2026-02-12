import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Wrench, Settings, Building2, Droplet } from "lucide-react";

function TypesList({ types, icon: Icon, emptyMessage }: { types: string[]; icon: React.ComponentType<{ className?: string }>; emptyMessage: string }) {
  if (types.length === 0) {
    return (
      <div className="text-center py-8">
        <Icon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const grouped = types.reduce((acc, type) => {
    const letter = type.charAt(0).toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(type);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        <Badge variant="secondary">{types.length} total</Badge>
        <Badge variant="outline">{Object.keys(grouped).length} categories</Badge>
      </div>
      {Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([letter, items]) => (
          <div key={letter} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-primary">{letter}</span>
              <Badge variant="outline" className="text-xs">{items.length}</Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {items.sort().map((type, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                  <Icon className="w-3 h-3 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate" title={type}>{type}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

export default function PlumbingTabbed() {
  const { companyId } = useParams<{ companyId: string }>();

  const { data: company, isLoading } = useQuery({
    queryKey: ["company-plumbing-tabbed", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, plumbing_equipment_install, plumbing_equipment_service, plumbing_equipment_repair")
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

  const typesInstall = Array.isArray(company.plumbing_equipment_install) ? company.plumbing_equipment_install as string[] : [];
  const typesService = Array.isArray(company.plumbing_equipment_service) ? company.plumbing_equipment_service as string[] : [];
  const typesRepair = Array.isArray(company.plumbing_equipment_repair) ? company.plumbing_equipment_repair as string[] : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Plumbing Configuration</h2>
        <p className="text-muted-foreground">Manage plumbing equipment types for {company.name}</p>
      </div>

      <Tabs defaultValue="types-install" className="w-full">
        <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted p-1">
          <TabsTrigger value="types-install" className="flex-1 min-w-[120px]">
            Types Install ({typesInstall.length})
          </TabsTrigger>
          <TabsTrigger value="types-service" className="flex-1 min-w-[120px]">
            Types Service ({typesService.length})
          </TabsTrigger>
          <TabsTrigger value="types-repair" className="flex-1 min-w-[120px]">
            Types Repair ({typesRepair.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="types-install">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Package className="w-5 h-5" /> Types We Install</CardTitle></CardHeader><CardContent><TypesList types={typesInstall} icon={Package} emptyMessage="No install types selected." /></CardContent></Card>
        </TabsContent>
        <TabsContent value="types-service">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Wrench className="w-5 h-5" /> Types We Service</CardTitle></CardHeader><CardContent><TypesList types={typesService} icon={Wrench} emptyMessage="No service types selected." /></CardContent></Card>
        </TabsContent>
        <TabsContent value="types-repair">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5" /> Types We Repair</CardTitle></CardHeader><CardContent><TypesList types={typesRepair} icon={Settings} emptyMessage="No repair types selected." /></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
