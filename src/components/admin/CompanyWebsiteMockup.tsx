import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Phone, Mail, MapPin, Wrench, Building2, Tag, Users, Clock, Shield, Award, FileText, ExternalLink } from "lucide-react";
import CompanyServiceAreasAccordion from "@/components/company/CompanyServiceAreasAccordion";
import CompanyBrandsAccordion from "@/components/company/CompanyBrandsAccordion";
import CompanyBrandsServiceAccordion from "@/components/company/CompanyBrandsServiceAccordion";
import CompanyBrandsRepairAccordion from "@/components/company/CompanyBrandsRepairAccordion";
import PlumbingTypesInstallAccordion from "@/components/company/PlumbingTypesInstallAccordion";
import PlumbingTypesServiceAccordion from "@/components/company/PlumbingTypesServiceAccordion";
import PlumbingTypesRepairAccordion from "@/components/company/PlumbingTypesRepairAccordion";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

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
  website_title: string | null;
  website_tagline: string | null;
  website_description: string | null;
  primary_color: string | null;
  hero_image_url: string | null;
  theme_style: string | null;
  financing_enabled: boolean | null;
  financing_provider: string | null;
  financing_url: string | null;
  coupons: Coupon[] | null;
  partner_companies: Array<{ name: string; url: string }> | null;
  hvac_brands_install: string[] | null;
  hvac_brands_service: string[] | null;
  hvac_brands_repair: string[] | null;
  hvac_equipment_install: string[] | null;
  hvac_equipment_service: string[] | null;
  hvac_equipment_repair: string[] | null;
  plumbing_equipment_install: string[] | null;
  plumbing_equipment_service: string[] | null;
  plumbing_equipment_repair: string[] | null;
  poc_first_name: string | null;
  poc_last_name: string | null;
  poc_title: string | null;
  poc_phone: string | null;
  poc_email: string | null;
  header_pages: Record<string, PageContent> | null;
}

const HEADER_MENUS = [
  { key: "about-us", label: "About Us" },
  { key: "financing", label: "Financing" },
  { key: "services", label: "Services" },
  { key: "residential", label: "Residential" },
  { key: "commercial", label: "Commercial" },
  { key: "air-quality", label: "Air Quality" },
];

