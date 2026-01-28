import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Award, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Company {
  id: string;
  name: string;
  hvac_brands_install: string[] | null;
}

export default function BrandsInstall() {
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
        .select("id, name, hvac_brands_install")
        .eq("id", companyId)
        .single();

      if (error) {
        console.error("Failed to load company data:", error);
        setLoading(false);
        return;
      }

      const companyData: Company = {
        id: data.id,
        name: data.name,
        hvac_brands_install: data.hvac_brands_install as string[] | null,
      };
      
      setCompany(companyData);
      setLoading(false);
    };

    fetchCompany();
  }, [companyId]);

  // Group brands alphabetically
  const groupBrandsAlphabetically = (brands: string[]): Record<string, string[]> => {
    return brands.reduce((acc, brand) => {
      const firstLetter = brand.charAt(0).toUpperCase();
      if (!acc[firstLetter]) acc[firstLetter] = [];
      acc[firstLetter].push(brand);
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
          <h2 className="text-3xl font-bold tracking-tight">Brands We Install</h2>
          <p className="text-muted-foreground">Please select a company from the sidebar to view installed brands</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>No Company Selected</CardTitle>
            <CardDescription>Navigate to a company's page builder to manage brands</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Brands are configured per company. Select a company from the Page Builder menu to view and manage their installed brands.
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

  const brands = company.hvac_brands_install || [];
  const brandsByLetter = groupBrandsAlphabetically(brands);
  const totalBrands = brands.length;
  const totalLetters = Object.keys(brandsByLetter).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Brands We Install</h2>
        <p className="text-muted-foreground">HVAC brands installed by {company.name}</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Award className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalBrands}</p>
                <p className="text-sm text-muted-foreground">Total Brands</p>
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
                <p className="text-2xl font-bold">{totalLetters}</p>
                <p className="text-sm text-muted-foreground">Brand Categories (A-Z)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Brands List */}
      <Card>
        <CardHeader>
          <CardTitle>Installed Brands</CardTitle>
          <CardDescription>
            All HVAC brands that {company.name} installs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalBrands === 0 ? (
            <div className="text-center py-8">
              <Award className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No brands have been selected yet.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add brands in the Company Add/Edit form to see them here.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(brandsByLetter)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([letter, letterBrands]) => (
                  <div key={letter} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-primary">{letter}</span>
                      <Badge variant="secondary" className="text-xs">
                        {letterBrands.length} {letterBrands.length === 1 ? "brand" : "brands"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                      {letterBrands
                        .sort((a, b) => a.localeCompare(b))
                        .map((brand, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <Award className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate" title={brand}>
                              {brand}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
