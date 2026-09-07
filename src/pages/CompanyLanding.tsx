import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import CompanyHeader from "@/components/company/CompanyHeader";
import CompanyHero from "@/components/company/CompanyHero";
import CompanyServices from "@/components/company/CompanyServices";
import CompanyFooter from "@/components/company/CompanyFooter";
import CompanyCTAIcons from "@/components/company/CompanyCTAIcons";
import CompanyPopup from "@/components/company/CompanyPopup";
import CompanyPageContent from "@/components/company/CompanyPageContent";
import CompanyHomeBody from "@/components/company/CompanyHomeBody";

import CompanyProductsList from "@/components/company/CompanyProductsList";
import CompanyProductDetail from "@/components/company/CompanyProductDetail";
import MassPagesMenu from "@/components/company/MassPagesMenu";
import MassServicePage from "@/components/company/MassServicePage";
import { useMassPages } from "@/hooks/useMassPages";
import { resolveMassPage, massPagePath, massTemplatePath, massCampaignTemplate } from "@/lib/massPages";
import { useMassPageContent } from "@/hooks/useMassPageContent";

import { Loader2 } from "lucide-react";
import { getThemeConfig, ThemeStyle } from "@/lib/companyThemes";
import AmerceShell from "@/components/amerce/AmerceShell";
import AmerceTailwindScope from "@/components/amerce/AmerceTailwindScope";
import AmerceHeader from "@/components/amerce/AmerceHeader";
import AmerceHero from "@/components/amerce/AmerceHero";
import AmerceConstructionHero from "@/components/amerce/AmerceConstructionHero";
import AmerceServiceCategories from "@/components/amerce/AmerceServiceCategories";
import AmerceFeatureBanner from "@/components/amerce/AmerceFeatureBanner";
import AmerceServices from "@/components/amerce/AmerceServices";
import AmerceTopProducts from "@/components/amerce/AmerceTopProducts";
import AmerceFooter from "@/components/amerce/AmerceFooter";
import AmerceOrganicHero from "@/components/amerce/organic/AmerceOrganicHero";
import AmerceOrganicCategories from "@/components/amerce/organic/AmerceOrganicCategories";
import AmerceOrganicPromo from "@/components/amerce/organic/AmerceOrganicPromo";
import AmerceOrganicTestimonials from "@/components/amerce/organic/AmerceOrganicTestimonials";
import AmerceOrganicPopularProducts from "@/components/amerce/organic/AmerceOrganicPopularProducts";


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
  boilers_install?: string[] | null;
  boilers_service?: string[] | null;
  boilers_repair?: string[] | null;
  water_heaters_install?: string[] | null;
  water_heaters_service?: string[] | null;
  water_heaters_repair?: string[] | null;
  coils_install?: string[] | null;
  coils_service?: string[] | null;
  coils_repair?: string[] | null;
  gas_pipe_install?: string[] | null;
  gas_pipe_service?: string[] | null;
  gas_pipe_repair?: string[] | null;
  website_title: string | null;
  website_tagline: string | null;
  website_description: string | null;
  primary_color: string | null;
  hero_image_url: string | null;
  affiliations: Record<string, string> | null;
  theme_style: ThemeStyle | null;
  site_template: string | null;
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
  { key: "mass-pages", label: "Mass Pages" },
];

interface CompanyLandingProps {
  subdomainSlug?: string;
}

