import { useEffect, useState } from "react";
import { useNavigate, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import HeroAdd from "@/components/admin/HeroAdd";
import HeroList from "@/components/admin/HeroList";
import HeroImagesAdd from "@/components/admin/HeroImagesAdd";
import HeroImagesList from "@/components/admin/HeroImagesList";
import ServicesAdd from "@/components/admin/ServicesAdd";
import ServicesList from "@/components/admin/ServicesList";
import ServiceTermsAdd from "@/components/admin/ServiceTermsAdd";
import ServiceTermsList from "@/components/admin/ServiceTermsList";
import CompaniesAdd from "@/components/admin/CompaniesAdd";
import ActiveCompaniesList from "@/components/admin/ActiveCompaniesList";
import DeactiveCompaniesList from "@/components/admin/DeactiveCompaniesList";
import CompanyView from "@/components/admin/CompanyView";
import VendorsAdd from "@/components/admin/VendorsAdd";
import VendorsList from "@/components/admin/VendorsList";
import { EmployeesAdmin } from "@/components/admin/EmployeesAdmin";
import CitiesImport from "@/components/admin/CitiesImport";
import BusinessImport from "@/components/admin/BusinessImport";
import HvacKeywords from "@/components/admin/pagebuilder/HvacKeywords";
import NegativeKeywords from "@/components/admin/pagebuilder/NegativeKeywords";
import HvacParts from "@/components/admin/pagebuilder/HvacParts";
import EquipmentBrands from "@/components/admin/pagebuilder/EquipmentBrands";
import PlumbingBrands from "@/components/admin/pagebuilder/PlumbingBrands";
import AreasService from "@/components/admin/pagebuilder/AreasService";
import BrandsInstall from "@/components/admin/pagebuilder/BrandsInstall";
import BrandsService from "@/components/admin/pagebuilder/BrandsService";
import BrandsRepair from "@/components/admin/pagebuilder/BrandsRepair";
import PlumbingTypesInstall from "@/components/admin/pagebuilder/PlumbingTypesInstall";
import PlumbingTypesService from "@/components/admin/pagebuilder/PlumbingTypesService";
import PlumbingTypesRepair from "@/components/admin/pagebuilder/PlumbingTypesRepair";
import ImagesLogos from "@/components/admin/pagebuilder/ImagesLogos";
import CompanyImages from "@/components/admin/pagebuilder/CompanyImages";
import SiteTemplates from "@/components/admin/pagebuilder/SiteTemplates";
import LocalBusiness from "@/components/admin/pagebuilder/LocalBusiness";
import CampaignDashboard from "@/components/admin/pagebuilder/CampaignDashboard";
import CampaignForm from "@/components/admin/pagebuilder/CampaignForm";
import GeneratedPagesList from "@/components/admin/pagebuilder/GeneratedPagesList";
import PagePreview from "@/components/admin/pagebuilder/PagePreview";
import PageTemplates from "@/components/admin/pagebuilder/PageTemplates";
import TemplateForm from "@/components/admin/pagebuilder/TemplateForm";
import TemplateCampaignLink from "@/components/admin/pagebuilder/TemplateCampaignLink";
import AppointmentsAdd from "@/components/admin/appointments/AppointmentsAdd";
import AppointmentsList from "@/components/admin/appointments/AppointmentsList";
import AppointmentsCalendar from "@/components/admin/appointments/AppointmentsCalendar";
import SMSLinkSend from "@/components/admin/smslink/SMSLinkSend";
import SMSLinkList from "@/components/admin/smslink/SMSLinkList";
import LogsList from "@/components/admin/LogsList";
import CallLogAdd from "@/components/admin/CallLogAdd";
import CustomersAdd from "@/components/admin/CustomersAdd";
import CustomersList from "@/components/admin/CustomersList";
import CalendarAdd from "@/components/admin/calendar/CalendarAdd";
import CalendarList from "@/components/admin/calendar/CalendarList";
import CompanyWebsiteMockup from "@/components/admin/CompanyWebsiteMockup";
import TopHeaderPreview from "@/components/admin/pagebuilder/TopHeaderPreview";
import BannerPreview from "@/components/admin/pagebuilder/BannerPreview";
import HeaderPageAboutUs from "@/components/admin/pagebuilder/HeaderPageAboutUs";
import HeaderPageFinancing from "@/components/admin/pagebuilder/HeaderPageFinancing";
import HeaderPageServices from "@/components/admin/pagebuilder/HeaderPageServices";
import HeaderPageResidential from "@/components/admin/pagebuilder/HeaderPageResidential";
import HeaderPageCommercial from "@/components/admin/pagebuilder/HeaderPageCommercial";
import HeaderPageAirQuality from "@/components/admin/pagebuilder/HeaderPageAirQuality";
import CTAIconsAdd from "@/components/admin/pagebuilder/CTAIconsAdd";
import CTAIconsLibrary from "@/components/admin/pagebuilder/CTAIconsLibrary";
import CTAIconsAssignments from "@/components/admin/pagebuilder/CTAIconsAssignments";
import CouponList from "@/components/admin/pagebuilder/CouponList";
import PartnerListingsList from "@/components/admin/pagebuilder/PartnerListingsList";
import PartnerListingsAdd from "@/components/admin/pagebuilder/PartnerListingsAdd";
import MarqueeList from "@/components/admin/pagebuilder/MarqueeList";
import MarqueeAdd from "@/components/admin/pagebuilder/MarqueeAdd";
import AdminDashboard from "@/components/admin/AdminDashboard";

const Admin = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/auth");
    }
  }, [user, isAdmin, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Render loading state or unauthorized state inside consistent wrapper
  const renderContent = () => {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center w-full">
          <p>Loading...</p>
        </div>
      );
    }

    if (!user || !isAdmin) {
      return null;
    }

    return (
      <div className="flex min-h-screen w-full">
        {/* Mobile sidebar via Sheet */}
        {isMobile ? (
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent side="left" className="p-0 w-[280px]">
              <AdminSidebar onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
        ) : (
          /* Desktop: fixed/sticky sidebar */
          <aside className="hidden md:flex w-64 shrink-0 sticky top-0 h-screen border-r border-sidebar-border bg-sidebar overflow-y-auto">
            <AdminSidebar />
          </aside>
        )}

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0 bg-secondary/30">
          <header className="bg-background border-b sticky top-0 z-10">
            <div className="px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <button onClick={() => setMobileOpen(true)} className="md:hidden p-1 rounded-md hover:bg-accent">
                  <Menu className="h-5 w-5" />
                </button>
                <h1 className="text-xl md:text-2xl font-bold truncate">Admin Panel</h1>
              </div>
              <div className="flex items-center gap-4">
                <span className="hidden md:block text-sm text-muted-foreground truncate max-w-[200px]">{user.email}</span>
                <Button onClick={handleSignOut} variant="outline" size="sm">
                  Sign Out
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-8 overflow-auto">
            <Routes>
              <Route path="/" element={<AdminDashboard />} />
              <Route path="/hero/add" element={<HeroAdd />} />
              <Route path="/hero/list" element={<HeroList />} />
              <Route path="/images/add" element={<HeroImagesAdd />} />
              <Route path="/images/list" element={<HeroImagesList />} />
              <Route path="/services/add" element={<ServicesAdd />} />
              <Route path="/services/list" element={<ServicesList />} />
              <Route path="/services/terms" element={<ServiceTermsList />} />
              <Route path="/services/terms/add" element={<ServiceTermsAdd />} />
              <Route path="/companies/add" element={<CompaniesAdd />} />
              <Route path="/companies/active" element={<ActiveCompaniesList />} />
              <Route path="/companies/deactive" element={<DeactiveCompaniesList />} />
              <Route path="/companies/view/:id" element={<CompanyView />} />
              <Route path="/vendors/add" element={<VendorsAdd />} />
              <Route path="/vendors/list" element={<VendorsList />} />
              <Route path="/employees/*" element={<EmployeesAdmin />} />
              <Route path="/customers/add" element={<CustomersAdd />} />
              <Route path="/customers/list" element={<CustomersList />} />
              <Route path="/appointments/add" element={<AppointmentsAdd />} />
              <Route path="/appointments/list" element={<AppointmentsList />} />
              <Route path="/appointments/calendar" element={<AppointmentsCalendar />} />
              <Route path="/sms-link/send" element={<SMSLinkSend />} />
              <Route path="/sms-link/list" element={<SMSLinkList />} />
              <Route path="/cities/import" element={<CitiesImport />} />
              <Route path="/business/import" element={<BusinessImport />} />
              <Route path="/page-builder/hvac-keywords" element={<HvacKeywords />} />
              <Route path="/page-builder/negative-keywords" element={<NegativeKeywords />} />
              <Route path="/page-builder/hvac-parts" element={<HvacParts />} />
              <Route path="/page-builder/equipment-brands" element={<EquipmentBrands />} />
              <Route path="/page-builder/plumbing-brands" element={<PlumbingBrands />} />
              <Route path="/page-builder/areas-service" element={<AreasService />} />
              <Route path="/page-builder/images-logos" element={<ImagesLogos />} />
              <Route path="/page-builder/site-templates" element={<SiteTemplates />} />
              <Route path="/page-builder/local-business" element={<LocalBusiness />} />
              <Route path="/page-builder/campaigns" element={<CampaignDashboard />} />
              <Route path="/page-builder/campaigns/:campaignId" element={<CampaignForm />} />
              <Route path="/page-builder/campaigns/:campaignId/pages" element={<GeneratedPagesList />} />
              <Route path="/page-builder/pages/:pageId/preview" element={<PagePreview />} />
              <Route path="/page-builder/templates" element={<PageTemplates />} />
              <Route path="/page-builder/templates/:templateId" element={<TemplateForm />} />
              <Route path="/page-builder/templates/:templateId/link" element={<TemplateCampaignLink />} />
              {/* Company-specific page builder routes */}
              <Route path="/page-builder/company/:companyId" element={<CampaignDashboard />} />
              <Route path="/page-builder/company/:companyId/campaigns" element={<CampaignDashboard />} />
              <Route path="/page-builder/company/:companyId/campaigns/:campaignId" element={<CampaignForm />} />
              <Route path="/page-builder/company/:companyId/campaigns/:campaignId/pages" element={<GeneratedPagesList />} />
              <Route path="/page-builder/company/:companyId/templates" element={<PageTemplates />} />
              <Route path="/page-builder/company/:companyId/templates/:templateId" element={<TemplateForm />} />
              <Route path="/page-builder/company/:companyId/hvac-keywords" element={<HvacKeywords />} />
              <Route path="/page-builder/company/:companyId/positive-keywords" element={<HvacKeywords />} />
              <Route path="/page-builder/company/:companyId/negative-keywords" element={<NegativeKeywords />} />
              <Route path="/page-builder/company/:companyId/negative-search-terms" element={<NegativeKeywords />} />
              <Route path="/page-builder/company/:companyId/positive-search-terms" element={<HvacKeywords />} />
              <Route path="/page-builder/company/:companyId/hvac-parts" element={<HvacParts />} />
              <Route path="/page-builder/company/:companyId/equipment-brands" element={<EquipmentBrands />} />
              <Route path="/page-builder/company/:companyId/plumbing-brands" element={<PlumbingBrands />} />
              <Route path="/page-builder/company/:companyId/areas-service" element={<AreasService />} />
              <Route path="/page-builder/company/:companyId/images-logos" element={<CompanyImages />} />
              <Route path="/page-builder/company/:companyId/site-templates" element={<SiteTemplates />} />
              <Route path="/page-builder/company/:companyId/local-business" element={<LocalBusiness />} />
              <Route path="/page-builder/company/:companyId/profile" element={<CompanyWebsiteMockup />} />
              <Route path="/page-builder/company/:companyId/top-header" element={<TopHeaderPreview />} />
              <Route path="/page-builder/company/:companyId/banner" element={<BannerPreview />} />
              {/* Header Pages routes */}
              <Route path="/page-builder/company/:companyId/header-pages/about-us" element={<HeaderPageAboutUs />} />
              <Route path="/page-builder/company/:companyId/header-pages/financing" element={<HeaderPageFinancing />} />
              <Route path="/page-builder/company/:companyId/header-pages/services" element={<HeaderPageServices />} />
              <Route path="/page-builder/company/:companyId/header-pages/residential" element={<HeaderPageResidential />} />
              <Route path="/page-builder/company/:companyId/header-pages/commercial" element={<HeaderPageCommercial />} />
              <Route path="/page-builder/company/:companyId/header-pages/air-quality" element={<HeaderPageAirQuality />} />
              {/* CTA Icons routes */}
              <Route path="/page-builder/company/:companyId/cta-icons/add" element={<CTAIconsAdd />} />
              <Route path="/page-builder/company/:companyId/cta-icons/library" element={<CTAIconsLibrary />} />
              <Route path="/page-builder/company/:companyId/cta-icons/assignments" element={<CTAIconsAssignments />} />
              {/* Accordion List routes */}
              <Route path="/page-builder/company/:companyId/accordion-list/hvac/areas-service" element={<AreasService />} />
              <Route path="/page-builder/company/:companyId/accordion-list/hvac/brands-install" element={<BrandsInstall />} />
              <Route path="/page-builder/company/:companyId/accordion-list/hvac/brands-service" element={<BrandsService />} />
              <Route path="/page-builder/company/:companyId/accordion-list/hvac/brands-repair" element={<BrandsRepair />} />
              {/* Plumbing Accordion List routes */}
              <Route path="/page-builder/company/:companyId/accordion-list/plumbing/types-install" element={<PlumbingTypesInstall />} />
              <Route path="/page-builder/company/:companyId/accordion-list/plumbing/types-service" element={<PlumbingTypesService />} />
              <Route path="/page-builder/company/:companyId/accordion-list/plumbing/types-repair" element={<PlumbingTypesRepair />} />
              {/* Coupon route */}
              <Route path="/page-builder/company/:companyId/accordion-list/coupon" element={<CouponList />} />
              {/* Partner Listings routes */}
              <Route path="/page-builder/company/:companyId/partner-listings" element={<PartnerListingsList />} />
              <Route path="/page-builder/company/:companyId/partner-listings/add" element={<PartnerListingsAdd />} />
              <Route path="/page-builder/company/:companyId/partner-listings/edit" element={<PartnerListingsAdd />} />
              {/* Marquee routes */}
              <Route path="/page-builder/company/:companyId/marquee" element={<MarqueeList />} />
              <Route path="/page-builder/company/:companyId/marquee/add" element={<MarqueeAdd />} />
              <Route path="/page-builder/company/:companyId/marquee/edit" element={<MarqueeAdd />} />
              <Route path="/logs/call" element={<CallLogAdd />} />
              <Route path="/logs/list" element={<LogsList />} />
              <Route path="/calendar/add" element={<CalendarAdd />} />
              <Route path="/calendar/list" element={<CalendarList />} />
            </Routes>
          </main>
        </div>
      </div>
    );
  };

  return renderContent();
};

export default Admin;
