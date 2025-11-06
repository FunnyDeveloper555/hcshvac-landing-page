import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Pencil, Trash2, Upload } from "lucide-react";

interface Company {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  logo_url?: string;
}

const CompaniesAdmin = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Partial<Company>>({
    name: "",
    display_order: 0,
    is_active: true,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .order("display_order");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch companies",
        variant: "destructive",
      });
    } else {
      setCompanies(data || []);
    }
    setLoading(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 2MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath);

      setEditingCompany({ ...editingCompany, logo_url: publicUrl });

      toast({
        title: "Success",
        description: "Logo uploaded successfully",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload logo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!editingCompany.name?.trim()) {
      toast({
        title: "Validation Error",
        description: "Company name is required",
        variant: "destructive",
      });
      return;
    }

    if (editingCompany.id) {
      const { error } = await supabase
        .from("companies")
        .update({
          name: editingCompany.name,
          display_order: editingCompany.display_order || 0,
          is_active: editingCompany.is_active,
          logo_url: editingCompany.logo_url,
        })
        .eq("id", editingCompany.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update company",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Company updated successfully",
        });
        fetchCompanies();
        setEditingCompany({ name: "", display_order: 0, is_active: true });
      }
    } else {
      const { error } = await supabase
        .from("companies")
        .insert({
          name: editingCompany.name,
          display_order: editingCompany.display_order || 0,
          is_active: editingCompany.is_active ?? true,
          logo_url: editingCompany.logo_url,
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create company",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Company created successfully",
        });
        fetchCompanies();
        setEditingCompany({ name: "", display_order: 0, is_active: true });
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this company?")) return;

    const { error } = await supabase.from("companies").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete company",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Company deleted successfully",
      });
      fetchCompanies();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {editingCompany.id ? "Edit Company" : "Add New Company"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                value={editingCompany.name || ""}
                onChange={(e) =>
                  setEditingCompany({ ...editingCompany, name: e.target.value })
                }
                placeholder="Enter company name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                value={editingCompany.display_order || 0}
                onChange={(e) =>
                  setEditingCompany({
                    ...editingCompany,
                    display_order: parseInt(e.target.value),
                  })
                }
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">Company Logo</Label>
            <div className="flex items-center gap-4">
              {editingCompany.logo_url && (
                <img
                  src={editingCompany.logo_url}
                  alt="Logo preview"
                  className="w-16 h-16 object-contain border rounded"
                />
              )}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Logo
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={editingCompany.is_active ?? true}
              onCheckedChange={(checked) =>
                setEditingCompany({ ...editingCompany, is_active: checked })
              }
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave}>
              {editingCompany.id ? "Update" : "Create"} Company
            </Button>
            {editingCompany.id && (
              <Button
                variant="outline"
                onClick={() =>
                  setEditingCompany({ name: "", display_order: 0, is_active: true })
                }
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Companies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {companies.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No companies yet. Add your first company above.
              </p>
            ) : (
              companies.map((company) => (
                <div
                  key={company.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {company.logo_url && (
                      <img
                        src={company.logo_url}
                        alt={company.name}
                        className="w-12 h-12 object-contain"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold">{company.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Order: {company.display_order} • 
                        {company.is_active ? " Active" : " Inactive"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingCompany(company)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(company.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompaniesAdmin;
