import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const VendorsList = () => {
  const { toast } = useToast();
  
  const { data: vendors, isLoading, refetch } = useQuery({
    queryKey: ["vendors-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select(`
          *,
          vendor_industries (
            id,
            product_category,
            product_brand
          )
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (id: string, logoUrl: string | null) => {
    // Delete logo from storage if exists
    if (logoUrl) {
      const fileName = logoUrl.split("/").pop();
      if (fileName) {
        await supabase.storage.from("vendor-logos").remove([fileName]);
      }
    }

    // Delete from database (cascade will delete vendor_industries)
    const { error } = await supabase
      .from("vendors")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete vendor",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Vendor deleted successfully",
      });
      refetch();
    }
  };

  if (isLoading) {
    return <div className="text-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Vendors List</h2>
      </div>

      <div className="grid gap-4">
        {vendors?.map((vendor) => (
          <Card key={vendor.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle>{vendor.vendor_name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{vendor.vendor_address}</p>
                </div>
                {vendor.logo_url && (
                  <img 
                    src={vendor.logo_url} 
                    alt={vendor.vendor_name}
                    className="w-20 h-20 object-contain bg-muted rounded p-2"
                  />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Phone:</span> {vendor.phone}
                </div>
                <div>
                  <span className="text-muted-foreground">Hours:</span> {vendor.hours_of_operation}
                </div>
                {vendor.website && (
                  <div className="col-span-2">
                    <a 
                      href={vendor.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Website <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-semibold mb-2">Representative:</p>
                <p className="text-sm">
                  {vendor.representative_first_name} {vendor.representative_last_name}
                </p>
                <p className="text-sm text-muted-foreground">{vendor.representative_email}</p>
                <p className="text-sm text-muted-foreground">{vendor.representative_phone}</p>
              </div>

              {vendor.vendor_industries && vendor.vendor_industries.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold mb-2">Industries:</p>
                  <div className="space-y-2">
                    {vendor.vendor_industries.map((industry: any) => (
                      <div key={industry.id} className="text-sm bg-muted p-2 rounded">
                        <span className="font-medium">{industry.product_category}</span>
                        {industry.product_brand && (
                          <span className="text-muted-foreground"> - {industry.product_brand}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4">
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handleDelete(vendor.id, vendor.logo_url)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {vendors?.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No vendors found. Add your first one!
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VendorsList;
