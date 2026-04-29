import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Trash2, ExternalLink, Loader2, Pencil } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAdminLog } from "@/hooks/useAdminLog";

const VendorsList = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { logAction } = useAdminLog();

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
            product_brand_name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (id: string, logoUrl: string | null, vendorName: string) => {
    if (logoUrl) {
      const fileName = logoUrl.split("/").pop();
      if (fileName) {
        await supabase.storage.from("vendor-logos").remove([fileName]);
      }
    }

    const { error } = await supabase.from("vendors").delete().eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to delete vendor", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Vendor deleted successfully" });
      logAction("delete", "vendor", id, { vendor_name: vendorName });
      refetch();
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/admin/vendors/add?id=${id}`);
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
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Vendors List</h2>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Logo</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Representative</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Industries</TableHead>
              <TableHead>Website</TableHead>
              <TableHead className="text-right w-[140px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors?.map((vendor) => (
              <TableRow key={vendor.id}>
                <TableCell>
                  {vendor.logo_url ? (
                    <img
                      src={vendor.logo_url}
                      alt={vendor.vendor_name}
                      className="w-10 h-10 object-contain bg-muted rounded p-1"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-muted rounded" />
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{vendor.vendor_name}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">
                    {vendor.vendor_address}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {vendor.representative_first_name} {vendor.representative_last_name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {vendor.representative_email}
                  </div>
                </TableCell>
                <TableCell className="text-sm">{vendor.phone}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {vendor.vendor_industries?.slice(0, 3).map((ind: any) => (
                      <span
                        key={ind.id}
                        className="text-xs bg-muted px-2 py-0.5 rounded"
                      >
                        {ind.product_category}
                      </span>
                    ))}
                    {vendor.vendor_industries?.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{vendor.vendor_industries.length - 3}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {vendor.website ? (
                    <a
                      href={vendor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
                    >
                      Visit <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(vendor.id)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(vendor.id, vendor.logo_url, vendor.vendor_name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {vendors?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No vendors found. Add your first one!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default VendorsList;

