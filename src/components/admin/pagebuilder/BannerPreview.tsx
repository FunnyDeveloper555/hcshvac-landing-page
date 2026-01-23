import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Monitor, Smartphone, Save, Phone, Image } from "lucide-react";
import { toast } from "sonner";
import hvacHero from "@/assets/hvac-hero.jpg";

interface Company {
  id: string;
  name: string;
  website_title: string | null;
  website_tagline: string | null;
  website_description: string | null;
  hero_image_url: string | null;
  company_phone: string | null;
  primary_color: string | null;
}

const BannerPreview = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    website_title: "",
    website_tagline: "",
    website_description: "",
    hero_image_url: "",
  });

  useEffect(() => {
    const fetchCompany = async () => {
      if (!companyId) return;

      const { data, error } = await supabase
        .from("companies")
        .select("id, name, website_title, website_tagline, website_description, hero_image_url, company_phone, primary_color")
        .eq("id", companyId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching company:", error);
        toast.error("Failed to load company data");
      } else if (data) {
        setCompany(data);
        setFormData({
          website_title: data.website_title || "",
          website_tagline: data.website_tagline || "",
          website_description: data.website_description || "",
          hero_image_url: data.hero_image_url || "",
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
        website_title: formData.website_title.trim() || null,
        website_tagline: formData.website_tagline.trim() || null,
        website_description: formData.website_description.trim() || null,
        hero_image_url: formData.hero_image_url.trim() || null,
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

  const primaryColor = company.primary_color || "#1e40af";
  const heroImage = formData.hero_image_url || hvacHero;
  const displayTitle = formData.website_title || `${company.name} - Your Trusted HVAC Partner`;
  const displayTagline = formData.website_tagline || "24/7 Emergency Service Available";
  const displayDescription = formData.website_description || 
    `Professional heating, ventilation, and air conditioning services for residential and commercial properties.`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Banner Preview</h2>
        <p className="text-muted-foreground">Preview and configure the hero banner section for {company.name}</p>
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
            {/* Hero Banner Section */}
            <div 
              className="relative h-80 bg-cover bg-center"
              style={{ backgroundImage: `url(${heroImage})` }}
            >
              <div className="absolute inset-0 bg-black/50" />
              <div className="relative h-full flex flex-col items-center justify-center text-white text-center px-8">
                <h1 className="text-4xl font-bold mb-2">{displayTitle}</h1>
                <p 
                  className="text-xl font-medium mb-4"
                  style={{ color: primaryColor }}
                >
                  {displayTagline}
                </p>
                <p className="text-lg max-w-2xl mb-6 opacity-90">{displayDescription}</p>
                <div className="flex gap-4">
                  <button 
                    className="px-6 py-3 rounded-lg font-semibold text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Schedule Service
                  </button>
                  {company.company_phone && (
                    <button className="px-6 py-3 rounded-lg font-semibold bg-white text-gray-900 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {company.company_phone}
                    </button>
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
            {/* Mobile Hero Banner Section */}
            <div 
              className="relative h-64 bg-cover bg-center"
              style={{ backgroundImage: `url(${heroImage})` }}
            >
              <div className="absolute inset-0 bg-black/50" />
              <div className="relative h-full flex flex-col items-center justify-center text-white text-center px-4">
                <h1 className="text-xl font-bold mb-1">{displayTitle}</h1>
                <p 
                  className="text-sm font-medium mb-2"
                  style={{ color: primaryColor }}
                >
                  {displayTagline}
                </p>
                <p className="text-sm mb-4 opacity-90 line-clamp-2">{displayDescription}</p>
                <div className="flex flex-col gap-2 w-full px-4">
                  <button 
                    className="w-full px-4 py-2 rounded-lg font-semibold text-white text-sm"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Schedule Service
                  </button>
                  {company.company_phone && (
                    <button className="w-full px-4 py-2 rounded-lg font-semibold bg-white text-gray-900 flex items-center justify-center gap-2 text-sm">
                      <Phone className="h-3 w-3" />
                      Call Now
                    </button>
                  )}
                </div>
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
              <Label htmlFor="hero_image">Hero Image URL</Label>
              <div className="flex gap-2">
                <Input
                  id="hero_image"
                  value={formData.hero_image_url}
                  onChange={(e) => handleInputChange("hero_image_url", e.target.value)}
                  placeholder="Enter hero image URL (leave empty for default)"
                />
                <div className="flex items-center justify-center w-10 h-10 border rounded bg-muted">
                  <Image className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Website Title</Label>
              <Input
                id="title"
                value={formData.website_title}
                onChange={(e) => handleInputChange("website_title", e.target.value)}
                placeholder={`${company.name} - Your Trusted HVAC Partner`}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={formData.website_tagline}
                onChange={(e) => handleInputChange("website_tagline", e.target.value)}
                placeholder="24/7 Emergency Service Available"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.website_description}
                onChange={(e) => handleInputChange("website_description", e.target.value)}
                placeholder="Professional heating, ventilation, and air conditioning services..."
                rows={3}
              />
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
