import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import CompanyHeader from "@/components/company/CompanyHeader";
import CompanyHero from "@/components/company/CompanyHero";
import CompanyServices from "@/components/company/CompanyServices";
import CompanyServiceAreasAccordion from "@/components/company/CompanyServiceAreasAccordion";
import CompanyBrandsAccordion from "@/components/company/CompanyBrandsAccordion";
import CompanyBrandsServiceAccordion from "@/components/company/CompanyBrandsServiceAccordion";
import CompanyBrandsRepairAccordion from "@/components/company/CompanyBrandsRepairAccordion";
import PlumbingTypesInstallAccordion from "@/components/company/PlumbingTypesInstallAccordion";
import PlumbingTypesServiceAccordion from "@/components/company/PlumbingTypesServiceAccordion";
import PlumbingTypesRepairAccordion from "@/components/company/PlumbingTypesRepairAccordion";
import CompanyContact from "@/components/company/CompanyContact";
import CompanyFooter from "@/components/company/CompanyFooter";
import CompanyCTAIcons from "@/components/company/CompanyCTAIcons";
import CompanyCoupons from "@/components/company/CompanyCoupons";
import CompanyPartnerAccordion from "@/components/company/CompanyPartnerAccordion";
import CompanyPopup from "@/components/company/CompanyPopup";
import CompanyPageContent from "@/components/company/CompanyPageContent";
import CompanyProductsList from "@/components/company/CompanyProductsList";
import CompanyProductDetail from "@/components/company/CompanyProductDetail";
import { Accordion } from "@/components/ui/accordion";
import { Loader2 } from "lucide-react";
import { getThemeConfig, ThemeStyle } from "@/lib/companyThemes";
import AmerceShell from "@/components/amerce/AmerceShell";
import AmerceTailwindScope from "@/components/amerce/AmerceTailwindScope";
import AmerceHeader from "@/components/amerce/AmerceHeader";
import AmerceTopbar from "@/components/amerce/AmerceTopbar";
import AmerceConstructionHero from "@/components/amerce/AmerceConstructionHero";
import AmerceServiceCategories from "@/components/amerce/AmerceServiceCategories";
import AmerceFeatureBanner from "@/components/amerce/AmerceFeatureBanner";
import AmerceServices from "@/components/amerce/AmerceServices";
import AmerceFooter from "@/components/amerce/AmerceFooter";


interface PageContent {
  title: string;
  subtitle: string;
  content: string;
  enabled: boolean;
}

interface Coupon {
  title: string;
  description: string;
  code: string;
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
  hvac_brands_install: string[] | null;
  hvac_brands_service: string[] | null;
  hvac_brands_repair: string[] | null;
  plumbing_equipment_install: string[] | null;
  plumbing_equipment_service: string[] | null;
  plumbing_equipment_repair: string[] | null;
  website_title: string | null;
  website_tagline: string | null;
  website_description: string | null;
  primary_color: string | null;
  hero_image_url: string | null;
  affiliations: Record<string, string> | null;
  theme_style: ThemeStyle | null;
  header_pages: Record<string, PageContent> | null;
  coupons: Coupon[] | null;
}

const HEADER_PAGES = [
  { key: "products", label: "Products" },
  { key: "about-us", label: "About Us" },
  { key: "financing", label: "Financing" },
  { key: "services", label: "Services" },
  { key: "residential", label: "Residential" },
  { key: "commercial", label: "Commercial" },
  { key: "air-quality", label: "Air Quality" },
];

interface CompanyLandingProps {
  subdomainSlug?: string;
}