const CompanyWebsiteMockup = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const [activePage, setActivePage] = useState<string | null>(null);

  // Fetch company data
  const { data: selectedCompany, isLoading: loading } = useQuery({
    queryKey: ["company-mockup", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .single();

      if (error) throw error;
      return {
        ...data,
        partner_companies: data.partner_companies as Array<{ name: string; url: string }> | null,
        header_pages: data.header_pages as unknown as Record<string, PageContent> | null,
        coupons: (Array.isArray(data.coupons) ? data.coupons : []) as unknown as Coupon[],
      } as Company;
    },
    enabled: !!companyId,
  });

  // Fetch CTA icons for active page
  const normalizedPageName = activePage?.replace(/-/g, '_') || '';
  const { data: ctaIcons = [] } = useQuery({
    queryKey: ["cta-icons-mockup", companyId, normalizedPageName],
    queryFn: async () => {
      if (!companyId || !activePage) return [];
      const { data, error } = await supabase
        .from("page_cta_assignments")
        .select(`
          id,
          position,
          cta_icons (
            id,
            image_url,
            alt_text,
            custom_name,
            is_active
          )
        `)
        .eq("company_id", companyId)
        .eq("page_name", normalizedPageName)
        .eq("use_on_page", true)
        .order("position", { ascending: true });

      if (error) throw error;
      return (data || []).filter((item: any) => item.cta_icons?.is_active !== false);
    },
    enabled: !!companyId && !!activePage,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!selectedCompany) {
    return (
      <div className="text-center py-20">
        <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Company Not Found</h2>
        <p className="text-muted-foreground">The selected company could not be loaded.</p>
      </div>
    );
  }

  const primaryColor = selectedCompany.primary_color || "#0ea5e9";

  return (
    <div className="space-y-6">
      {/* Mockup Indicator */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
            MOCKUP PREVIEW
          </Badge>
          <p className="text-amber-800 text-sm">
            This is a preview of <strong>{selectedCompany.name}</strong> website structure.
          </p>
        </div>
        {selectedCompany.slug && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/company/${selectedCompany.slug}`, '_blank')}
            className="shrink-0"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Website
          </Button>
        )}
      </div>

      {/* Website Frame */}
      <div className="border-4 border-muted rounded-xl overflow-hidden bg-background shadow-2xl">
        {/* Browser Bar Mockup */}
        <div className="bg-muted px-4 py-2 flex items-center gap-2 border-b">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="flex-1 mx-4">
            <div className="bg-background rounded-md px-3 py-1 text-sm text-muted-foreground flex items-center gap-2">
              <span className="text-green-600">🔒</span>
              {selectedCompany.slug}.hcshvac.com
            </div>
          </div>
        </div>

        {/* ======== HEADER SECTION ======== */}
        <div 
          className="p-4 flex items-center justify-between border-b"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="flex items-center gap-3">
            {selectedCompany.logo_url ? (
              <img src={selectedCompany.logo_url} alt="Logo" className="h-10 w-auto" />
            ) : (
              <div className="w-10 h-10 rounded bg-white/20 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="text-white">
              <h1 className="font-bold text-lg">{selectedCompany.name}</h1>
              {selectedCompany.website_tagline && (
                <p className="text-white/80 text-xs">{selectedCompany.website_tagline}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 text-white text-sm">
            {selectedCompany.company_email_primary && (
              <span className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {selectedCompany.company_email_primary}
              </span>
            )}
            {selectedCompany.company_phone && (
              <span className="flex items-center gap-1 font-bold">
                <Phone className="w-4 h-4" />
                {selectedCompany.company_phone}
              </span>
            )}
          </div>
        </div>

        {/* ======== HEADER MENUS NAVIGATION ======== */}
        <div className="bg-muted border-b px-4 py-2">
          <div className="flex items-center justify-center gap-1 flex-wrap">
            <button
              onClick={() => setActivePage(null)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-1.5 cursor-pointer transition-colors ${
                activePage === null 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-background text-foreground hover:bg-accent"
              }`}
            >
              Home
            </button>
            {HEADER_MENUS.map((menu) => {
              const pageData = selectedCompany.header_pages?.[menu.key];
              const isEnabled = pageData?.enabled !== false;
              const title = pageData?.title || menu.label;
              const isActive = activePage === menu.key;
              
              return (
                <button
                  key={menu.key}
                  onClick={() => setActivePage(menu.key)}
                  disabled={!isEnabled}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-1.5 transition-colors ${
                    !isEnabled 
                      ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground"
                      : isActive 
                        ? "bg-primary text-primary-foreground cursor-pointer" 
                        : "bg-background text-foreground hover:bg-accent cursor-pointer"
                  }`}
                >
                  {title}
                </button>
              );
            })}
          </div>
        </div>

        {/* ======== PAGE CONTENT ======== */}
        {activePage ? (
          <div className="p-8 md:p-12">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {selectedCompany.header_pages?.[activePage]?.title || HEADER_MENUS.find(m => m.key === activePage)?.label || activePage}
                </h2>
                {selectedCompany.header_pages?.[activePage]?.subtitle && (
                  <p className="text-xl text-muted-foreground">
                    {selectedCompany.header_pages[activePage].subtitle}
                  </p>
                )}
              </div>
              <div className="prose prose-lg max-w-none">
                <p className="whitespace-pre-wrap text-foreground/80 leading-relaxed">
                  {selectedCompany.header_pages?.[activePage]?.content || "No content configured for this page yet. Configure it in the Header Menus section."}
                </p>
              </div>
            </div>
            
            {/* CTA Icons for this page */}
            {ctaIcons.length > 0 && (
              <div className="mt-8 py-6 bg-muted/30 rounded-lg">
                <div className="flex flex-wrap items-center justify-center gap-4">
                  {ctaIcons.map((assignment: any) => (
                    <div key={assignment.id} className="p-2">
                      <img
                        src={assignment.cta_icons.image_url}
                        alt={assignment.cta_icons.alt_text || assignment.cta_icons.custom_name}
                        className="h-12 w-auto object-contain"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
        

        {/* ======== HERO SECTION ======== */}
        <div className="relative bg-gradient-to-r from-slate-900 to-slate-700 text-white p-12">
          <div className="max-w-2xl">
            <Badge className="mb-4 bg-white/20 text-white hover:bg-white/30">
              {selectedCompany.theme_style?.toUpperCase() || "MODERN"} THEME
            </Badge>
            <h2 className="text-4xl font-bold mb-4">
              {selectedCompany.website_title || selectedCompany.name}
            </h2>
            <p className="text-xl mb-6 text-white/90">
              {selectedCompany.website_description || "Professional HVAC services for your home and business."}
            </p>
            <div className="flex gap-4">
              <div 
                className="px-6 py-3 rounded-lg font-semibold text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Call {selectedCompany.company_phone || "(555) 000-0000"}
              </div>
              <div className="px-6 py-3 rounded-lg font-semibold bg-white text-slate-900">
                Get a Quote
              </div>
            </div>
          </div>
          <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-20">
            <Wrench className="w-48 h-48" />
          </div>
        </div>

        {/* ======== ACCORDION SECTION ======== */}
        {(selectedCompany.service_areas && selectedCompany.service_areas.length > 0) || 
         (selectedCompany.hvac_brands_install && selectedCompany.hvac_brands_install.length > 0) ||
         (selectedCompany.hvac_brands_service && selectedCompany.hvac_brands_service.length > 0) ||
         (selectedCompany.hvac_brands_repair && selectedCompany.hvac_brands_repair.length > 0) ||
         (selectedCompany.plumbing_equipment_install && selectedCompany.plumbing_equipment_install.length > 0) ||
         (selectedCompany.plumbing_equipment_service && selectedCompany.plumbing_equipment_service.length > 0) ||
         (selectedCompany.plumbing_equipment_repair && selectedCompany.plumbing_equipment_repair.length > 0) ? (
          <section className="py-8 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <Accordion type="multiple" className="w-full space-y-2">
                  <CompanyServiceAreasAccordion 
                    companyName={selectedCompany.name}
                    serviceAreas={selectedCompany.service_areas}
                    primaryColor={primaryColor}
                  />
                  <CompanyBrandsAccordion 
                    companyName={selectedCompany.name}
                    brands={selectedCompany.hvac_brands_install}
                    primaryColor={primaryColor}
                  />
                  <CompanyBrandsServiceAccordion 
                    companyName={selectedCompany.name}
                    brands={selectedCompany.hvac_brands_service}
                    primaryColor={primaryColor}
                  />
                  <CompanyBrandsRepairAccordion 
                    companyName={selectedCompany.name}
                    brands={selectedCompany.hvac_brands_repair}
                    primaryColor={primaryColor}
                  />
                  <PlumbingTypesInstallAccordion 
                    companyName={selectedCompany.name}
                    types={selectedCompany.plumbing_equipment_install}
                    primaryColor={primaryColor}
                  />
                  <PlumbingTypesServiceAccordion 
                    companyName={selectedCompany.name}
                    types={selectedCompany.plumbing_equipment_service}
                    primaryColor={primaryColor}
                  />
                  <PlumbingTypesRepairAccordion 
                    companyName={selectedCompany.name}
                    types={selectedCompany.plumbing_equipment_repair}
                    primaryColor={primaryColor}
                  />
                </Accordion>
              </div>
            </div>
          </section>
        ) : null}

        {/* ======== COUPONS SECTION ======== */}
        {selectedCompany.coupons && selectedCompany.coupons.length > 0 && (
          <div className="bg-muted/50 p-8">
            <h3 className="text-2xl font-bold text-center mb-6 flex items-center justify-center gap-2">
              <Tag className="w-6 h-6 text-primary" />
              Special Offers
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {selectedCompany.coupons.map((coupon, index) => (
                <Card key={index} className="border-2 border-dashed border-primary">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-primary">{coupon.title}</p>
                    <p className="text-muted-foreground text-sm">{coupon.description}</p>
                    {coupon.code && (
                      <Badge variant="outline" className="mt-2">{coupon.code}</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ======== SERVICES SECTION ======== */}
        <div className="p-8">
          <h3 className="text-2xl font-bold text-center mb-6 flex items-center justify-center gap-2">
            <Wrench className="w-6 h-6 text-primary" />
            Our Services
          </h3>
          
          {/* HVAC Equipment */}
          {(selectedCompany.hvac_equipment_install?.length || selectedCompany.hvac_equipment_service?.length || selectedCompany.hvac_equipment_repair?.length) ? (
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {selectedCompany.hvac_equipment_install && selectedCompany.hvac_equipment_install.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      HVAC Installation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {selectedCompany.hvac_equipment_install.map((item, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">{item}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {selectedCompany.hvac_equipment_service && selectedCompany.hvac_equipment_service.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      HVAC Service
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {selectedCompany.hvac_equipment_service.map((item, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">{item}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {selectedCompany.hvac_equipment_repair && selectedCompany.hvac_equipment_repair.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-primary" />
                      HVAC Repair
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {selectedCompany.hvac_equipment_repair.map((item, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">{item}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground mb-8">No HVAC equipment services configured</p>
          )}

          {/* Plumbing Equipment */}
          {(selectedCompany.plumbing_equipment_install?.length || selectedCompany.plumbing_equipment_service?.length || selectedCompany.plumbing_equipment_repair?.length) && (
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {selectedCompany.plumbing_equipment_install && selectedCompany.plumbing_equipment_install.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Plumbing Installation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {selectedCompany.plumbing_equipment_install.map((item, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">{item}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {selectedCompany.plumbing_equipment_service && selectedCompany.plumbing_equipment_service.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Plumbing Service</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {selectedCompany.plumbing_equipment_service.map((item, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">{item}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {selectedCompany.plumbing_equipment_repair && selectedCompany.plumbing_equipment_repair.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Plumbing Repair</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {selectedCompany.plumbing_equipment_repair.map((item, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">{item}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* ======== BRANDS SECTION ======== */}
        {(selectedCompany.hvac_brands_install?.length || selectedCompany.hvac_brands_service?.length || selectedCompany.hvac_brands_repair?.length) && (
          <div className="bg-muted/30 p-8">
            <h3 className="text-2xl font-bold text-center mb-6 flex items-center justify-center gap-2">
              <Award className="w-6 h-6 text-primary" />
              Brands We Work With
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              {selectedCompany.hvac_brands_install && selectedCompany.hvac_brands_install.length > 0 && (
                <div className="text-center">
                  <h4 className="font-semibold mb-3">Brands We Install</h4>
                  <div className="flex flex-wrap justify-center gap-2">
                    {selectedCompany.hvac_brands_install.map((brand, idx) => (
                      <Badge key={idx} className="bg-primary text-primary-foreground">{brand}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {selectedCompany.hvac_brands_service && selectedCompany.hvac_brands_service.length > 0 && (
                <div className="text-center">
                  <h4 className="font-semibold mb-3">Brands We Service</h4>
                  <div className="flex flex-wrap justify-center gap-2">
                    {selectedCompany.hvac_brands_service.map((brand, idx) => (
                      <Badge key={idx} variant="secondary">{brand}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {selectedCompany.hvac_brands_repair && selectedCompany.hvac_brands_repair.length > 0 && (
                <div className="text-center">
                  <h4 className="font-semibold mb-3">Brands We Repair</h4>
                  <div className="flex flex-wrap justify-center gap-2">
                    {selectedCompany.hvac_brands_repair.map((brand, idx) => (
                      <Badge key={idx} variant="outline">{brand}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======== SERVICE AREAS SECTION ======== */}
        {selectedCompany.service_areas && selectedCompany.service_areas.length > 0 && (
          <div className="p-8">
            <h3 className="text-2xl font-bold text-center mb-6 flex items-center justify-center gap-2">
              <MapPin className="w-6 h-6 text-primary" />
              Service Areas
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              {selectedCompany.service_areas.map((area, idx) => (
                <Badge key={idx} variant="outline" className="text-sm py-1 px-3">{area}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* ======== FINANCING SECTION ======== */}
        {selectedCompany.financing_enabled && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-8 border-t border-b border-green-200">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-green-800 mb-2">Financing Available</h3>
              <p className="text-green-700">
                {selectedCompany.financing_provider 
                  ? `We partner with ${selectedCompany.financing_provider} to offer flexible financing options.`
                  : "We offer flexible financing options for your HVAC needs."
                }
              </p>
              {selectedCompany.financing_url && (
                <Badge className="mt-3 bg-green-600">Apply Now</Badge>
              )}
            </div>
          </div>
        )}

        {/* ======== PARTNER COMPANIES SECTION ======== */}
        {selectedCompany.partner_companies && selectedCompany.partner_companies.length > 0 && (
          <div className="p-8 bg-muted/20">
            <h3 className="text-2xl font-bold text-center mb-6 flex items-center justify-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Our Partners
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              {selectedCompany.partner_companies.map((partner, idx) => (
                <Badge key={idx} variant="outline" className="text-sm py-2 px-4">
                  {partner.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* ======== CONTACT SECTION ======== */}
        <div className="p-8 bg-muted/50">
          <h3 className="text-2xl font-bold text-center mb-6">Contact Us</h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-6 text-center">
                <Phone className="w-8 h-8 mx-auto mb-3 text-primary" />
                <h4 className="font-semibold mb-1">Phone</h4>
                <p className="text-muted-foreground">{selectedCompany.company_phone || "Not set"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Mail className="w-8 h-8 mx-auto mb-3 text-primary" />
                <h4 className="font-semibold mb-1">Email</h4>
                <p className="text-muted-foreground text-sm">{selectedCompany.company_email_primary || "Not set"}</p>
                {selectedCompany.company_support_email && (
                  <p className="text-muted-foreground text-xs mt-1">Support: {selectedCompany.company_support_email}</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <MapPin className="w-8 h-8 mx-auto mb-3 text-primary" />
                <h4 className="font-semibold mb-1">Address</h4>
                <p className="text-muted-foreground text-sm">
                  {selectedCompany.company_address || "Not set"}
                  {selectedCompany.company_city && <><br />{selectedCompany.company_city}, {selectedCompany.company_state} {selectedCompany.company_zip_code}</>}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ======== POINT OF CONTACT ======== */}
        {(selectedCompany.poc_first_name || selectedCompany.poc_email) && (
          <div className="p-6 border-t">
            <div className="text-center">
              <h4 className="font-semibold mb-2">Primary Contact</h4>
              <p className="text-muted-foreground">
                {selectedCompany.poc_first_name} {selectedCompany.poc_last_name}
                {selectedCompany.poc_title && <span className="text-sm"> ({selectedCompany.poc_title})</span>}
              </p>
              {selectedCompany.poc_email && <p className="text-sm text-muted-foreground">{selectedCompany.poc_email}</p>}
              {selectedCompany.poc_phone && <p className="text-sm text-muted-foreground">{selectedCompany.poc_phone}</p>}
            </div>
          </div>
        )}

        {/* ======== FOOTER SECTION ======== */}
        <div 
          className="p-6 text-center text-white"
          style={{ backgroundColor: primaryColor }}
        >
          <p className="font-bold text-lg mb-2">{selectedCompany.name}</p>
          <p className="text-white/80 text-sm">
            © {new Date().getFullYear()} {selectedCompany.name}. All rights reserved.
          </p>
          <p className="text-white/60 text-xs mt-2">
            Theme: {selectedCompany.theme_style || "modern"} | Color: {selectedCompany.primary_color || "Default"}
          </p>
        </div>
          </>
        )}
      </div>

      {/* Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile Data Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Service Areas:</span>
              <span className="ml-2 font-medium">{selectedCompany.service_areas?.length || 0}</span>
            </div>
            <div>
              <span className="text-muted-foreground">HVAC Equipment Types:</span>
              <span className="ml-2 font-medium">
                {(selectedCompany.hvac_equipment_install?.length || 0) + 
                 (selectedCompany.hvac_equipment_service?.length || 0) + 
                 (selectedCompany.hvac_equipment_repair?.length || 0)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Brands:</span>
              <span className="ml-2 font-medium">
                {(selectedCompany.hvac_brands_install?.length || 0) + 
                 (selectedCompany.hvac_brands_service?.length || 0) + 
                 (selectedCompany.hvac_brands_repair?.length || 0)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Coupons:</span>
              <span className="ml-2 font-medium">
                {selectedCompany.coupons?.length || 0}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyWebsiteMockup;
