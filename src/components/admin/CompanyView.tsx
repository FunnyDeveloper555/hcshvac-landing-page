import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Edit, Building2, Phone, Mail, MapPin, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import type { Json } from "@/integrations/supabase/types";

interface Company {
  id: string;
  name: string;
  slug?: string | null;
  logo_url?: string | null;
  company_address?: string | null;
  company_city?: string | null;
  company_state?: string | null;
  company_zip_code?: string | null;
  company_phone?: string | null;
  company_email_primary?: string | null;
  company_support_email?: string | null;
  poc_first_name?: string | null;
  poc_last_name?: string | null;
  poc_phone?: string | null;
  poc_email?: string | null;
  poc_title?: string | null;
  secondary_poc_first_name?: string | null;
  secondary_poc_last_name?: string | null;
  secondary_poc_phone?: string | null;
  secondary_poc_email?: string | null;
  secondary_poc_title?: string | null;
  services_provided?: Json | null;
  service_areas?: Json | null;
  brands_installed?: Json | null;
  brands_serviced?: Json | null;
  affiliations?: Json | null;
  inventory_parts?: string | null;
  inventory_equipment?: string | null;
  inventory_locations?: string | null;
  is_active?: boolean | null;
  display_order: number;
  created_at: string;
}

const CompanyView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCompany();
    }
  }, [id]);

  const fetchCompany = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch company details",
        variant: "destructive",
      });
    } else if (!data) {
      toast({
        title: "Not Found",
        description: "Company not found",
        variant: "destructive",
      });
      navigate("/admin/companies/active");
    } else {
      setCompany(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!company) {
    return null;
  }

  const fullAddress = [
    company.company_address,
    company.company_city,
    company.company_state,
    company.company_zip_code,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-3xl font-bold">Company Details</h2>
        </div>
        <div className="flex gap-2">
          {company.slug && (
            <Button 
              variant="outline"
              onClick={() => window.open(`/company/${company.slug}`, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Website
            </Button>
          )}
          <Button onClick={() => navigate(`/admin/companies/add?edit=${company.id}`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Company
          </Button>
        </div>
      </div>

      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-6">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.name}
                className="w-20 h-20 object-contain rounded-lg border"
              />
            ) : (
              <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                <Building2 className="w-10 h-10 text-muted-foreground" />
              </div>
            )}
            <div>
              <CardTitle className="text-2xl flex items-center gap-3">
                {company.name}
                <Badge variant={company.is_active ? "default" : "secondary"}>
                  {company.is_active ? "Active" : "Inactive"}
                </Badge>
              </CardTitle>
              {fullAddress && (
                <p className="text-muted-foreground flex items-center gap-2 mt-2">
                  <MapPin className="w-4 h-4" />
                  {fullAddress}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Contact Information */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {company.company_phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{company.company_phone}</span>
              </div>
            )}
            {company.company_email_primary && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{company.company_email_primary}</span>
              </div>
            )}
            {company.company_support_email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{company.company_support_email} (Support)</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Primary POC */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Primary Point of Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(company.poc_first_name || company.poc_last_name) && (
              <p className="font-medium">
                {company.poc_first_name} {company.poc_last_name}
                {company.poc_title && (
                  <span className="text-muted-foreground ml-2">({company.poc_title})</span>
                )}
              </p>
            )}
            {company.poc_phone && <p className="text-sm text-muted-foreground">{company.poc_phone}</p>}
            {company.poc_email && <p className="text-sm text-muted-foreground">{company.poc_email}</p>}
            {!company.poc_first_name && !company.poc_last_name && (
              <p className="text-muted-foreground">No primary contact set</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secondary POC */}
      {(company.secondary_poc_first_name || company.secondary_poc_last_name) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Secondary Point of Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium">
              {company.secondary_poc_first_name} {company.secondary_poc_last_name}
              {company.secondary_poc_title && (
                <span className="text-muted-foreground ml-2">({company.secondary_poc_title})</span>
              )}
            </p>
            {company.secondary_poc_phone && (
              <p className="text-sm text-muted-foreground">{company.secondary_poc_phone}</p>
            )}
            {company.secondary_poc_email && (
              <p className="text-sm text-muted-foreground">{company.secondary_poc_email}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Services & Brands */}
      <div className="grid md:grid-cols-2 gap-6">
        {company.services_provided && Array.isArray(company.services_provided) && company.services_provided.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Services Provided</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(company.services_provided as string[]).map((service, index) => (
                  <Badge key={index} variant="outline">
                    {String(service)}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {company.service_areas && Array.isArray(company.service_areas) && company.service_areas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Service Areas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(company.service_areas as string[]).map((area, index) => (
                  <Badge key={index} variant="outline">
                    {String(area)}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {company.brands_installed && Array.isArray(company.brands_installed) && company.brands_installed.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Brands Installed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(company.brands_installed as string[]).map((brand, index) => (
                  <Badge key={index} variant="secondary">
                    {String(brand)}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {company.brands_serviced && Array.isArray(company.brands_serviced) && company.brands_serviced.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Brands Serviced</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(company.brands_serviced as string[]).map((brand, index) => (
                  <Badge key={index} variant="secondary">
                    {String(brand)}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Inventory */}
      {(company.inventory_parts || company.inventory_equipment || company.inventory_locations) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Inventory Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {company.inventory_parts && (
              <div>
                <p className="font-medium text-sm text-muted-foreground">Parts</p>
                <p>{company.inventory_parts}</p>
              </div>
            )}
            {company.inventory_equipment && (
              <div>
                <p className="font-medium text-sm text-muted-foreground">Equipment</p>
                <p>{company.inventory_equipment}</p>
              </div>
            )}
            {company.inventory_locations && (
              <div>
                <p className="font-medium text-sm text-muted-foreground">Locations</p>
                <p>{company.inventory_locations}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-muted-foreground">Display Order</p>
            <p>{company.display_order}</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground">Created At</p>
            <p>{new Date(company.created_at).toLocaleDateString()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyView;
