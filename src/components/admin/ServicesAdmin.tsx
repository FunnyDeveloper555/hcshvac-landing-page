import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Trash2, Plus } from "lucide-react";

interface Service {
  id: string;
  title: string;
  description: string;
  detailed_description: string | null;
  icon: string;
  price_from: number | null;
  price_label: string;
  is_active: boolean;
  display_order: number;
}

const ServicesAdmin = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [editingService, setEditingService] = useState<Partial<Service>>({
    title: "",
    description: "",
    detailed_description: "",
    icon: "Wrench",
    price_from: null,
    price_label: "Starting at",
    is_active: true,
    display_order: 0,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data } = await supabase
      .from("services")
      .select("*")
      .order("display_order", { ascending: true });
    
    if (data) setServices(data);
  };

  const handleSave = async () => {
    if (!editingService.title || !editingService.description) {
      toast({
        title: "Error",
        description: "Title and description are required",
        variant: "destructive",
      });
      return;
    }

    if (editingService.id) {
      const { error } = await supabase
        .from("services")
        .update({
          title: editingService.title!,
          description: editingService.description!,
          detailed_description: editingService.detailed_description,
          icon: editingService.icon!,
          price_from: editingService.price_from,
          price_label: editingService.price_label!,
          is_active: editingService.is_active,
          display_order: editingService.display_order,
        })
        .eq("id", editingService.id);
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Service updated successfully" });
      }
    } else {
      const { error } = await supabase
        .from("services")
        .insert([{
          title: editingService.title!,
          description: editingService.description!,
          detailed_description: editingService.detailed_description,
          icon: editingService.icon!,
          price_from: editingService.price_from,
          price_label: editingService.price_label!,
          is_active: editingService.is_active,
          display_order: editingService.display_order,
        }]);
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Service created successfully" });
      }
    }

    setEditingService({
      title: "",
      description: "",
      detailed_description: "",
      icon: "Wrench",
      price_from: null,
      price_label: "Starting at",
      is_active: true,
      display_order: 0,
    });
    fetchServices();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", id);
    
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Service deleted successfully" });
      fetchServices();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingService.id ? "Edit Service" : "Add New Service"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={editingService.title}
              onChange={(e) =>
                setEditingService({ ...editingService, title: e.target.value })
              }
            />
          </div>
          
          <div>
            <Label htmlFor="description">Short Description</Label>
            <Textarea
              id="description"
              value={editingService.description}
              onChange={(e) =>
                setEditingService({ ...editingService, description: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="detailed_description">Detailed Description</Label>
            <Textarea
              id="detailed_description"
              value={editingService.detailed_description || ""}
              onChange={(e) =>
                setEditingService({ ...editingService, detailed_description: e.target.value })
              }
              rows={6}
            />
          </div>

          <div>
            <Label htmlFor="icon">Icon (Lucide icon name)</Label>
            <Input
              id="icon"
              value={editingService.icon}
              onChange={(e) =>
                setEditingService({ ...editingService, icon: e.target.value })
              }
              placeholder="e.g. Wind, Flame, Wrench"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price_label">Price Label</Label>
              <Input
                id="price_label"
                value={editingService.price_label}
                onChange={(e) =>
                  setEditingService({ ...editingService, price_label: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="price_from">Price From</Label>
              <Input
                id="price_from"
                type="number"
                step="0.01"
                value={editingService.price_from || ""}
                onChange={(e) =>
                  setEditingService({ ...editingService, price_from: e.target.value ? parseFloat(e.target.value) : null })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="display_order">Display Order</Label>
            <Input
              id="display_order"
              type="number"
              value={editingService.display_order}
              onChange={(e) =>
                setEditingService({ ...editingService, display_order: parseInt(e.target.value) })
              }
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={editingService.is_active}
              onCheckedChange={(checked) =>
                setEditingService({ ...editingService, is_active: checked })
              }
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave}>
              {editingService.id ? "Update Service" : "Add Service"}
            </Button>
            {editingService.id && (
              <Button
                variant="outline"
                onClick={() =>
                  setEditingService({
                    title: "",
                    description: "",
                    detailed_description: "",
                    icon: "Wrench",
                    price_from: null,
                    price_label: "Starting at",
                    is_active: true,
                    display_order: 0,
                  })
                }
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {services.map((service) => (
          <Card key={service.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{service.title}</h3>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                  {service.price_from && (
                    <p className="text-sm mt-2">
                      {service.price_label} ${service.price_from}
                    </p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-secondary">
                      Order: {service.display_order}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${service.is_active ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'}`}>
                      {service.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingService(service)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(service.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ServicesAdmin;