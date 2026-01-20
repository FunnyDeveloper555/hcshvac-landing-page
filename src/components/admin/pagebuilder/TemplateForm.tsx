import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Save, Eye, GripVertical, Settings2, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TemplatePreview from "./TemplatePreview";
import TemplateSectionEditor from "./TemplateSectionEditor";

interface TemplateSection {
  id: string;
  type: string;
  enabled: boolean;
  order: number;
  settings: Record<string, unknown>;
}

interface TemplateSettings {
  primaryColor?: string;
  fontFamily?: string;
  headerStyle?: string;
}

interface Template {
  id?: string;
  name: string;
  description: string;
  is_default: boolean;
  is_active: boolean;
  sections: TemplateSection[];
  settings: TemplateSettings;
}

const SECTION_TYPES = [
  { type: 'hero', label: 'Hero Section', description: 'Main banner with headline and CTA' },
  { type: 'services', label: 'Services', description: 'List of services offered' },
  { type: 'brands', label: 'Brands', description: 'Equipment brands marquee or grid' },
  { type: 'service-areas', label: 'Service Areas', description: 'Geographic coverage areas' },
  { type: 'coupons', label: 'Coupons/Offers', description: 'Special offers and discounts' },
  { type: 'reviews', label: 'Reviews/Testimonials', description: 'Customer testimonials' },
  { type: 'stats', label: 'Stats/Numbers', description: 'Key statistics and achievements' },
  { type: 'features', label: 'Features/Why Choose Us', description: 'Key differentiators' },
  { type: 'cta', label: 'Call to Action', description: 'Conversion-focused section' },
  { type: 'contact', label: 'Contact Section', description: 'Contact form and information' },
  { type: 'about', label: 'About Section', description: 'Company information' },
  { type: 'footer', label: 'Footer', description: 'Page footer with links' },
];

const DEFAULT_SECTIONS: TemplateSection[] = [
  { id: 'hero-1', type: 'hero', enabled: true, order: 1, settings: { showBadge: true, showStats: true, showCTA: true } },
  { id: 'services-1', type: 'services', enabled: true, order: 2, settings: { columns: 3, showPrices: true } },
  { id: 'contact-1', type: 'contact', enabled: true, order: 3, settings: { showForm: true } },
  { id: 'footer-1', type: 'footer', enabled: true, order: 4, settings: { showSocial: true } },
];

