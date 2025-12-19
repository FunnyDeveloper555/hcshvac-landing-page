import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAdminLog } from "@/hooks/useAdminLog";

const ServicesAdd = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const isEditing = !!editId;
  const { logAction } = useAdminLog();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    detailed_description: "",
    icon: "Wrench",
    price_from: null as number | null,
    price_label: "Starting at",
    is_active: true,
    display_order: 0,
  });

  useEffect(() => {
    if (editId) {
      fetchService();
    }
  }, [editId]);

  const fetchService = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("id", editId)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load service",
        variant: "destructive",
      });
      navigate("/admin/services/list");
    } else if (data) {
      setFormData({
        title: data.title,
        description: data.description,
        detailed_description: data.detailed_description || "",
        icon: data.icon,
        price_from: data.price_from,
        price_label: data.price_label || "Starting at",
        is_active: data.is_active ?? true,
        display_order: data.display_order ?? 0,
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.description) {
      toast({
        title: "Error",
        description: "Title and description are required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    if (isEditing) {
      const { error } = await supabase
        .from("services")
        .update(formData)
        .eq("id", editId);
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Service updated successfully" });
        logAction("update", "service", editId, { title: formData.title });
        navigate("/admin/services/list");
      }
    } else {
      const { data, error } = await supabase
        .from("services")
        .insert([formData])
        .select()
        .single();
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Service created successfully" });
        logAction("create", "service", data.id, { title: formData.title });
        navigate("/admin/services/list");
      }
    }
    
    setSaving(false);
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
      <h2 className="text-3xl font-bold">{isEditing ? "Edit Service" : "Add New Service"}</h2>
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Update Service" : "Create Service"}</CardTitle>
          <CardDescription>{isEditing ? "Modify the service details" : "Add a new service offering"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>
          
          <div>
            <Label htmlFor="description">Short Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="detailed_description">Detailed Description</Label>
            <Textarea
              id="detailed_description"
              value={formData.detailed_description}
              onChange={(e) =>
                setFormData({ ...formData, detailed_description: e.target.value })
              }
              rows={6}
            />
          </div>

          <div>
            <Label htmlFor="icon">Icon (Lucide icon name)</Label>
            <Input
              id="icon"
              value={formData.icon}
              onChange={(e) =>
                setFormData({ ...formData, icon: e.target.value })
              }
              placeholder="e.g. Wind, Flame, Wrench"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price_label">Price Label</Label>
              <Input
                id="price_label"
                value={formData.price_label}
                onChange={(e) =>
                  setFormData({ ...formData, price_label: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="price_from">Price From</Label>
              <Input
                id="price_from"
                type="number"
                step="0.01"
                value={formData.price_from || ""}
                onChange={(e) =>
                  setFormData({ ...formData, price_from: e.target.value ? parseFloat(e.target.value) : null })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="display_order">Display Order</Label>
            <Input
              id="display_order"
              type="number"
              value={formData.display_order}
              onChange={(e) =>
                setFormData({ ...formData, display_order: parseInt(e.target.value) })
              }
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_active: checked })
              }
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isEditing ? "Update Service" : "Create Service"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin/services/list")}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServicesAdd;