const CompanyLanding = ({ subdomainSlug }: CompanyLandingProps) => {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const slug = subdomainSlug || paramSlug;
  const [company, setCompany] = useState<Company | null>(null);
  const [services, setServices] = useState<Array<{ id: string; title: string; description: string; icon: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activePage, setActivePage] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
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

      setCompany({
        ...data,
        coupons: (Array.isArray(data.coupons) ? data.coupons : []) as unknown as Coupon[],
      } as unknown as Company);

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
    setSelectedProductId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHome = () => {
    setActivePage(null);
    setSelectedProductId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get page label for display
  const getPageLabel = (pageKey: string) => {
    return HEADER_PAGES.find(p => p.key === pageKey)?.label || pageKey;
  };

  // Get active page content
  const activePageContent = activePage ? company.header_pages?.[activePage] : null;

  const scrollToContact = () => {
    setActivePage(null);
    setSelectedProductId(null);
    setTimeout(() => {
      document.getElementById("company-contact")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  return (
    <AmerceShell brandColor={company.primary_color}>
      <div className="min-h-screen d-flex flex-column">
        <AmerceTailwindScope themeStyle={themeStyle}>
          <CompanyPopup companyId={company.id} />
        </AmerceTailwindScope>

        <AmerceHeader

          companyName={company.name}
          logoUrl={company.logo_url}
          phone={company.company_phone}
          email={company.company_email_primary}
          city={company.company_city}
          state={company.company_state}
          navItems={HEADER_PAGES}
          activePage={activePage || undefined}
          onPageChange={handlePageChange}
          onGoHome={handleBackToHome}
        />


        <main className="flex-1">
          {activePage === "products" ? (
            <AmerceTailwindScope themeStyle={themeStyle}>
              <section className="pt-24 pb-16">
                <div className="container mx-auto px-4">
                  {selectedProductId ? (
                    <CompanyProductDetail
                      productId={selectedProductId}
                      companyId={company.id}
                      onBack={() => {
                        setSelectedProductId(null);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      onProductClick={(id) => {
                        setSelectedProductId(id);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    />
                  ) : (
                    <>
                      <button
                        onClick={handleBackToHome}
                        className="mb-6 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                      >
                        ← Back to Home
                      </button>
                      <CompanyProductsList
                        companyId={company.id}
                        onProductClick={(id) => {
                          setSelectedProductId(id);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      />
                    </>
                  )}
                </div>
              </section>
            </AmerceTailwindScope>
          ) : activePage ? (
            <AmerceTailwindScope themeStyle={themeStyle}>
              <section className="pt-24 pb-16">
                <div className="container mx-auto px-4">
                  <button
                    onClick={handleBackToHome}
                    className="mb-6 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    ← Back to Home
                  </button>
                  <CompanyPageContent
                    pageContent={activePageContent as any}
                    pageLabel={getPageLabel(activePage)}
                  />
                </div>
                <CompanyCTAIcons companyId={company.id} pageName={activePage} />
              </section>
            </AmerceTailwindScope>
          ) : (
            <>
              <AmerceConstructionHero
                companyName={company.name}
                title={company.website_title}
                tagline={company.website_tagline}
                description={company.website_description}
                heroImageUrl={company.hero_image_url}
                phone={company.company_phone}
                city={company.company_city}
                state={company.company_state}
                onPrimaryCta={scrollToContact}
              />

              <AmerceServiceCategories services={services} onSelect={scrollToContact} />

              <AmerceFeatureBanner
                companyName={company.name}
                city={company.company_city}
                state={company.company_state}
                phone={company.company_phone}
                onCta={scrollToContact}
              />

              <AmerceServices
                services={services}
                companyName={company.name}
                onCta={scrollToContact}
              />


              <AmerceTailwindScope themeStyle={themeStyle}>
                {((company.service_areas && company.service_areas.length > 0) ||
                  (company.hvac_brands_install && company.hvac_brands_install.length > 0) ||
                  (company.hvac_brands_service && company.hvac_brands_service.length > 0) ||
                  (company.hvac_brands_repair && company.hvac_brands_repair.length > 0) ||
                  (company.plumbing_equipment_install && company.plumbing_equipment_install.length > 0) ||
                  (company.plumbing_equipment_service && company.plumbing_equipment_service.length > 0) ||
                  (company.plumbing_equipment_repair && company.plumbing_equipment_repair.length > 0)) && (
                  <section className="py-8 bg-muted/30">
                    <div className="container mx-auto px-4">
                      <div className="max-w-4xl mx-auto">
                        <Accordion type="multiple" className="w-full space-y-2">
                          <CompanyServiceAreasAccordion
                            companyName={company.name}
                            serviceAreas={company.service_areas}
                            primaryColor={theme.colors.primary}
                          />
                          <CompanyBrandsAccordion
                            companyName={company.name}
                            brands={company.hvac_brands_install}
                            primaryColor={theme.colors.primary}
                          />
                          <CompanyBrandsServiceAccordion
                            companyName={company.name}
                            brands={company.hvac_brands_service}
                            primaryColor={theme.colors.primary}
                          />
                          <CompanyBrandsRepairAccordion
                            companyName={company.name}
                            brands={company.hvac_brands_repair}
                            primaryColor={theme.colors.primary}
                          />
                          <PlumbingTypesInstallAccordion
                            companyName={company.name}
                            types={company.plumbing_equipment_install}
                            primaryColor={theme.colors.primary}
                          />
                          <PlumbingTypesServiceAccordion
                            companyName={company.name}
                            types={company.plumbing_equipment_service}
                            primaryColor={theme.colors.primary}
                          />
                          <PlumbingTypesRepairAccordion
                            companyName={company.name}
                            types={company.plumbing_equipment_repair}
                            primaryColor={theme.colors.primary}
                          />
                        </Accordion>
                      </div>
                    </div>
                  </section>
                )}
                <CompanyPartnerAccordion companyId={company.id} primaryColor={theme.colors.primary} />
                <CompanyCoupons coupons={company.coupons || []} primaryColor={theme.colors.primary} />
                <div id="company-contact">
                  <CompanyContact company={company} theme={theme} />
                </div>
              </AmerceTailwindScope>
            </>
          )}
        </main>

        <AmerceFooter
          companyName={company.name}
          logoUrl={company.logo_url}
          phone={company.company_phone}
          email={company.company_email_primary}
          address={company.company_address}
          city={company.company_city}
          state={company.company_state}
          zip={company.company_zip_code}
          serviceAreas={company.service_areas}
          navItems={HEADER_PAGES}
          onPageChange={handlePageChange}
        />
      </div>
    </AmerceShell>
  );
};

export default CompanyLanding;

