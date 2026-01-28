import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Settings, Building2 } from "lucide-react";

export default function PlumbingTypesRepair() {
  const { companyId } = useParams<{ companyId: string }>();

  const { data: company, isLoading } = useQuery({
    queryKey: ["company-plumbing-types-repair", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, plumbing_equipment_repair")
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
        <p className="text-muted-foreground">The selected company could not be loaded.</p>
      </div>
    );
  }

  const types = Array.isArray(company.plumbing_equipment_repair) 
    ? company.plumbing_equipment_repair as string[]
    : [];

  // Group types by first letter
  const typesByLetter = types.reduce((acc, type) => {
    const firstLetter = type.charAt(0).toUpperCase();
    if (!acc[firstLetter]) acc[firstLetter] = [];
    acc[firstLetter].push(type);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Plumbing Types We Repair</h2>
        <p className="text-muted-foreground">
          Viewing plumbing equipment types that {company.name} repairs
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{types.length}</p>
              <p className="text-sm text-muted-foreground">Total Types</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{Object.keys(typesByLetter).length}</p>
              <p className="text-sm text-muted-foreground">Categories (A-Z)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Types by Letter */}
      {types.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Types Selected</CardTitle>
            <CardDescription>
              This company has not selected any plumbing equipment types to repair yet.
              Go to Companies → Edit to add types.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Plumbing Types We Repair
            </CardTitle>
            <CardDescription>
              {types.length} equipment types selected for repair
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(typesByLetter)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([letter, letterTypes]) => (
                  <div key={letter} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-primary">{letter}</span>
                      <Badge variant="outline" className="text-xs">
                        {letterTypes.length}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {letterTypes
                        .sort((a, b) => a.localeCompare(b))
                        .map((type, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <Settings className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate" title={type}>
                              {type}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
