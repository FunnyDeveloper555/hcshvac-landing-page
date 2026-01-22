import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Phone, Mail, Building2 } from "lucide-react";

interface Company {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  company_phone: string | null;
  company_email_primary: string | null;
  website_tagline: string | null;
  primary_color: string | null;
}

const TopHeaderPreview = () => {
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
        .select("id, name, slug, logo_url, company_phone, company_email_primary, website_tagline, primary_color")
        .eq("id", companyId)
        .single();

      if (!error && data) {
        setCompany(data as Company);
      }
      setLoading(false);
    };

    fetchCompany();
  }, [companyId]);

  if (loading) {
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

  const primaryColor = company.primary_color || "#0ea5e9";

  return (
    <div className="space-y-6">
      {/* Section Title */}
      <div>
        <h1 className="text-2xl font-bold">Top Header Preview</h1>
        <p className="text-muted-foreground">Preview of the top header section for {company.name}</p>
      </div>

      {/* Mockup Indicator */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
          SECTION PREVIEW
        </Badge>
        <p className="text-amber-800 text-sm">
          This is a preview of the <strong>Top Header</strong> section for <strong>{company.name}</strong>.
        </p>
      </div>

      {/* Header Preview Frame */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Desktop View</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border rounded-lg overflow-hidden">
            {/* Browser Bar Mockup */}
            <div className="bg-muted px-4 py-2 flex items-center gap-2 border-b">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-background rounded-md px-3 py-1 text-sm text-muted-foreground flex items-center gap-2">
                  <span className="text-green-600">🔒</span>
                  {company.slug}.hcshvac.com
                </div>
              </div>
            </div>

            {/* Top Header Section */}
            <div 
              className="p-4 flex items-center justify-between"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center gap-3">
                {company.logo_url ? (
                  <img src={company.logo_url} alt="Logo" className="h-10 w-auto" />
                ) : (
                  <div className="w-10 h-10 rounded bg-white/20 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                )}
                <div className="text-white">
                  <h1 className="font-bold text-lg">{company.name}</h1>
                  {company.website_tagline && (
                    <p className="text-white/80 text-xs">{company.website_tagline}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-white text-sm">
                {company.company_email_primary && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {company.company_email_primary}
                  </span>
                )}
                {company.company_phone && (
                  <span className="flex items-center gap-1 font-bold">
                    <Phone className="w-4 h-4" />
                    {company.company_phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile View */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mobile View</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border rounded-lg overflow-hidden max-w-sm mx-auto">
            {/* Mobile Browser Bar */}
            <div className="bg-muted px-3 py-1.5 flex items-center gap-2 border-b">
              <div className="flex-1">
                <div className="bg-background rounded-md px-2 py-0.5 text-xs text-muted-foreground flex items-center gap-1">
                  <span className="text-green-600">🔒</span>
                  {company.slug}.hcshvac.com
                </div>
              </div>
            </div>

            {/* Mobile Header */}
            <div 
              className="p-3"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {company.logo_url ? (
                    <img src={company.logo_url} alt="Logo" className="h-8 w-auto" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div className="text-white">
                    <h1 className="font-bold text-sm">{company.name}</h1>
                  </div>
                </div>
                <div className="w-6 h-6 flex flex-col justify-center gap-1">
                  <div className="h-0.5 w-full bg-white rounded" />
                  <div className="h-0.5 w-full bg-white rounded" />
                  <div className="h-0.5 w-full bg-white rounded" />
                </div>
              </div>
              {company.company_phone && (
                <div className="text-white text-xs flex items-center gap-1 justify-center bg-white/10 rounded py-1">
                  <Phone className="w-3 h-3" />
                  Call: {company.company_phone}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Header Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Header Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Company Name</p>
              <p className="font-medium">{company.name}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Tagline</p>
              <p className="font-medium">{company.website_tagline || "—"}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Phone</p>
              <p className="font-medium">{company.company_phone || "—"}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="font-medium">{company.company_email_primary || "—"}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Logo</p>
              <p className="font-medium">{company.logo_url ? "Configured" : "Not Set"}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Primary Color</p>
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: primaryColor }}
                />
                <span className="font-mono text-sm">{primaryColor}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TopHeaderPreview;
