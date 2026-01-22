import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Phone, Mail, Building2, Save } from "lucide-react";
import { toast } from "sonner";

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

interface FormData {
  name: string;
  website_tagline: string;
  company_phone: string;
  company_email_primary: string;
  logo_url: string;
  primary_color: string;
}

const TopHeaderPreview = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    website_tagline: "",
    company_phone: "",
    company_email_primary: "",
    logo_url: "",
    primary_color: "#0ea5e9",
  });

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
        setFormData({
          name: data.name || "",
          website_tagline: data.website_tagline || "",
          company_phone: data.company_phone || "",
          company_email_primary: data.company_email_primary || "",
          logo_url: data.logo_url || "",
          primary_color: data.primary_color || "#0ea5e9",
        });
      }
      setLoading(false);
    };

    fetchCompany();
  }, [companyId]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdate = async () => {
    if (!companyId) return;

    setSaving(true);
    const { error } = await supabase
      .from("companies")
      .update({
        name: formData.name.trim(),
        website_tagline: formData.website_tagline.trim() || null,
        company_phone: formData.company_phone.trim() || null,
        company_email_primary: formData.company_email_primary.trim() || null,
        logo_url: formData.logo_url.trim() || null,
        primary_color: formData.primary_color || null,
      })
      .eq("id", companyId);

    setSaving(false);

    if (error) {
      toast.error("Failed to update header configuration");
      return;
    }

    // Update local state to reflect changes in preview
    setCompany((prev) =>
      prev
        ? {
            ...prev,
            name: formData.name.trim(),
            website_tagline: formData.website_tagline.trim() || null,
            company_phone: formData.company_phone.trim() || null,
            company_email_primary: formData.company_email_primary.trim() || null,
            logo_url: formData.logo_url.trim() || null,
            primary_color: formData.primary_color || null,
          }
        : null
    );

    toast.success("Header configuration updated successfully");
  };

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

      {/* Header Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Header Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <p className="font-medium py-2">{company.name}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={formData.website_tagline}
                onChange={(e) => handleInputChange("website_tagline", e.target.value)}
                placeholder="Enter tagline"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.company_phone}
                onChange={(e) => handleInputChange("company_phone", e.target.value)}
                placeholder="(555) 000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.company_email_primary}
                onChange={(e) => handleInputChange("company_email_primary", e.target.value)}
                placeholder="info@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo">Logo URL</Label>
              <Input
                id="logo"
                value={formData.logo_url}
                onChange={(e) => handleInputChange("logo_url", e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Primary Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => handleInputChange("primary_color", e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formData.primary_color}
                  onChange={(e) => handleInputChange("primary_color", e.target.value)}
                  placeholder="#0ea5e9"
                  className="flex-1 font-mono"
                />
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={handleUpdate} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Header
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TopHeaderPreview;
