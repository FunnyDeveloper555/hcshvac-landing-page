import { Building2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Company {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  logo_url?: string;
}

const CompanyMarquee = () => {
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    const { data } = await supabase
      .from("companies")
      .select("*")
      .eq("is_active", true)
      .order("display_order");
    
    if (data) {
      setCompanies(data);
    }
  };

  if (companies.length === 0) {
    return null;
  }
  return (
    <section className="py-16 bg-accent/5 overflow-hidden">
      <div className="container mx-auto px-4 mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-center">
          Trusted by Leading Businesses
        </h2>
      </div>
      
      <div className="relative">
        <div className="flex animate-marquee hover:[animation-play-state:paused]">
          {/* First set of companies */}
          {companies.map((company) => (
            <div
              key={`first-${company.id}`}
              className="flex items-center gap-3 mx-8 min-w-fit"
            >
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <Building2 className="text-accent" size={24} />
              )}
              <span className="text-lg font-medium whitespace-nowrap">
                {company.name}
              </span>
            </div>
          ))}
          
          {/* Duplicate set for seamless loop */}
          {companies.map((company) => (
            <div
              key={`second-${company.id}`}
              className="flex items-center gap-3 mx-8 min-w-fit"
            >
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <Building2 className="text-accent" size={24} />
              )}
              <span className="text-lg font-medium whitespace-nowrap">
                {company.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CompanyMarquee;
