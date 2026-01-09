import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAdminLog } from "@/hooks/useAdminLog";

const ServiceTermsAdd = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const { toast } = useToast();
  const { logAction } = useAdminLog();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    display_order: 0,
    is_active: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editId) {
      fetchServiceTerm();
    }
  }, [editId]);

  const fetchServiceTerm = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("service_terms")
      .select("*")
      .eq("id", editId)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch service term",
        variant: "destructive",
      });
    } else if (data) {
      setFormData({
        title: data.title,
        content: data.content,
        display_order: data.display_order || 0,
        is_active: data.is_active ?? true,
      });
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Error",
        description: "Title and content are required",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    if (editId) {
      const { error } = await supabase
        .from("service_terms")
        .update(formData)
        .eq("id", editId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update service term",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Service term updated successfully",
        });
        logAction("update", "service_term", editId, { title: formData.title });
        navigate("/admin/services/terms");
      }
    } else {
      const { data, error } = await supabase
        .from("service_terms")
        .insert(formData)
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create service term",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Service term created successfully",
        });
        logAction("create", "service_term", data.id, { title: formData.title });
        navigate("/admin/services/terms");
      }
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">
        {editId ? "Edit Service Term" : "Add Service Term"}
      </h2>

      <Card>
        <CardHeader>
          <CardTitle>Service Term Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Enter term title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              placeholder="Enter term content"
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_order">Display Order</Label>
            <Input
              id="display_order"
              type="number"
              value={formData.display_order}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  display_order: parseInt(e.target.value) || 0,
                })
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

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editId ? "Update" : "Create"}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/admin/services/terms")}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceTermsAdd;
