import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface HeaderPageEditorProps {
  pageKey: string;
  pageTitle: string;
  pageDescription: string;
}

interface PageContent {
  title: string;
  subtitle: string;
  content: string;
  enabled: boolean;
}

interface Company {
  id: string;
  name: string;
  header_pages: Record<string, PageContent> | null;
}

export default function HeaderPageEditor({ pageKey, pageTitle, pageDescription }: HeaderPageEditorProps) {
  const { companyId } = useParams<{ companyId: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<PageContent>({
    title: "",
    subtitle: "",
    content: "",
    enabled: true,
  });

  useEffect(() => {
    const fetchCompany = async () => {
      if (!companyId) return;

      const { data, error } = await supabase
        .from("companies")
        .select("id, name, header_pages")
        .eq("id", companyId)
        .single();

      if (error) {
        toast.error("Failed to load company data");
        setLoading(false);
        return;
      }

      const companyData = data as unknown as Company;
      setCompany(companyData);
      
      // Load existing page content if available
      const headerPages = companyData.header_pages as Record<string, PageContent> | null;
      if (headerPages && headerPages[pageKey]) {
        setFormData(headerPages[pageKey]);
      } else {
        // Set default content based on page type
        setFormData(getDefaultContent(pageKey, companyData.name));
      }
      
      setLoading(false);
    };

    fetchCompany();
  }, [companyId, pageKey]);

  const getDefaultContent = (key: string, companyName: string): PageContent => {
    const defaults: Record<string, PageContent> = {
      "about-us": {
        title: `About ${companyName}`,
        subtitle: "Your Trusted HVAC Partner",
        content: `${companyName} has been serving the community with reliable HVAC services. We are committed to providing exceptional heating, cooling, and air quality solutions for residential and commercial customers.`,
        enabled: true,
      },
      "financing": {
        title: "Financing Options",
        subtitle: "Flexible Payment Solutions",
        content: "We offer flexible financing options to make your HVAC investment affordable. Ask about our payment plans and special financing offers.",
        enabled: true,
      },
      "services": {
        title: "Our Services",
        subtitle: "Comprehensive HVAC Solutions",
        content: "From installation to maintenance and repair, we provide a full range of HVAC services to keep your home or business comfortable year-round.",
        enabled: true,
      },
      "residential": {
        title: "Residential Services",
        subtitle: "Home Comfort Solutions",
        content: "We specialize in residential HVAC services including air conditioning, heating systems, indoor air quality, and regular maintenance plans.",
        enabled: true,
      },
      "commercial": {
        title: "Commercial Services",
        subtitle: "Business HVAC Solutions",
        content: "Our commercial HVAC services ensure your business stays comfortable and efficient. We handle installations, repairs, and maintenance for all commercial systems.",
        enabled: true,
      },
      "air-quality": {
        title: "Air Quality Solutions",
        subtitle: "Breathe Cleaner, Healthier Air",
        content: "Improve your indoor air quality with our comprehensive solutions including air purifiers, humidifiers, ventilation systems, and duct cleaning services.",
        enabled: true,
      },
    };
    return defaults[key] || { title: pageTitle, subtitle: "", content: "", enabled: true };
  };

  const handleSave = async () => {
    if (!companyId || !company) return;
    
    setSaving(true);

    // Get current header_pages and update with new content
    const currentPages = company.header_pages || {};
    const updatedPages = {
      ...currentPages,
      [pageKey]: formData,
    };

    const { error } = await supabase
      .from("companies")
      .update({ header_pages: updatedPages } as Record<string, unknown>)
      .eq("id", companyId);

    if (error) {
      toast.error("Failed to save page content");
    } else {
      toast.success("Page content saved successfully");
      setCompany({ ...company, header_pages: updatedPages });
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{pageTitle}</h2>
          <p className="text-muted-foreground">{pageDescription} for {company.name}</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Page Preview
          </CardTitle>
          <CardDescription>How this page will appear on your website</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden bg-gradient-to-b from-primary/10 to-background">
            <div className="p-8 text-center">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{formData.title || "Page Title"}</h1>
              <p className="text-lg text-muted-foreground mb-6">{formData.subtitle || "Page Subtitle"}</p>
              <div className="max-w-2xl mx-auto text-left bg-card p-6 rounded-lg shadow-sm">
                <p className="text-foreground whitespace-pre-wrap">{formData.content || "Page content will appear here..."}</p>
              </div>
            </div>
          </div>
          {!formData.enabled && (
            <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-700 dark:text-yellow-400">This page is hidden from the website menu</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle>Page Configuration</CardTitle>
          <CardDescription>Edit the content for this page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label className="text-base font-medium">Show in Menu</Label>
              <p className="text-sm text-muted-foreground">Display this page in the website navigation</p>
            </div>
            <Switch
              checked={formData.enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Page Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter page title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input
              id="subtitle"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="Enter page subtitle"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Page Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Enter page content"
              rows={8}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
