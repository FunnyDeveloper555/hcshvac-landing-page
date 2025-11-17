import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Company {
  id: string;
  name: string;
  company_phone?: string;
  company_email_primary?: string;
  is_active: boolean;
  logo_url?: string;
  created_at: string;
}

const DeactiveCompaniesList = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDeactiveCompanies();
  }, []);

  const fetchDeactiveCompanies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("is_active", false)
      .order("display_order", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch deactive companies",
        variant: "destructive",
      });
    } else {
      setCompanies(data || []);
    }
    setLoading(false);
  };

  const handleActivate = async (id: string) => {
    const { error } = await supabase
      .from("companies")
      .update({ is_active: true })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to activate company",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Company activated successfully",
      });
      fetchDeactiveCompanies();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this company?")) {
      return;
    }

    const { error } = await supabase
      .from("companies")
      .delete()
      .eq("id", id);

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
      fetchDeactiveCompanies();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Deactive Companies</h2>
        <Button onClick={() => navigate("/admin/companies/add")}>
          Add New Company
        </Button>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No deactive companies found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {companies.map((company) => (
            <Card key={company.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {company.logo_url && (
                      <img
                        src={company.logo_url}
                        alt={company.name}
                        className="w-12 h-12 object-contain"
                      />
                    )}
                    <span>{company.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/companies/view/${company.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleActivate(company.id)}
                    >
                      Activate
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(company.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {company.company_phone && (
                    <div>
                      <span className="font-semibold">Phone:</span> {company.company_phone}
                    </div>
                  )}
                  {company.company_email_primary && (
                    <div>
                      <span className="font-semibold">Email:</span> {company.company_email_primary}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeactiveCompaniesList;
