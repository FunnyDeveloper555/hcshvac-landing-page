import { Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Company {
  name: string;
  logo_url: string | null;
  company_phone: string | null;
  company_email_primary: string | null;
}

interface CompanyHeaderProps {
  company: Company;
}

const CompanyHeader = ({ company }: CompanyHeaderProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {company.logo_url ? (
              <img 
                src={company.logo_url} 
                alt={`${company.name} logo`}
                className="h-10 w-auto object-contain"
              />
            ) : (
              <h1 className="text-2xl font-bold text-primary">{company.name}</h1>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {company.company_email_primary && (
              <a 
                href={`mailto:${company.company_email_primary}`}
                className="hidden lg:flex items-center gap-2 text-foreground hover:text-primary transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span className="text-sm">{company.company_email_primary}</span>
              </a>
            )}
            
            {company.company_phone && (
              <Button 
                variant="accent" 
                size="sm"
                onClick={() => window.location.href = `tel:${company.company_phone}`}
              >
                <Phone className="w-4 h-4" />
                <span className="hidden sm:inline">{company.company_phone}</span>
                <span className="sm:hidden">Call Now</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default CompanyHeader;