export default function TemplateForm() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = templateId === 'new';

  const [template, setTemplate] = useState<Template>({
    name: '',
    description: '',
    is_default: false,
    is_active: true,
    sections: DEFAULT_SECTIONS,
    settings: { primaryColor: '#0ea5e9', fontFamily: 'Inter', headerStyle: 'sticky' },
  });

  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<TemplateSection | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const { data: existingTemplate, isLoading } = useQuery({
    queryKey: ['page_template', templateId],
    queryFn: async () => {
      if (isNew) return null;
      const { data, error } = await supabase
        .from('page_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !isNew,
  });

  useEffect(() => {
    if (existingTemplate) {
      setTemplate({
        id: existingTemplate.id,
        name: existingTemplate.name,
        description: existingTemplate.description || '',
        is_default: existingTemplate.is_default,
        is_active: existingTemplate.is_active,
        sections: existingTemplate.sections as unknown as TemplateSection[],
        settings: existingTemplate.settings as unknown as TemplateSettings,
      });
    }
  }, [existingTemplate]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isNew) {
        const { error } = await (supabase.from('page_templates') as any).insert({
          name: template.name,
          description: template.description,
          is_default: template.is_default,
          is_active: template.is_active,
          sections: template.sections,
          settings: template.settings,
        });
        if (error) throw error;
      } else {
        const { error } = await (supabase.from('page_templates') as any)
          .update({
            name: template.name,
            description: template.description || null,
            is_default: template.is_default,
            is_active: template.is_active,
            sections: template.sections,
            settings: template.settings,
          })
          .eq('id', templateId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page_templates'] });
      toast.success(isNew ? 'Template created' : 'Template saved');
      navigate('/admin/page-builder/templates');
    },
    onError: () => toast.error('Failed to save template'),
  });

  const addSection = (type: string) => {
    const newSection: TemplateSection = {
      id: `${type}-${Date.now()}`,
      type,
      enabled: true,
      order: template.sections.length + 1,
      settings: {},
    };
    setTemplate(prev => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
  };

  const removeSection = (id: string) => {
    setTemplate(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== id).map((s, i) => ({ ...s, order: i + 1 })),
    }));
  };

  const toggleSection = (id: string) => {
    setTemplate(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s),
    }));
  };

  const updateSectionSettings = (id: string, settings: Record<string, unknown>) => {
    setTemplate(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === id ? { ...s, settings } : s),
    }));
    setEditingSection(null);
  };

  const handleDragStart = (index: number) => setDraggedIndex(index);
  
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newSections = [...template.sections];
    const [dragged] = newSections.splice(draggedIndex, 1);
    newSections.splice(index, 0, dragged);
    
    setTemplate(prev => ({
      ...prev,
      sections: newSections.map((s, i) => ({ ...s, order: i + 1 })),
    }));
    setDraggedIndex(index);
  };

  const handleDragEnd = () => setDraggedIndex(null);

  if (isLoading) {
    return <div className="flex items-center justify-center py-12">Loading template...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/page-builder/templates')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {isNew ? 'Create Template' : 'Edit Template'}
            </h2>
            <p className="text-muted-foreground">
              Configure the sections and settings for this template
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPreviewOpen(true)}>
            <Eye className="mr-2 h-4 w-4" /> Preview
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !template.name}>
            <Save className="mr-2 h-4 w-4" />
            {saveMutation.isPending ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="sections">Sections ({template.sections.length})</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Information</CardTitle>
              <CardDescription>Basic details about this template</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={template.name}
                    onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Modern HVAC Template"
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Active Status</Label>
                    <p className="text-sm text-muted-foreground">Enable this template for use</p>
                  </div>
                  <Switch
                    checked={template.is_active}
                    onCheckedChange={(checked) => setTemplate(prev => ({ ...prev, is_active: checked }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={template.description}
                  onChange={(e) => setTemplate(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this template is best used for..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sections" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Section List */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Template Sections</CardTitle>
                  <CardDescription>Drag to reorder, toggle to enable/disable</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {template.sections.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">
                      No sections added. Add sections from the panel on the right.
                    </p>
                  ) : (
                    template.sections.map((section, index) => (
                      <div
                        key={section.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-move transition-all ${
                          !section.enabled ? 'opacity-50 bg-muted' : 'bg-background'
                        } ${draggedIndex === index ? 'border-primary shadow-lg' : ''}`}
                      >
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium capitalize">{section.type.replace('-', ' ')}</p>
                          <p className="text-xs text-muted-foreground">Order: {section.order}</p>
                        </div>
                        <Switch
                          checked={section.enabled}
                          onCheckedChange={() => toggleSection(section.id)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingSection(section)}
                        >
                          <Settings2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSection(section.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Add Section Panel */}
            <Card>
              <CardHeader>
                <CardTitle>Add Section</CardTitle>
                <CardDescription>Click to add a section to the template</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
                {SECTION_TYPES.map((sectionType) => (
                  <Button
                    key={sectionType.type}
                    variant="outline"
                    className="w-full justify-start h-auto py-3"
                    onClick={() => addSection(sectionType.type)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    <div className="text-left">
                      <p className="font-medium">{sectionType.label}</p>
                      <p className="text-xs text-muted-foreground">{sectionType.description}</p>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Settings</CardTitle>
              <CardDescription>Global styling and behavior settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={template.settings.primaryColor || '#0ea5e9'}
                      onChange={(e) => setTemplate(prev => ({
                        ...prev,
                        settings: { ...prev.settings, primaryColor: e.target.value },
                      }))}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={template.settings.primaryColor || '#0ea5e9'}
                      onChange={(e) => setTemplate(prev => ({
                        ...prev,
                        settings: { ...prev.settings, primaryColor: e.target.value },
                      }))}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fontFamily">Font Family</Label>
                  <select
                    id="fontFamily"
                    value={template.settings.fontFamily || 'Inter'}
                    onChange={(e) => setTemplate(prev => ({
                      ...prev,
                      settings: { ...prev.settings, fontFamily: e.target.value },
                    }))}
                    className="w-full h-10 px-3 border rounded-md"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Poppins">Poppins</option>
                    <option value="Roboto">Roboto</option>
                    <option value="System">System Default</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headerStyle">Header Style</Label>
                  <select
                    id="headerStyle"
                    value={template.settings.headerStyle || 'sticky'}
                    onChange={(e) => setTemplate(prev => ({
                      ...prev,
                      settings: { ...prev.settings, headerStyle: e.target.value },
                    }))}
                    className="w-full h-10 px-3 border rounded-md"
                  >
                    <option value="sticky">Sticky</option>
                    <option value="fixed">Fixed</option>
                    <option value="transparent">Transparent</option>
                    <option value="minimal">Minimal</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
          </DialogHeader>
          <TemplatePreview template={template} />
        </DialogContent>
      </Dialog>

      {/* Section Editor Dialog */}
      {editingSection && (
        <TemplateSectionEditor
          section={editingSection}
          onSave={(settings) => updateSectionSettings(editingSection.id, settings)}
          onClose={() => setEditingSection(null)}
        />
      )}
    </div>
  );
}
