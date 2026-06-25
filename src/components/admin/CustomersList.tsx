import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Loader2, Pencil, Eye, Send, MoreHorizontal, Phone, CalendarPlus, User, PhoneIncoming } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useAdminLog } from "@/hooks/useAdminLog";
import CustomersSearch, { SearchFilters } from "./CustomersSearch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CustomersList = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { logAction } = useAdminLog();
  const [searchFilters, setSearchFilters] = useState<SearchFilters | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const { data: customers, isLoading, refetch } = useQuery({
    queryKey: ["customers-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_registrations")
        .select(`
          *,
          companies:company_id (name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    if (!searchFilters) return customers;

    return customers.filter((customer) => {
      // Location type filter
      if (searchFilters.locationType !== "all" && customer.location_type !== searchFilters.locationType) {
        return false;
      }

      // Warranty status filter
      if (searchFilters.warrantyStatus !== "all" && (customer.warranty_status || "active") !== searchFilters.warrantyStatus) {
        return false;
      }

      // Search term filter
      if (searchFilters.searchTerm) {
        const term = searchFilters.searchTerm.toLowerCase();
        const field = searchFilters.searchField;

        if (field === "all") {
          const searchableText = [
            customer.account_number,
            customer.ship_to_first_name,
            customer.ship_to_last_name,
            customer.email,
            customer.phone,
            customer.ship_to_address,
            customer.ship_to_city,
            customer.ship_to_business_name,
          ].filter(Boolean).join(" ").toLowerCase();
          return searchableText.includes(term);
        }

        if (field === "account_number") {
          return (customer.account_number || "").toLowerCase().includes(term);
        }
        if (field === "name") {
          const fullName = `${customer.ship_to_first_name} ${customer.ship_to_last_name}`.toLowerCase();
          return fullName.includes(term);
        }
        if (field === "email") {
          return (customer.email || "").toLowerCase().includes(term);
        }
        if (field === "phone") {
          return (customer.phone || "").toLowerCase().includes(term);
        }
        if (field === "address") {
          const address = `${customer.ship_to_address} ${customer.ship_to_city} ${customer.ship_to_state}`.toLowerCase();
          return address.includes(term);
        }
      }

      return true;
    });
  }, [customers, searchFilters]);

  const handleDelete = async (id: string, customerName: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;

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

  const handleEdit = (id: string) => {
    navigate(`/admin/customers/add?id=${id}`);
  };

  const handleSearch = (filters: SearchFilters) => {
    setSearchFilters(filters);
  };

  const handleClearSearch = () => {
    setSearchFilters(null);
  };

  const getWarrantyBadge = (status: string | null) => {
    const warrantyStatus = status || "active";
    switch (warrantyStatus) {
      case "active":
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      case "none":
        return <Badge variant="secondary">No Warranty</Badge>;
      default:
        return <Badge variant="secondary">{warrantyStatus}</Badge>;
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
        <span className="text-muted-foreground">
          {filteredCustomers.length} of {customers?.length || 0} customers
        </span>
      </div>

      <CustomersSearch onSearch={handleSearch} onClear={handleClearSearch} />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account #</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Warranty</TableHead>
              <TableHead>Company</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-mono text-sm">
                  {customer.account_number || "—"}
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {customer.ship_to_first_name} {customer.ship_to_last_name}
                  </div>
                  {customer.ship_to_business_name && (
                    <div className="text-sm text-muted-foreground">
                      {customer.ship_to_business_name}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm">{customer.email}</div>
                  <div className="text-sm text-muted-foreground">{customer.phone}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{customer.ship_to_address}</div>
                  <div className="text-sm text-muted-foreground">
                    {customer.ship_to_city}, {customer.ship_to_state} {customer.ship_to_zip_code}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={customer.location_type === "residential" ? "default" : "secondary"}>
                    {customer.location_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  {getWarrantyBadge(customer.warranty_status)}
                </TableCell>
                <TableCell className="text-sm">
                  {(customer.companies as any)?.name || "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setSelectedCustomer(customer)}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(customer.id)}
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" title="Actions">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 bg-popover z-50">
                        <DropdownMenuLabel>
                          {customer.ship_to_first_name} {customer.ship_to_last_name}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {customer.phone && (
                          <DropdownMenuItem asChild>
                            <a href={`tel:${customer.phone}`} className="cursor-pointer">
                              <Phone className="mr-2 h-4 w-4" /> Call {customer.phone}
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() =>
                            navigate(`/admin/sms-link/send?phone=${encodeURIComponent(customer.phone || "")}&type=${customer.location_type}`)
                          }
                        >
                          <Send className="mr-2 h-4 w-4" /> Send Invitation
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate(`/admin/appointments/add?customerId=${customer.id}`)}
                        >
                          <CalendarPlus className="mr-2 h-4 w-4" /> Book Appointment
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(customer.id)}>
                          <User className="mr-2 h-4 w-4" /> View Profile
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() =>
                            handleDelete(customer.id, `${customer.ship_to_first_name} ${customer.ship_to_last_name}`)
                          }
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredCustomers.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No customers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Customer Details Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>
              {selectedCustomer?.account_number && (
                <span className="font-mono">Account: {selectedCustomer.account_number}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Contact Information</h4>
                  <p className="text-sm">
                    {selectedCustomer.ship_to_first_name} {selectedCustomer.ship_to_last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Status</h4>
                  <div className="flex gap-2">
                    <Badge variant={selectedCustomer.location_type === "residential" ? "default" : "secondary"}>
                      {selectedCustomer.location_type}
                    </Badge>
                    {getWarrantyBadge(selectedCustomer.warranty_status)}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Ship To Address</h4>
                <p className="text-sm">{selectedCustomer.ship_to_address}</p>
                {selectedCustomer.ship_to_suite_number && (
                  <p className="text-sm">Suite: {selectedCustomer.ship_to_suite_number}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  {selectedCustomer.ship_to_city}, {selectedCustomer.ship_to_state} {selectedCustomer.ship_to_zip_code}
                </p>
              </div>

              {!selectedCustomer.bill_to_same_as_ship_to && selectedCustomer.bill_to_address && (
                <div>
                  <h4 className="font-semibold mb-2">Bill To Address</h4>
                  <p className="text-sm">
                    {selectedCustomer.bill_to_first_name} {selectedCustomer.bill_to_last_name}
                  </p>
                  <p className="text-sm">{selectedCustomer.bill_to_address}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedCustomer.bill_to_city}, {selectedCustomer.bill_to_state} {selectedCustomer.bill_to_zip_code}
                  </p>
                </div>
              )}

              {selectedCustomer.location_type === "commercial" && (
                <div>
                  <h4 className="font-semibold mb-2">Commercial Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {selectedCustomer.corporation_name && (
                      <p><span className="text-muted-foreground">Corporation:</span> {selectedCustomer.corporation_name}</p>
                    )}
                    {selectedCustomer.business_type && (
                      <p><span className="text-muted-foreground">Business Type:</span> {selectedCustomer.business_type}</p>
                    )}
                    {selectedCustomer.point_of_contact_name && (
                      <p><span className="text-muted-foreground">Contact:</span> {selectedCustomer.point_of_contact_name}</p>
                    )}
                    {selectedCustomer.hours_of_operation && (
                      <p><span className="text-muted-foreground">Hours:</span> {selectedCustomer.hours_of_operation}</p>
                    )}
                    {selectedCustomer.security_gate_access !== null && (
                      <p><span className="text-muted-foreground">Security Gate:</span> {selectedCustomer.security_gate_access ? "Yes" : "No"}</p>
                    )}
                    {selectedCustomer.ems_monitoring !== null && (
                      <p><span className="text-muted-foreground">EMS Monitoring:</span> {selectedCustomer.ems_monitoring ? "Yes" : "No"}</p>
                    )}
                  </div>
                </div>
              )}

              {selectedCustomer.location_type === "residential" && (
                <div>
                  <h4 className="font-semibold mb-2">Location Profile</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {selectedCustomer.build_year && (
                      <p><span className="text-muted-foreground">Build Year:</span> {selectedCustomer.build_year}</p>
                    )}
                    {selectedCustomer.housing_type && (
                      <p><span className="text-muted-foreground">Housing Type:</span> {selectedCustomer.housing_type}</p>
                    )}
                    {selectedCustomer.occupied_by && (
                      <p><span className="text-muted-foreground">Occupied By:</span> {selectedCustomer.occupied_by}</p>
                    )}
                    {selectedCustomer.residential_type && (
                      <p><span className="text-muted-foreground">Residential Type:</span> {selectedCustomer.residential_type}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Registered: {format(new Date(selectedCustomer.created_at), "MMM d, yyyy 'at' h:mm a")}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomersList;
