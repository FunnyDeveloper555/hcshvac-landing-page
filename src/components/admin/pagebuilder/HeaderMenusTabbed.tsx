import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Save, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import ContentBlockEditor, { type ContentBlock } from "./ContentBlockEditor";
import ContentBlockPreview from "./ContentBlockPreview";

interface PageContent {
  title: string;
  subtitle: string;
  content: string;
  enabled: boolean;
  blocks?: ContentBlock[];
}

const PAGE_TABS = [
  { key: "about-us", label: "About Us" },
  { key: "financing", label: "Financing" },
  { key: "services", label: "Services" },
  { key: "residential", label: "Residential" },
  { key: "commercial", label: "Commercial" },
  { key: "air-quality", label: "Air Quality" },
];

function migrateToBlocks(page: PageContent): ContentBlock[] {
  if (page.blocks && page.blocks.length > 0) return page.blocks;
  if (!page.content) return [];
  return [{
    id: Math.random().toString(36).substring(2, 10),
    type: "text",
    data: { heading: "", body: page.content },
    order: 0,
  }];
}

function PageEditor({ pageKey, companyName, headerPages, onSave }: {
  pageKey: string;
  companyName: string;
  headerPages: Record<string, PageContent>;
  onSave: (key: string, data: PageContent) => Promise<void>;
}) {
  const getDefault = (key: string): PageContent => {
    const defaults: Record<string, PageContent> = {
      "about-us": { title: `About ${companyName}`, subtitle: "Your Trusted HVAC Partner", content: "", enabled: true, blocks: [] },
      "financing": { title: "Financing Options", subtitle: "Flexible Payment Solutions", content: "", enabled: true, blocks: [] },
      "services": { title: "Our Services", subtitle: "Comprehensive HVAC Solutions", content: "", enabled: true, blocks: [] },
      "residential": { title: "Residential Services", subtitle: "Home Comfort Solutions", content: "", enabled: true, blocks: [] },
      "commercial": { title: "Commercial Services", subtitle: "Business HVAC Solutions", content: "", enabled: true, blocks: [] },
      "air-quality": { title: "Air Quality Solutions", subtitle: "Breathe Cleaner, Healthier Air", content: "", enabled: true, blocks: [] },
    };
    return defaults[key] || { title: "", subtitle: "", content: "", enabled: true, blocks: [] };
  };

  const existing = headerPages[pageKey] || getDefault(pageKey);
  const [formData, setFormData] = useState<PageContent>({ ...existing, blocks: migrateToBlocks(existing) });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const page = headerPages[pageKey] || getDefault(pageKey);
    setFormData({ ...page, blocks: migrateToBlocks(page) });
  }, [pageKey]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(pageKey, formData);
    setSaving(false);
  };

  const blocks = formData.blocks || [];

  return (
    <div className="space-y-6">
      {/* Settings Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Page Settings</CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" /> Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Page Preview</DialogTitle>
                </DialogHeader>
                <div className="border rounded-lg overflow-hidden bg-gradient-to-b from-primary/5 to-background p-8">
                  <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">{formData.title || "Page Title"}</h1>
                    {formData.subtitle && <p className="text-lg text-muted-foreground">{formData.subtitle}</p>}
                  </div>
                  <div className="max-w-2xl mx-auto">
                    <ContentBlockPreview blocks={blocks} />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <Label className="text-sm font-medium">Show in Menu</Label>
              <p className="text-xs text-muted-foreground">Display this page in the website navigation</p>
            </div>
            <Switch checked={formData.enabled} onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Page Title</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Subtitle</Label>
              <Input value={formData.subtitle} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} />
            </div>
          </div>
          {!formData.enabled && (
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-yellow-600" />
              <span className="text-xs text-yellow-700 dark:text-yellow-400">This page is hidden from the website menu</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Blocks Editor — Split Layout */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Content Blocks</CardTitle>
        </CardHeader>
        <CardContent>
          <ContentBlockEditor blocks={blocks} onChange={(newBlocks) => setFormData({ ...formData, blocks: newBlocks })} />
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Save Changes
      </Button>
    </div>
  );
}

export default function HeaderMenusTabbed() {
  const { companyId } = useParams<{ companyId: string }>();
  const [company, setCompany] = useState<{ id: string; name: string; header_pages: Record<string, PageContent> } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
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
    fetchData();
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
            <PageEditor pageKey={tab.key} companyName={company.name} headerPages={company.header_pages} onSave={handleSave} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
