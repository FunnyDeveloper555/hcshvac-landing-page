import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

interface TemplateSection {
  id: string;
  type: string;
  enabled: boolean;
  order: number;
  settings: Record<string, unknown>;
}

interface TemplateSectionEditorProps {
  section: TemplateSection;
  onSave: (settings: Record<string, unknown>) => void;
  onClose: () => void;
}

const SECTION_SETTINGS: Record<string, Array<{ key: string; label: string; type: 'switch' | 'number' | 'select'; options?: string[] }>> = {
  hero: [
    { key: 'showBadge', label: 'Show Badge', type: 'switch' },
    { key: 'showStats', label: 'Show Statistics', type: 'switch' },
    { key: 'showCTA', label: 'Show CTA Buttons', type: 'switch' },
    { key: 'fullWidth', label: 'Full Width', type: 'switch' },
    { key: 'minimal', label: 'Minimal Style', type: 'switch' },
  ],
  services: [
    { key: 'columns', label: 'Number of Columns', type: 'number' },
    { key: 'showPrices', label: 'Show Prices', type: 'switch' },
    { key: 'showDescriptions', label: 'Show Descriptions', type: 'switch' },
    { key: 'limit', label: 'Max Services to Show', type: 'number' },
    { key: 'layout', label: 'Layout Style', type: 'select', options: ['grid', 'list'] },
  ],
  brands: [
    { key: 'layout', label: 'Layout Style', type: 'select', options: ['marquee', 'grid'] },
  ],
  'service-areas': [
    { key: 'showMap', label: 'Show Map', type: 'switch' },
  ],
  coupons: [
    { key: 'layout', label: 'Layout Style', type: 'select', options: ['cards', 'list'] },
  ],
  reviews: [
    { key: 'layout', label: 'Layout Style', type: 'select', options: ['carousel', 'grid', 'list'] },
  ],
  stats: [
    { key: 'layout', label: 'Layout Style', type: 'select', options: ['horizontal', 'vertical'] },
  ],
  features: [
    { key: 'columns', label: 'Number of Columns', type: 'number' },
  ],
  cta: [
    { key: 'style', label: 'Style', type: 'select', options: ['gradient', 'simple', 'bold'] },
  ],
  contact: [
    { key: 'showForm', label: 'Show Contact Form', type: 'switch' },
    { key: 'showMap', label: 'Show Map', type: 'switch' },
    { key: 'showInfo', label: 'Show Contact Info', type: 'switch' },
    { key: 'compact', label: 'Compact Layout', type: 'switch' },
  ],
  about: [
    { key: 'showImage', label: 'Show Image', type: 'switch' },
  ],
  footer: [
    { key: 'showSocial', label: 'Show Social Links', type: 'switch' },
    { key: 'minimal', label: 'Minimal Style', type: 'switch' },
  ],
  header: [
    { key: 'showPhone', label: 'Show Phone Number', type: 'switch' },
  ],
};

export default function TemplateSectionEditor({ section, onSave, onClose }: TemplateSectionEditorProps) {
  const [settings, setSettings] = useState<Record<string, unknown>>(section.settings);
  
  const sectionSettings = SECTION_SETTINGS[section.type] || [];

  const updateSetting = (key: string, value: unknown) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="capitalize">{section.type.replace('-', ' ')} Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {sectionSettings.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No configurable settings for this section type.
            </p>
          ) : (
            sectionSettings.map((setting) => (
              <div key={setting.key} className="flex items-center justify-between">
                <Label htmlFor={setting.key}>{setting.label}</Label>
                {setting.type === 'switch' && (
                  <Switch
                    id={setting.key}
                    checked={!!settings[setting.key]}
                    onCheckedChange={(checked) => updateSetting(setting.key, checked)}
                  />
                )}
                {setting.type === 'number' && (
                  <Input
                    id={setting.key}
                    type="number"
                    value={String(settings[setting.key] || '')}
                    onChange={(e) => updateSetting(setting.key, parseInt(e.target.value) || 0)}
                    className="w-24"
                    min={1}
                    max={6}
                  />
                )}
                {setting.type === 'select' && (
                  <select
                    id={setting.key}
                    value={String(settings[setting.key] || '')}
                    onChange={(e) => updateSetting(setting.key, e.target.value)}
                    className="h-10 px-3 border rounded-md"
                  >
                    <option value="">Select...</option>
                    {setting.options?.map((option) => (
                      <option key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(settings)}>Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
