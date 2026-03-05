import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import CompanyDataTable from "./CompanyDataTable";

const DeactiveCompaniesList = () => {
  const [companies, setCompanies] = useState<any[]>([]);
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
      toast({ title: "Error", description: "Failed to fetch deactive companies", variant: "destructive" });
    } else {
      setCompanies(data || []);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Deactive Companies</h2>
        <Button onClick={() => navigate("/admin/companies/add")}>Add New Company</Button>
      </div>
      <CompanyDataTable
        companies={companies}
        loading={loading}
        onRefresh={fetchDeactiveCompanies}
        showActivateAction
        showDeleteAction
      />
    </div>
  );
};

export default DeactiveCompaniesList;
