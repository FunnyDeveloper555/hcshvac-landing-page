import { useState } from "react";
import { ChevronDown, Mail, Menu, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeConfig } from "@/lib/companyThemes";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";


interface PageContent {
  title: string;
  subtitle: string;
  content: string;
  enabled: boolean;
}

interface Company {
  name: string;
  logo_url: string | null;
  company_phone: string | null;
  company_email_primary: string | null;
  header_pages?: Record<string, PageContent> | null;
}

interface CompanyHeaderProps {
  company: Company;
  theme: ThemeConfig;
  activePage?: string;
  onPageChange?: (pageKey: string) => void;
  onGoHome?: () => void;
}

const HEADER_PAGES = [
  { key: "about-us", label: "About Us" },
  { key: "financing", label: "Financing" },
  {
    key: "services",
    label: "Services",
    children: [
      { key: "residential", label: "Residential" },
      { key: "commercial", label: "Commercial" },
      { key: "light-industrial", label: "Light Industrial" },
      { key: "industrial", label: "Industrial" },
      { key: "educational", label: "Educational" },
      { key: "medical", label: "Medical" },
      { key: "churches", label: "Churches" },
    ],
  },
  { key: "products", label: "Products" },
  { key: "air-quality", label: "Air Quality" },
];


const CompanyHeader = ({ company, theme, activePage, onPageChange, onGoHome }: CompanyHeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<Record<string, boolean>>({});


  const headerStyles = {
    standard: "bg-background/95 backdrop-blur-sm border-b border-border",
    centered: "bg-background border-b-2 border-primary/20",
    minimal: "bg-transparent",
    bold: "bg-primary text-primary-foreground",
    transparent: "bg-gradient-to-b from-background/80 to-transparent backdrop-blur-sm",
  };

  const isBoldHeader = theme.layout.headerStyle === 'bold';

  // Get enabled pages (including nested service location types)
  const pageEnabled = (key: string) => {
    const pageData = company.header_pages?.[key];
    return pageData?.enabled !== false; // Show by default if not configured
  };

  const enabledPages = HEADER_PAGES.filter((page) => {
    const selfEnabled = pageEnabled(page.key);
    if (!selfEnabled) return false;
    if (page.children) {
      const visibleChildren = page.children.filter((child) => pageEnabled(child.key));
      if (visibleChildren.length === 0) return false;
    }
    return true;
  }).map((page) => ({
    ...page,
    children: page.children?.filter((child) => pageEnabled(child.key)),
  }));


  const handlePageClick = (pageKey: string) => {
    // If clicking the already-active page, go home
    if (activePage === pageKey) {
      onGoHome?.();
    } else if (onPageChange) {
      onPageChange(pageKey);
    }
    setMobileMenuOpen(false);
  };

  const handleLogoClick = () => {
    onGoHome?.();
    setMobileMenuOpen(false);
  };

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      headerStyles[theme.layout.headerStyle]
    )}>
      <div className={cn(
        "container mx-auto px-4 py-3",
        theme.layout.headerStyle === 'centered' && "text-center"
      )}>
        <div className={cn(
          "flex items-center",
          theme.layout.headerStyle === 'centered' ? "justify-center flex-wrap gap-4" : "justify-between"
        )}>
          {/* Logo */}
          <div className={cn(
            "flex items-center gap-3 cursor-pointer",
            theme.layout.headerStyle === 'centered' && "justify-center w-full md:w-auto"
          )}
            onClick={handleLogoClick}
          >
            {company.logo_url ? (
              <img 
                src={company.logo_url} 
                alt={`${company.name} logo`}
                className="h-14 md:h-16 w-auto object-contain"
              />
            ) : (
              <h1 className={cn(
                "text-xl md:text-2xl",
                isBoldHeader ? "text-primary-foreground font-black" : "text-primary font-bold"
              )}>
                {company.name}
              </h1>
            )}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={handleLogoClick}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                !activePage 
                  ? (isBoldHeader ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary")
                  : (isBoldHeader ? "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10" : "text-foreground/70 hover:text-foreground hover:bg-muted")
              )}
            >
              Home
            </button>
            {enabledPages.map((page) => {
              const hasChildren = page.children && page.children.length > 0;
              const isActive = activePage === page.key || page.children?.some((c) => c.key === activePage);
              return (
                <div
                  key={page.key}
                  className="relative"
                  onMouseEnter={() => hasChildren && setOpenDropdown(page.key)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    onClick={() => {
                      if (hasChildren) {
                        setOpenDropdown(openDropdown === page.key ? null : page.key);
                      } else {
                        handlePageClick(page.key);
                      }
                    }}
                    className={cn(
                      "px-3 py-2 text-sm font-medium rounded-md transition-colors inline-flex items-center gap-1",
                      isActive
                        ? (isBoldHeader ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary")
                        : (isBoldHeader ? "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10" : "text-foreground/70 hover:text-foreground hover:bg-muted")
                    )}
                  >
                    {company.header_pages?.[page.key]?.title || page.label}
                    {hasChildren && <ChevronDown className="w-4 h-4" />}
                  </button>

                  {hasChildren && openDropdown === page.key && (
                    <div className="absolute top-full left-0 mt-1 w-56 rounded-md border bg-background shadow-lg z-50 py-1">
                      {page.children?.map((child) => (
                        <button
                          key={child.key}
                          onClick={() => {
                            handlePageClick(child.key);
                            setOpenDropdown(null);
                          }}
                          className={cn(
                            "w-full text-left px-4 py-2 text-sm transition-colors",
                            activePage === child.key
                              ? (isBoldHeader ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary")
                              : "hover:bg-muted"
                          )}
                        >
                          {company.header_pages?.[child.key]?.title || child.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

          </nav>
          
          {/* Contact Info & Mobile Menu */}
          <div className={cn(
            "flex items-center gap-2",
            theme.layout.headerStyle === 'centered' && "justify-center"
          )}>
            {company.company_email_primary && (
              <a 
                href={`mailto:${company.company_email_primary}`}
                className={cn(
                  "hidden xl:flex items-center gap-2 transition-colors",
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
                variant={isBoldHeader ? "secondary" : "default"}
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
                <span className="sm:hidden">Call</span>
              </Button>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn(
                    "lg:hidden",
                    isBoldHeader && "text-primary-foreground hover:bg-primary-foreground/10"
                  )}
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[350px]">
                <nav className="flex flex-col gap-2 mt-8">
                  <button
                    onClick={handleLogoClick}
                    className={cn(
                      "px-4 py-3 text-left text-base font-medium rounded-lg transition-colors",
                      !activePage 
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    Home
                  </button>
                  {enabledPages.map(page => (
                    <button
                      key={page.key}
                      onClick={() => handlePageClick(page.key)}
                      className={cn(
                        "px-4 py-3 text-left text-base font-medium rounded-lg transition-colors",
                        activePage === page.key 
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      {company.header_pages?.[page.key]?.title || page.label}
                    </button>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default CompanyHeader;
