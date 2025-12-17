import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, MapPin, Phone, Mail, Building2, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAdminLog } from "@/hooks/useAdminLog";

const CustomersList = () => {
  const { toast } = useToast();
  const { logAction } = useAdminLog();
  
  const { data: customers, isLoading, refetch } = useQuery({
    queryKey: ["customers-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_registrations")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (id: string, customerName: string) => {
    const { error } = await supabase
      .from("customer_registrations")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
      logAction("delete", "customer", id, { customer_name: customerName });
      refetch();
    }
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
        <h2 className="text-3xl font-bold">Customers List</h2>
        <span className="text-muted-foreground">{customers?.length || 0} customers</span>
      </div>

      <div className="grid gap-4">
        {customers?.map((customer) => (
          <Card key={customer.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {customer.location_type === "residential" ? (
                      <Home className="h-5 w-5 text-primary" />
                    ) : (
                      <Building2 className="h-5 w-5 text-primary" />
                    )}
                    {customer.ship_to_first_name} {customer.ship_to_last_name}
                  </CardTitle>
                  {customer.ship_to_business_name && (
                    <p className="text-sm text-muted-foreground mt-1">{customer.ship_to_business_name}</p>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  customer.location_type === "residential" 
                    ? "bg-green-100 text-green-800" 
                    : "bg-blue-100 text-blue-800"
                }`}>
                  {customer.location_type}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{customer.email}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{customer.phone}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Ship To Address
                </p>
                <p className="text-sm">
                  {customer.ship_to_address}
                  {customer.ship_to_suite_number && `, Suite ${customer.ship_to_suite_number}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {customer.ship_to_city}, {customer.ship_to_state} {customer.ship_to_zip_code}
                </p>
              </div>

              {!customer.bill_to_same_as_ship_to && customer.bill_to_address && (
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold mb-2">Bill To Address</p>
                  <p className="text-sm">
                    {customer.bill_to_first_name} {customer.bill_to_last_name}
                    {customer.bill_to_business_name && ` - ${customer.bill_to_business_name}`}
                  </p>
                  <p className="text-sm">
                    {customer.bill_to_address}
                    {customer.bill_to_suite_number && `, Suite ${customer.bill_to_suite_number}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {customer.bill_to_city}, {customer.bill_to_state} {customer.bill_to_zip_code}
                  </p>
                </div>
              )}

              {customer.location_type === "commercial" && (
                <div className="border-t pt-4 grid grid-cols-2 gap-4 text-sm">
                  {customer.point_of_contact_name && (
                    <div>
                      <span className="text-muted-foreground">Contact:</span> {customer.point_of_contact_name}
                    </div>
                  )}
                  {customer.hours_of_operation && (
                    <div>
                      <span className="text-muted-foreground">Hours:</span> {customer.hours_of_operation}
                    </div>
                  )}
                  {customer.equipment_location && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Equipment Location:</span> {customer.equipment_location}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-xs text-muted-foreground">
                  Registered: {format(new Date(customer.created_at), "MMM d, yyyy 'at' h:mm a")}
                </span>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handleDelete(customer.id, `${customer.ship_to_first_name} ${customer.ship_to_last_name}`)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {customers?.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No customers found.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CustomersList;
