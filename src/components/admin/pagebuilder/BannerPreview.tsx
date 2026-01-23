import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Monitor, Smartphone, Save } from "lucide-react";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  website_tagline: string | null;
  company_phone: string | null;
  company_email_primary: string | null;
  logo_url: string | null;
  primary_color: string | null;
}

const BannerPreview = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    website_tagline: "",
    company_phone: "",
    company_email_primary: "",
    logo_url: "",
    primary_color: "#1e40af",
  });

  useEffect(() => {
    const fetchCompany = async () => {
      if (!companyId) return;

      const { data, error } = await supabase
        .from("companies")
        .select("id, name, website_tagline, company_phone, company_email_primary, logo_url, primary_color")
        .eq("id", companyId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching company:", error);
        toast.error("Failed to load company data");
      } else if (data) {
        setCompany(data);
        setFormData({
          website_tagline: data.website_tagline || "",
          company_phone: data.company_phone || "",
          company_email_primary: data.company_email_primary || "",
          logo_url: data.logo_url || "",
          primary_color: data.primary_color || "#1e40af",
        });
      }
      setLoading(false);
    };

    fetchCompany();
  }, [companyId]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdate = async () => {
    if (!companyId) return;

    setSaving(true);
    const { error } = await supabase
      .from("companies")
      .update({
        website_tagline: formData.website_tagline.trim() || null,
        company_phone: formData.company_phone.trim() || null,
        company_email_primary: formData.company_email_primary.trim() || null,
        logo_url: formData.logo_url.trim() || null,
        primary_color: formData.primary_color || null,
      })
      .eq("id", companyId);

    if (error) {
      console.error("Error updating company:", error);
      toast.error("Failed to update banner configuration");
    } else {
      setCompany(prev => prev ? { ...prev, ...formData } : null);
      toast.success("Banner configuration updated successfully");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Company not found</p>
      </div>
    );
  }

  const primaryColor = formData.primary_color || "#1e40af";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Banner Preview</h2>
        <p className="text-muted-foreground">Preview and configure the banner section for {company.name}</p>
      </div>

      {/* Desktop Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Monitor className="h-5 w-5" />
            Desktop Banner Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            {/* Banner Section */}
            <div 
              className="text-white px-6 py-3"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {formData.logo_url && (
                    <img 
                      src={formData.logo_url} 
                      alt={`${company.name} logo`}
                      className="h-10 w-auto object-contain bg-white rounded p-1"
                    />
                  )}
                  <div>
                    <h1 className="font-bold text-lg">{company.name}</h1>
                    {formData.website_tagline && (
                      <p className="text-sm opacity-90">{formData.website_tagline}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  {formData.company_phone && (
                    <div className="flex items-center gap-2">
                      <span>📞</span>
                      <span className="font-medium">{formData.company_phone}</span>
                    </div>
                  )}
                  {formData.company_email_primary && (
                    <div className="flex items-center gap-2">
                      <span>✉️</span>
                      <span>{formData.company_email_primary}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Smartphone className="h-5 w-5" />
            Mobile Banner Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm mx-auto border rounded-lg overflow-hidden">
            {/* Mobile Banner Section */}
            <div 
              className="text-white px-4 py-3"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {formData.logo_url && (
                    <img 
                      src={formData.logo_url} 
                      alt={`${company.name} logo`}
                      className="h-8 w-auto object-contain bg-white rounded p-1"
                    />
                  )}
                  <div>
                    <h1 className="font-bold text-sm">{company.name}</h1>
                    {formData.website_tagline && (
                      <p className="text-xs opacity-90 truncate max-w-[150px]">{formData.website_tagline}</p>
                    )}
                  </div>
                </div>
                {formData.company_phone && (
                  <a href={`tel:${formData.company_phone}`} className="bg-white/20 px-2 py-1 rounded text-xs">
                    Call
                  </a>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Banner Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Banner Configuration</CardTitle>
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
                placeholder="Enter website tagline"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Contact Phone</Label>
              <Input
                id="phone"
                value={formData.company_phone}
                onChange={(e) => handleInputChange("company_phone", e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Primary Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.company_email_primary}
                onChange={(e) => handleInputChange("company_email_primary", e.target.value)}
                placeholder="Enter primary email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo">Logo URL</Label>
              <Input
                id="logo"
                value={formData.logo_url}
                onChange={(e) => handleInputChange("logo_url", e.target.value)}
                placeholder="Enter logo URL"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => handleInputChange("primary_color", e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formData.primary_color}
                  onChange={(e) => handleInputChange("primary_color", e.target.value)}
                  placeholder="#1e40af"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <div className="mt-6">
            <Button onClick={handleUpdate} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Banner Configuration
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BannerPreview;
