import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { z } from "zod";

const heroSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  subtitle: z.string().min(1, "Subtitle is required").max(200),
  description: z.string().min(1, "Description is required").max(500),
  badge_text: z.string().min(1, "Badge text is required").max(100),
  primary_button_text: z.string().min(1, "Button text is required").max(50),
  primary_button_link: z.string().min(1, "Button link is required").max(200),
  secondary_button_text: z.string().min(1, "Button text is required").max(50),
  secondary_button_link: z.string().min(1, "Button link is required").max(200),
  stat1_value: z.string().min(1, "Stat value is required").max(20),
  stat1_label: z.string().min(1, "Stat label is required").max(50),
  stat2_value: z.string().min(1, "Stat value is required").max(20),
  stat2_label: z.string().min(1, "Stat label is required").max(50),
  stat3_value: z.string().min(1, "Stat value is required").max(20),
  stat3_label: z.string().min(1, "Stat label is required").max(50),
});

type HeroContent = z.infer<typeof heroSchema> & { id: string };

const HeroAdmin = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [heroContent, setHeroContent] = useState<HeroContent | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    badge_text: "",
    primary_button_text: "",
    primary_button_link: "",
    secondary_button_text: "",
    secondary_button_link: "",
    stat1_value: "",
    stat1_label: "",
    stat2_value: "",
    stat2_label: "",
    stat3_value: "",
    stat3_label: "",
  });

  useEffect(() => {
    fetchHeroContent();
  }, []);

  const fetchHeroContent = async () => {
    try {
      const { data, error } = await supabase
        .from("hero_content")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setHeroContent(data);
        setFormData({
          title: data.title,
          subtitle: data.subtitle,
          description: data.description,
          badge_text: data.badge_text,
          primary_button_text: data.primary_button_text,
          primary_button_link: data.primary_button_link,
          secondary_button_text: data.secondary_button_text,
          secondary_button_link: data.secondary_button_link,
          stat1_value: data.stat1_value,
          stat1_label: data.stat1_label,
          stat2_value: data.stat2_value,
          stat2_label: data.stat2_label,
          stat3_value: data.stat3_value,
          stat3_label: data.stat3_label,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const validated = heroSchema.parse(formData);

      const { error } = await supabase
        .from("hero_content")
        .update(validated)
        .eq("id", heroContent?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Hero content updated successfully",
      });

      fetchHeroContent();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.issues[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hero Section Content</CardTitle>
        <CardDescription>
          Edit the main hero section content displayed on the homepage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Main Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Your Comfort Is Our Priority"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input
              id="subtitle"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="Professional HVAC Solutions"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Expert heating, cooling, and air quality services..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="badge_text">Badge Text</Label>
            <Input
              id="badge_text"
              value={formData.badge_text}
              onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
              placeholder="24/7 Emergency Service Available"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary_button_text">Primary Button Text</Label>
              <Input
                id="primary_button_text"
                value={formData.primary_button_text}
                onChange={(e) => setFormData({ ...formData, primary_button_text: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primary_button_link">Primary Button Link</Label>
              <Input
                id="primary_button_link"
                value={formData.primary_button_link}
                onChange={(e) => setFormData({ ...formData, primary_button_link: e.target.value })}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="secondary_button_text">Secondary Button Text</Label>
              <Input
                id="secondary_button_text"
                value={formData.secondary_button_text}
                onChange={(e) => setFormData({ ...formData, secondary_button_text: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondary_button_link">Secondary Button Link</Label>
              <Input
                id="secondary_button_link"
                value={formData.secondary_button_link}
                onChange={(e) => setFormData({ ...formData, secondary_button_link: e.target.value })}
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Statistics</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stat1_value">Stat 1 Value</Label>
                <Input
                  id="stat1_value"
                  value={formData.stat1_value}
                  onChange={(e) => setFormData({ ...formData, stat1_value: e.target.value })}
                />
                <Label htmlFor="stat1_label">Stat 1 Label</Label>
                <Input
                  id="stat1_label"
                  value={formData.stat1_label}
                  onChange={(e) => setFormData({ ...formData, stat1_label: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stat2_value">Stat 2 Value</Label>
                <Input
                  id="stat2_value"
                  value={formData.stat2_value}
                  onChange={(e) => setFormData({ ...formData, stat2_value: e.target.value })}
                />
                <Label htmlFor="stat2_label">Stat 2 Label</Label>
                <Input
                  id="stat2_label"
                  value={formData.stat2_label}
                  onChange={(e) => setFormData({ ...formData, stat2_label: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stat3_value">Stat 3 Value</Label>
                <Input
                  id="stat3_value"
                  value={formData.stat3_value}
                  onChange={(e) => setFormData({ ...formData, stat3_value: e.target.value })}
                />
                <Label htmlFor="stat3_label">Stat 3 Label</Label>
                <Input
                  id="stat3_label"
                  value={formData.stat3_label}
                  onChange={(e) => setFormData({ ...formData, stat3_label: e.target.value })}
                />
              </div>
            </div>
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default HeroAdmin;
