import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useAdminLog } from "@/hooks/useAdminLog";

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

const HeroAdd = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const isEditing = !!editId;
  const { logAction } = useAdminLog();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    badge_text: "24/7 Emergency Service Available",
    primary_button_text: "Call Now",
    primary_button_link: "tel:+1234567890",
    secondary_button_text: "View Our Services",
    secondary_button_link: "#services",
    stat1_value: "25+",
    stat1_label: "Years Experience",
    stat2_value: "10k+",
    stat2_label: "Happy Customers",
    stat3_value: "24/7",
    stat3_label: "Emergency Service",
  });

  useEffect(() => {
    if (editId) {
      fetchHeroContent();
    }
  }, [editId]);

  const fetchHeroContent = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("hero_content")
      .select("*")
      .eq("id", editId)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load hero content",
        variant: "destructive",
      });
      navigate("/admin/hero/list");
    } else if (data) {
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
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const validated = heroSchema.parse(formData);

      if (isEditing) {
        const { error } = await supabase
          .from("hero_content")
          .update(validated)
          .eq("id", editId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Hero content updated successfully",
        });
        logAction("update", "hero", editId, { title: formData.title });
      } else {
        const { data, error } = await supabase
          .from("hero_content")
          .insert([validated])
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Success",
          description: "Hero content created successfully",
        });
        logAction("create", "hero", data.id, { title: formData.title });
      }

      navigate("/admin/hero/list");
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
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">{isEditing ? "Edit Hero Content" : "Add Hero Content"}</h2>
      <Card>
        <CardHeader>
          <CardTitle>Hero Section Content</CardTitle>
          <CardDescription>
            {isEditing ? "Update the hero section content" : "Create new hero section content for the homepage"}
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

            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isEditing ? "Update Hero Content" : "Create Hero Content"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/admin/hero/list")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default HeroAdd;
