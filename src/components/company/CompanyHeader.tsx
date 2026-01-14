import { Phone, Mail, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeConfig } from "@/lib/companyThemes";
import { cn } from "@/lib/utils";

interface Company {
  name: string;
  logo_url: string | null;
  company_phone: string | null;
  company_email_primary: string | null;
}

interface CompanyHeaderProps {
  company: Company;
  theme: ThemeConfig;
}

const CompanyHeader = ({ company, theme }: CompanyHeaderProps) => {
  const headerStyles = {
    standard: "bg-background/95 backdrop-blur-sm border-b border-border",
    centered: "bg-background border-b-2 border-primary/20",
    minimal: "bg-transparent",
    bold: "bg-primary text-primary-foreground",
    transparent: "bg-gradient-to-b from-background/80 to-transparent backdrop-blur-sm",
  };

  const isBoldHeader = theme.layout.headerStyle === 'bold';
  const isTransparent = theme.layout.headerStyle === 'transparent' || theme.layout.headerStyle === 'minimal';

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      headerStyles[theme.layout.headerStyle]
    )}>
      <div className={cn(
        "container mx-auto px-4 py-4",
        theme.layout.headerStyle === 'centered' && "text-center"
      )}>
        <div className={cn(
          "flex items-center",
          theme.layout.headerStyle === 'centered' ? "justify-center flex-wrap gap-4" : "justify-between"
        )}>
          {/* Logo */}
          <div className={cn(
            "flex items-center gap-3",
            theme.layout.headerStyle === 'centered' && "justify-center w-full md:w-auto"
          )}>
            {company.logo_url ? (
              <img 
                src={company.logo_url} 
                alt={`${company.name} logo`}
                className="h-10 w-auto object-contain"
              />
            ) : (
              <h1 className={cn(
                "text-2xl",
                isBoldHeader ? "text-primary-foreground font-black" : "text-primary font-bold"
              )}>
                {company.name}
              </h1>
            )}
          </div>
          
          {/* Contact Info */}
          <div className={cn(
            "flex items-center gap-4",
            theme.layout.headerStyle === 'centered' && "justify-center"
          )}>
            {company.company_email_primary && (
              <a 
                href={`mailto:${company.company_email_primary}`}
                className={cn(
                  "hidden lg:flex items-center gap-2 transition-colors",
                  isBoldHeader 
                    ? "text-primary-foreground/80 hover:text-primary-foreground" 
                    : "text-foreground hover:text-primary"
                )}
              >
                <Mail className="w-4 h-4" />
                <span className="text-sm">{company.company_email_primary}</span>
              </a>
            )}
            
            {company.company_phone && (
              <Button 
                variant={isBoldHeader ? "secondary" : "accent"}
                size="sm"
                className={cn(
                  theme.typography.rounded === 'none' && "rounded-none",
                  theme.typography.rounded === 'full' && "rounded-full",
                  theme.typography.rounded === '2xl' && "rounded-2xl"
                )}
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