const CompanyLanding = ({ subdomainSlug }: CompanyLandingProps) => {
  const { slug: paramSlug, massSlug } = useParams<{ slug: string; massSlug: string }>();
  const slug = subdomainSlug || paramSlug;
  const location = useLocation();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [services, setServices] = useState<Array<{ id: string; title: string; description: string; icon: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activePage, setActivePage] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Mass pages (service x county x city) derived from the company profile
  const { groups: massGroups } = useMassPages(company?.service_areas);
  const massPath = subdomainSlug
    ? location.pathname.replace(/^\//, "").replace(/\/$/, "")
    : massSlug || "";
  const resolvedMassPage =
    company && massPath && massPath !== "mass-pages"
      ? resolveMassPage(massPath, company as unknown as Record<string, unknown>, massGroups)
      : null;
  const { overrides: massPageOverrides, blocked: massPageBlocked } = useMassPageContent(
    company?.id,
    resolvedMassPage
      ? massPagePath(resolvedMassPage.service, resolvedMassPage.location, {
          visitType: resolvedMassPage.visitType,
          locationType: resolvedMassPage.locationType,
        })
      : null,
    resolvedMassPage
      ? massTemplatePath(resolvedMassPage.service, {
          visitType: resolvedMassPage.visitType,
          locationType: resolvedMassPage.locationType,
        })
      : null,
  );
  // Admin preview (inside the content editor) may view drafts / suspended pages.
  const massPreview =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("preview") === "1";
  // Suspended / deleted campaigns must not be reachable on the live site.
  const massPage = massPageBlocked && !massPreview ? null : resolvedMassPage;
  const showMassHomeBody = massPageOverrides?.sections?.homeBody !== false;
  const massTheme = massCampaignTemplate(massPageOverrides?.template).theme;
  const massBodyVariant = massTheme.bodyVariant;
  // On a live campaign page, the top bar + footer adopt the template primary color.
  const massBarColor = massPage ? `hsl(${massTheme.primary})` : null;
  const showMassMenu = massPath === "mass-pages" || (!!resolvedMassPage && massPageBlocked);

  const baseUrl = subdomainSlug ? "" : `/company/${slug}`;
  const goToMassPath = (path: string) => {
    navigate(`${baseUrl}${path}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Redirect legacy mass page URLs (Service-VisitType-LocationType first) to the
  // canonical LocationType-VisitType-Service-County-CityStateZip order.
  useEffect(() => {
    if (!resolvedMassPage || !massPath) return;
    if (massPath === resolvedMassPage.slug) return;
    navigate(`${baseUrl}/${resolvedMassPage.slug}`, { replace: true });
  }, [resolvedMassPage, massPath, baseUrl, navigate]);
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
  const siteTemplate = company.site_template || "home-construction";

  const handlePageChange = (pageKey: string) => {
    if (pageKey === "mass-pages") {
      goToMassPath("/mass-pages");
      return;
    }
    if (massPath) navigate(baseUrl || "/");
    setActivePage(pageKey);
    setSelectedProductId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHome = () => {
    if (massPath) navigate(baseUrl || "/");
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
          activePage={massPath ? "mass-pages" : activePage || undefined}
          onPageChange={handlePageChange}
          onGoHome={handleBackToHome}
          barColor={massBarColor}
        />


        <main className="flex-1">
          {massPage ? (
            <>
              <AmerceTailwindScope themeStyle={themeStyle}>
                <MassServicePage
                  company={company as unknown as Record<string, unknown> & { name: string }}
                  page={massPage}
                  groups={massGroups}
                  onNavigate={goToMassPath}
                  basePath={baseUrl}
                  onHome={handleBackToHome}
                  onContact={scrollToContact}
                />
              </AmerceTailwindScope>

              {showMassHomeBody && (
                <>
                  <AmerceTopProducts
                    companyId={company.id}
                    onProductClick={(id) => {
                      navigate(baseUrl || "/");
                      setActivePage("products");
                      setSelectedProductId(id);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    onViewAll={() => handlePageChange("products")}
                  />

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
                    <CompanyHomeBody company={company} theme={theme} variant={massBodyVariant} />
                  </AmerceTailwindScope>
                </>
              )}

            </>
          ) : showMassMenu ? (

            <AmerceTailwindScope themeStyle={themeStyle}>
              <section className="pt-24 pb-16">
                <div className="container mx-auto px-4">
                  <button
                    onClick={handleBackToHome}
                    className="mb-6 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    ← Back to Home
                  </button>
                  <MassPagesMenu
                    company={company as unknown as Record<string, unknown> & { name: string }}
                    groups={massGroups}
                    onNavigate={goToMassPath}
                    basePath={baseUrl}

                  />
                </div>
              </section>
            </AmerceTailwindScope>
          ) : activePage === "products" ? (
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
              {siteTemplate === "home-organic" ? (
                <>
                  <AmerceOrganicHero
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

                  <AmerceOrganicCategories services={services} onSelect={scrollToContact} />

                  <AmerceTopProducts
                    companyId={company.id}
                    onProductClick={(id) => {
                      setActivePage("products");
                      setSelectedProductId(id);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    onViewAll={() => handlePageChange("products")}
                  />

                  <AmerceOrganicPromo
                    companyName={company.name}
                    city={company.company_city}
                    state={company.company_state}
                    phone={company.company_phone}
                    onCta={scrollToContact}
                  />

                  <AmerceOrganicPopularProducts
                    companyId={company.id}
                    onProductClick={(id) => {
                      setActivePage("products");
                      setSelectedProductId(id);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    onViewAll={() => handlePageChange("products")}
                  />


                  <AmerceServices
                    services={services}
                    companyName={company.name}
                    onCta={scrollToContact}
                  />

                  <AmerceOrganicTestimonials companyName={company.name} />
                </>
              ) : siteTemplate === "home-office-equipment" ? (
                <>
                  <AmerceHero
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
                  <AmerceServices services={services} companyName={company.name} onCta={scrollToContact} />
                  <AmerceServiceCategories services={services} onSelect={scrollToContact} />
                  <AmerceTopProducts
                    companyId={company.id}
                    onProductClick={(id) => {
                      setActivePage("products");
                      setSelectedProductId(id);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    onViewAll={() => handlePageChange("products")}
                  />
                </>
              ) : siteTemplate === "home-electronics" ? (
                <>
                  <AmerceServiceCategories services={services} onSelect={scrollToContact} />
                  <AmerceHero
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
                  <AmerceTopProducts
                    companyId={company.id}
                    onProductClick={(id) => {
                      setActivePage("products");
                      setSelectedProductId(id);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    onViewAll={() => handlePageChange("products")}
                  />
                  <AmerceServices services={services} companyName={company.name} onCta={scrollToContact} />
                </>
              ) : siteTemplate === "home-garden" ? (
                <>
                  <AmerceHero
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
                  <AmerceFeatureBanner
                    companyName={company.name}
                    city={company.company_city}
                    state={company.company_state}
                    phone={company.company_phone}
                    onCta={scrollToContact}
                  />
                  <AmerceServiceCategories services={services} onSelect={scrollToContact} />
                  <AmerceServices services={services} companyName={company.name} onCta={scrollToContact} />
                  <AmerceOrganicTestimonials companyName={company.name} />
                </>
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

                  <AmerceTopProducts
                    companyId={company.id}
                    onProductClick={(id) => {
                      setActivePage("products");
                      setSelectedProductId(id);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    onViewAll={() => handlePageChange("products")}
                  />

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
                </>
              )}



              <AmerceTailwindScope themeStyle={themeStyle}>
                <CompanyHomeBody company={company} theme={theme} />
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
          variant={siteTemplate === "home-organic" ? "light" : "dark"}
          bgColor={massBarColor}
        />

      </div>
    </AmerceShell>
  );
};

export default CompanyLanding;

