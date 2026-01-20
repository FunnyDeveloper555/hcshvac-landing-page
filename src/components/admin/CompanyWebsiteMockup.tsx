import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Phone, Mail, MapPin, Wrench, Building2, Tag, Users, Star, Clock, Shield, Award } from "lucide-react";

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
  coupon_1_title: string | null;
  coupon_1_description: string | null;
  coupon_1_code: string | null;
  coupon_2_title: string | null;
  coupon_2_description: string | null;
  coupon_2_code: string | null;
  coupon_3_title: string | null;
  coupon_3_description: string | null;
  coupon_3_code: string | null;
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
}

const CompanyWebsiteMockup = () => {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompany = async () => {
      // For now, fetch the first active company - in production, this would be tied to the logged-in user's company
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("is_active", true)
        .limit(1)
        .single();

      if (!error && data) {
        // Cast the data properly handling JSONB fields
        const companyData = {
          ...data,
          partner_companies: data.partner_companies as Array<{ name: string; url: string }> | null,
        } as Company;
        setCompany(companyData);
      }
      setLoading(false);
    };

    fetchCompany();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">No company profile found. Please complete your company registration first.</p>
      </div>
    );
  }

  const primaryColor = company.primary_color || "#0ea5e9";

  return (
    <div className="space-y-6">
      {/* Mockup Indicator */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
          MOCKUP PREVIEW
        </Badge>
        <p className="text-amber-800 text-sm">
          This is a preview of your company website structure. Visit{" "}
          <span className="font-mono font-medium">/company/{company.slug}</span> to see the live site.
        </p>
      </div>

      {/* Website Frame */}
      <div className="border-4 border-muted rounded-xl overflow-hidden bg-background shadow-2xl">
        {/* Browser Bar Mockup */}
        <div className="bg-muted px-4 py-2 flex items-center gap-2 border-b">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 mx-4">
            <div className="bg-background rounded-md px-3 py-1 text-sm text-muted-foreground flex items-center gap-2">
              <span className="text-green-600">🔒</span>
              {company.slug}.hcshvac.com
            </div>
          </div>
        </div>

        {/* ======== HEADER SECTION ======== */}
        <div 
          className="p-4 flex items-center justify-between border-b"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="flex items-center gap-3">
            {company.logo_url ? (
              <img src={company.logo_url} alt="Logo" className="h-10 w-auto" />
            ) : (
              <div className="w-10 h-10 rounded bg-white/20 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="text-white">
              <h1 className="font-bold text-lg">{company.name}</h1>
              {company.website_tagline && (
                <p className="text-white/80 text-xs">{company.website_tagline}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 text-white text-sm">
            {company.company_email_primary && (
              <span className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {company.company_email_primary}
              </span>
            )}
            {company.company_phone && (
              <span className="flex items-center gap-1 font-bold">
                <Phone className="w-4 h-4" />
                {company.company_phone}
              </span>
            )}
          </div>
        </div>

        {/* ======== HERO SECTION ======== */}
        <div className="relative bg-gradient-to-r from-slate-900 to-slate-700 text-white p-12">
          <div className="max-w-2xl">
            <Badge className="mb-4 bg-white/20 text-white hover:bg-white/30">
              {company.theme_style?.toUpperCase()} THEME
            </Badge>
            <h2 className="text-4xl font-bold mb-4">
              {company.website_title || company.name}
            </h2>
            <p className="text-xl mb-6 text-white/90">
              {company.website_description || "Professional HVAC services for your home and business."}
            </p>
            <div className="flex gap-4">
              <div 
                className="px-6 py-3 rounded-lg font-semibold text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Call {company.company_phone || "(555) 000-0000"}
              </div>
              <div className="px-6 py-3 rounded-lg font-semibold bg-white text-slate-900">
                Get a Quote
              </div>
            </div>
          </div>
          {/* Hero image placeholder */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-20">
            <Wrench className="w-48 h-48" />
          </div>
        </div>

        {/* ======== COUPONS SECTION ======== */}
        {(company.coupon_1_title || company.coupon_2_title || company.coupon_3_title) && (
          <div className="bg-muted/50 p-8">
            <h3 className="text-2xl font-bold text-center mb-6 flex items-center justify-center gap-2">
              <Tag className="w-6 h-6" style={{ color: primaryColor }} />
              Special Offers
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {company.coupon_1_title && (
                <Card className="border-2 border-dashed" style={{ borderColor: primaryColor }}>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold" style={{ color: primaryColor }}>{company.coupon_1_title}</p>
                    <p className="text-muted-foreground text-sm">{company.coupon_1_description}</p>
                    {company.coupon_1_code && (
                      <Badge variant="outline" className="mt-2">{company.coupon_1_code}</Badge>
                    )}
                  </CardContent>
                </Card>
              )}
              {company.coupon_2_title && (
                <Card className="border-2 border-dashed" style={{ borderColor: primaryColor }}>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold" style={{ color: primaryColor }}>{company.coupon_2_title}</p>
                    <p className="text-muted-foreground text-sm">{company.coupon_2_description}</p>
                    {company.coupon_2_code && (
                      <Badge variant="outline" className="mt-2">{company.coupon_2_code}</Badge>
                    )}
                  </CardContent>
                </Card>
              )}
              {company.coupon_3_title && (
                <Card className="border-2 border-dashed" style={{ borderColor: primaryColor }}>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold" style={{ color: primaryColor }}>{company.coupon_3_title}</p>
                    <p className="text-muted-foreground text-sm">{company.coupon_3_description}</p>
                    {company.coupon_3_code && (
                      <Badge variant="outline" className="mt-2">{company.coupon_3_code}</Badge>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* ======== SERVICES SECTION ======== */}
        <div className="p-8">
          <h3 className="text-2xl font-bold text-center mb-6 flex items-center justify-center gap-2">
            <Wrench className="w-6 h-6" style={{ color: primaryColor }} />
            Our Services
          </h3>
          
          {/* HVAC Equipment */}
          {(company.hvac_equipment_install?.length || company.hvac_equipment_service?.length || company.hvac_equipment_repair?.length) ? (
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {company.hvac_equipment_install && company.hvac_equipment_install.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="w-5 h-5" style={{ color: primaryColor }} />
                      HVAC Installation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {company.hvac_equipment_install.map((item, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">{item}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {company.hvac_equipment_service && company.hvac_equipment_service.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="w-5 h-5" style={{ color: primaryColor }} />
                      HVAC Service
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {company.hvac_equipment_service.map((item, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">{item}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {company.hvac_equipment_repair && company.hvac_equipment_repair.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wrench className="w-5 h-5" style={{ color: primaryColor }} />
                      HVAC Repair
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {company.hvac_equipment_repair.map((item, idx) => (
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
          {(company.plumbing_equipment_install?.length || company.plumbing_equipment_service?.length || company.plumbing_equipment_repair?.length) && (
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {company.plumbing_equipment_install && company.plumbing_equipment_install.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Plumbing Installation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {company.plumbing_equipment_install.map((item, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">{item}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {company.plumbing_equipment_service && company.plumbing_equipment_service.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Plumbing Service</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {company.plumbing_equipment_service.map((item, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">{item}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {company.plumbing_equipment_repair && company.plumbing_equipment_repair.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Plumbing Repair</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {company.plumbing_equipment_repair.map((item, idx) => (
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
        {(company.hvac_brands_install?.length || company.hvac_brands_service?.length || company.hvac_brands_repair?.length) && (
          <div className="bg-muted/30 p-8">
            <h3 className="text-2xl font-bold text-center mb-6 flex items-center justify-center gap-2">
              <Award className="w-6 h-6" style={{ color: primaryColor }} />
              Brands We Work With
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              {company.hvac_brands_install && company.hvac_brands_install.length > 0 && (
                <div className="text-center">
                  <h4 className="font-semibold mb-3">Brands We Install</h4>
                  <div className="flex flex-wrap justify-center gap-2">
                    {company.hvac_brands_install.map((brand, idx) => (
                      <Badge key={idx} style={{ backgroundColor: primaryColor }} className="text-white">{brand}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {company.hvac_brands_service && company.hvac_brands_service.length > 0 && (
                <div className="text-center">
                  <h4 className="font-semibold mb-3">Brands We Service</h4>
                  <div className="flex flex-wrap justify-center gap-2">
                    {company.hvac_brands_service.map((brand, idx) => (
                      <Badge key={idx} variant="secondary">{brand}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {company.hvac_brands_repair && company.hvac_brands_repair.length > 0 && (
                <div className="text-center">
                  <h4 className="font-semibold mb-3">Brands We Repair</h4>
                  <div className="flex flex-wrap justify-center gap-2">
                    {company.hvac_brands_repair.map((brand, idx) => (
                      <Badge key={idx} variant="outline">{brand}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======== SERVICE AREAS SECTION ======== */}
        {company.service_areas && company.service_areas.length > 0 && (
          <div className="p-8">
            <h3 className="text-2xl font-bold text-center mb-6 flex items-center justify-center gap-2">
              <MapPin className="w-6 h-6" style={{ color: primaryColor }} />
              Service Areas
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              {company.service_areas.map((area, idx) => (
                <Badge key={idx} variant="outline" className="text-sm py-1 px-3">{area}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* ======== FINANCING SECTION ======== */}
        {company.financing_enabled && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-8 border-t border-b border-green-200">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-green-800 mb-2">Financing Available</h3>
              <p className="text-green-700">
                {company.financing_provider 
                  ? `We partner with ${company.financing_provider} to offer flexible financing options.`
                  : "We offer flexible financing options for your HVAC needs."
                }
              </p>
              {company.financing_url && (
                <Badge className="mt-3 bg-green-600">Apply Now</Badge>
              )}
            </div>
          </div>
        )}

        {/* ======== PARTNER COMPANIES SECTION ======== */}
        {company.partner_companies && company.partner_companies.length > 0 && (
          <div className="p-8 bg-muted/20">
            <h3 className="text-2xl font-bold text-center mb-6 flex items-center justify-center gap-2">
              <Users className="w-6 h-6" style={{ color: primaryColor }} />
              Our Partners
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              {company.partner_companies.map((partner, idx) => (
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
                <Phone className="w-8 h-8 mx-auto mb-3" style={{ color: primaryColor }} />
                <h4 className="font-semibold mb-1">Phone</h4>
                <p className="text-muted-foreground">{company.company_phone || "Not set"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Mail className="w-8 h-8 mx-auto mb-3" style={{ color: primaryColor }} />
                <h4 className="font-semibold mb-1">Email</h4>
                <p className="text-muted-foreground text-sm">{company.company_email_primary || "Not set"}</p>
                {company.company_support_email && (
                  <p className="text-muted-foreground text-xs mt-1">Support: {company.company_support_email}</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <MapPin className="w-8 h-8 mx-auto mb-3" style={{ color: primaryColor }} />
                <h4 className="font-semibold mb-1">Address</h4>
                <p className="text-muted-foreground text-sm">
                  {company.company_address || "Not set"}
                  {company.company_city && <><br />{company.company_city}, {company.company_state} {company.company_zip_code}</>}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ======== POINT OF CONTACT ======== */}
        {(company.poc_first_name || company.poc_email) && (
          <div className="p-6 border-t">
            <div className="text-center">
              <h4 className="font-semibold mb-2">Primary Contact</h4>
              <p className="text-muted-foreground">
                {company.poc_first_name} {company.poc_last_name}
                {company.poc_title && <span className="text-sm"> ({company.poc_title})</span>}
              </p>
              {company.poc_email && <p className="text-sm text-muted-foreground">{company.poc_email}</p>}
              {company.poc_phone && <p className="text-sm text-muted-foreground">{company.poc_phone}</p>}
            </div>
          </div>
        )}

        {/* ======== FOOTER SECTION ======== */}
        <div 
          className="p-6 text-center text-white"
          style={{ backgroundColor: primaryColor }}
        >
          <p className="font-bold text-lg mb-2">{company.name}</p>
          <p className="text-white/80 text-sm">
            © {new Date().getFullYear()} {company.name}. All rights reserved.
          </p>
          <p className="text-white/60 text-xs mt-2">
            Theme: {company.theme_style || "modern"} | Color: {company.primary_color || "Default"}
          </p>
        </div>
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
              <span className="ml-2 font-medium">{company.service_areas?.length || 0}</span>
            </div>
            <div>
              <span className="text-muted-foreground">HVAC Equipment Types:</span>
              <span className="ml-2 font-medium">
                {(company.hvac_equipment_install?.length || 0) + 
                 (company.hvac_equipment_service?.length || 0) + 
                 (company.hvac_equipment_repair?.length || 0)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Brands:</span>
              <span className="ml-2 font-medium">
                {(company.hvac_brands_install?.length || 0) + 
                 (company.hvac_brands_service?.length || 0) + 
                 (company.hvac_brands_repair?.length || 0)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Coupons:</span>
              <span className="ml-2 font-medium">
                {[company.coupon_1_title, company.coupon_2_title, company.coupon_3_title].filter(Boolean).length}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyWebsiteMockup;
