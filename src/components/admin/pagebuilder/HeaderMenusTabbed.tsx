import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface PageContent {
  title: string;
  subtitle: string;
  content: string;
  enabled: boolean;
}

const PAGE_TABS = [
  { key: "about-us", label: "About Us" },
  { key: "financing", label: "Financing" },
  { key: "services", label: "Services" },
  { key: "residential", label: "Residential" },
  { key: "commercial", label: "Commercial" },
  { key: "air-quality", label: "Air Quality" },
];

function PageEditor({ pageKey, companyId, companyName, headerPages, onSave }: {
  pageKey: string;
  companyId: string;
  companyName: string;
  headerPages: Record<string, PageContent>;
  onSave: (key: string, data: PageContent) => Promise<void>;
}) {
  const getDefault = (key: string): PageContent => {
    const defaults: Record<string, PageContent> = {
      "about-us": { title: `About ${companyName}`, subtitle: "Your Trusted HVAC Partner", content: `${companyName} has been serving the community with reliable HVAC services.`, enabled: true },
      "financing": { title: "Financing Options", subtitle: "Flexible Payment Solutions", content: "We offer flexible financing options to make your HVAC investment affordable.", enabled: true },
      "services": { title: "Our Services", subtitle: "Comprehensive HVAC Solutions", content: "From installation to maintenance and repair, we provide a full range of HVAC services.", enabled: true },
      "residential": { title: "Residential Services", subtitle: "Home Comfort Solutions", content: "We specialize in residential HVAC services.", enabled: true },
      "commercial": { title: "Commercial Services", subtitle: "Business HVAC Solutions", content: "Our commercial HVAC services ensure your business stays comfortable.", enabled: true },
      "air-quality": { title: "Air Quality Solutions", subtitle: "Breathe Cleaner, Healthier Air", content: "Improve your indoor air quality with our comprehensive solutions.", enabled: true },
    };
    return defaults[key] || { title: "", subtitle: "", content: "", enabled: true };
  };

  const [formData, setFormData] = useState<PageContent>(headerPages[pageKey] || getDefault(pageKey));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData(headerPages[pageKey] || getDefault(pageKey));
  }, [pageKey]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(pageKey, formData);
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Eye className="w-5 h-5" /> Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden bg-gradient-to-b from-primary/10 to-background">
            <div className="p-8 text-center">
              <h1 className="text-3xl font-bold mb-2">{formData.title || "Page Title"}</h1>
              <p className="text-lg text-muted-foreground mb-6">{formData.subtitle || "Subtitle"}</p>
              <div className="max-w-2xl mx-auto text-left bg-card p-6 rounded-lg shadow-sm">
                <p className="text-foreground whitespace-pre-wrap">{formData.content || "Content..."}</p>
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

      <Card>
        <CardHeader>
          <CardTitle>Page Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label className="text-base font-medium">Show in Menu</Label>
              <p className="text-sm text-muted-foreground">Display this page in the website navigation</p>
            </div>
            <Switch checked={formData.enabled} onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })} />
          </div>
          <div className="space-y-2">
            <Label>Page Title</Label>
            <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Subtitle</Label>
            <Input value={formData.subtitle} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={8} />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function HeaderMenusTabbed() {
  const { companyId } = useParams<{ companyId: string }>();
  const [company, setCompany] = useState<{ id: string; name: string; header_pages: Record<string, PageContent> } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!companyId) return;
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, header_pages")
        .eq("id", companyId)
        .single();
      if (error) { toast.error("Failed to load company"); setLoading(false); return; }
      setCompany({ id: data.id, name: data.name, header_pages: (data.header_pages as unknown as Record<string, PageContent>) || {} });
      setLoading(false);
    };
    fetch();
  }, [companyId]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!company) return <div className="text-center py-20"><p className="text-muted-foreground">Company not found</p></div>;

  const handleSave = async (pageKey: string, data: PageContent) => {
    const updatedPages = { ...company.header_pages, [pageKey]: data };
    const { error } = await supabase
      .from("companies")
      .update({ header_pages: updatedPages } as Record<string, unknown>)
      .eq("id", company.id);
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Saved!");
    setCompany({ ...company, header_pages: updatedPages });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Header Menus</h2>
        <p className="text-muted-foreground">Manage header page content for {company.name}</p>
      </div>
      <Tabs defaultValue="about-us" className="w-full">
        <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted p-1">
          {PAGE_TABS.map(tab => (
            <TabsTrigger key={tab.key} value={tab.key} className="flex-1 min-w-[100px]">{tab.label}</TabsTrigger>
          ))}
        </TabsList>
        {PAGE_TABS.map(tab => (
          <TabsContent key={tab.key} value={tab.key}>
            <PageEditor pageKey={tab.key} companyId={company.id} companyName={company.name} headerPages={company.header_pages} onSave={handleSave} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
