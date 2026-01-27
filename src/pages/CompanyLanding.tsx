import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import CompanyHeader from "@/components/company/CompanyHeader";
import CompanyHero from "@/components/company/CompanyHero";
import CompanyServices from "@/components/company/CompanyServices";
import CompanyServiceAreas from "@/components/company/CompanyServiceAreas";
import CompanyContact from "@/components/company/CompanyContact";
import CompanyFooter from "@/components/company/CompanyFooter";
import { Loader2 } from "lucide-react";
import { getThemeConfig, ThemeStyle } from "@/lib/companyThemes";

interface PageContent {
  title: string;
  subtitle: string;
  content: string;
  enabled: boolean;
}

interface Company {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  company_address: string | null;
  company_city: string | null;
  company_state: string | null;
  company_zip_code: string | null;
  company_phone: string | null;
  company_email_primary: string | null;
  company_support_email: string | null;
  services_provided: string[] | null;
  service_areas: string[] | null;
  brands_installed: string[] | null;
  brands_serviced: string[] | null;
  website_title: string | null;
  website_tagline: string | null;
  website_description: string | null;
  primary_color: string | null;
  hero_image_url: string | null;
  affiliations: Record<string, string> | null;
  theme_style: ThemeStyle | null;
  header_pages: Record<string, PageContent> | null;
}

const HEADER_PAGES = [
  { key: "about-us", label: "About Us" },
  { key: "financing", label: "Financing" },
  { key: "services", label: "Services" },
  { key: "residential", label: "Residential" },
  { key: "commercial", label: "Commercial" },
  { key: "air-quality", label: "Air Quality" },
];

const CompanyLanding = () => {
  const { slug } = useParams<{ slug: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [services, setServices] = useState<Array<{ id: string; title: string; description: string; icon: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activePage, setActivePage] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompany = async () => {
      if (!slug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setCompany(data as unknown as Company);

      const servicesProvided = data.services_provided as string[] | null;
      if (servicesProvided && Array.isArray(servicesProvided) && servicesProvided.length > 0) {
        const { data: servicesData } = await supabase
          .from("services")
          .select("id, title, description, icon")
          .in("id", servicesProvided)
          .eq("is_active", true);

        if (servicesData) {
          setServices(servicesData);
        }
      }

      setLoading(false);
    };

    fetchCompany();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Company Not Found</h1>
          <p className="text-muted-foreground">The company you're looking for doesn't exist or is no longer active.</p>
        </div>
      </div>
    );
  }

  const themeStyle = company.theme_style || 'modern';
  const theme = getThemeConfig(themeStyle);

  const handlePageChange = (pageKey: string) => {
    setActivePage(pageKey);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHome = () => {
    setActivePage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get page label for display
  const getPageLabel = (pageKey: string) => {
    return HEADER_PAGES.find(p => p.key === pageKey)?.label || pageKey;
  };

  // Get active page content
  const activePageContent = activePage ? company.header_pages?.[activePage] : null;

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{
        "--primary": theme.colors.primary,
        "--secondary": theme.colors.secondary,
        "--accent": theme.colors.accent,
        "--background": theme.colors.background,
        "--foreground": theme.colors.foreground,
        "--muted": theme.colors.muted,
        "--muted-foreground": theme.colors.mutedForeground,
        "--card": theme.colors.card,
        "--card-foreground": theme.colors.cardForeground,
        "--border": theme.colors.border,
        "--ring": theme.colors.primary,
      } as React.CSSProperties}
    >
      <CompanyHeader 
        company={company} 
        theme={theme} 
        activePage={activePage || undefined}
        onPageChange={handlePageChange}
      />
      <main className="flex-1">
        {activePage ? (
          // Show the selected page content
          <section className="pt-24 pb-16">
            <div className="container mx-auto px-4">
              <button 
                onClick={handleBackToHome}
                className="mb-6 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                ← Back to Home
              </button>
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                  <h1 className="text-4xl md:text-5xl font-bold mb-4">
                    {activePageContent?.title || getPageLabel(activePage)}
                  </h1>
                  {activePageContent?.subtitle && (
                    <p className="text-xl text-muted-foreground">{activePageContent.subtitle}</p>
                  )}
                </div>
                <div className="prose prose-lg max-w-none">
                  <p className="whitespace-pre-wrap text-foreground/80 leading-relaxed">
                    {activePageContent?.content || "Content for this page is coming soon."}
                  </p>
                </div>
              </div>
            </div>
          </section>
        ) : (
          // Show the home page content
          <>
            <CompanyHero company={company} theme={theme} />
            <CompanyServices company={company} services={services} theme={theme} />
            <CompanyServiceAreas company={company} />
            <CompanyContact company={company} theme={theme} />
          </>
        )}
      </main>
      <CompanyFooter company={company} theme={theme} />
    </div>
  );
};

export default CompanyLanding;
