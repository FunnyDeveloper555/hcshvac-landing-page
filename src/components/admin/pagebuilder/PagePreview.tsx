import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Globe, Phone, Mail, MapPin, Star, Shield, Clock } from "lucide-react";

interface GeneratedPage {
  id: string;
  slug: string;
  title: string;
  meta_description: string | null;
  audience_type: string | null;
  visit_type: string | null;
  equipment_type: string | null;
  location_city: string | null;
  location_county: string | null;
  location_state: string | null;
  status: string;
  campaign_id: string;
  company_id: string | null;
}

interface Company {
  name: string;
  company_phone: string | null;
  company_email_primary: string | null;
  company_address: string | null;
  company_city: string | null;
  company_state: string | null;
  logo_url: string | null;
  primary_color: string | null;
  website_tagline: string | null;
}

export default function PagePreview() {
  const { pageId } = useParams();
  const navigate = useNavigate();

  const { data: page, isLoading } = useQuery({
    queryKey: ["generated-page", pageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("generated_pages")
        .select("*")
        .eq("id", pageId)
        .single();
      if (error) throw error;
      return data as GeneratedPage;
    },
  });

  const { data: company } = useQuery({
    queryKey: ["company", page?.company_id],
    queryFn: async () => {
      if (!page?.company_id) return null;
      const { data, error } = await supabase
        .from("companies")
        .select("name, company_phone, company_email_primary, company_address, company_city, company_state, logo_url, primary_color, website_tagline")
        .eq("id", page.company_id)
        .single();
      if (error) throw error;
      return data as Company;
    },
    enabled: !!page?.company_id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading preview...</p>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Page not found</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const locationDisplay = page.location_city || page.location_county || page.location_state || "Your Area";
  const companyName = company?.name || "HVAC Services";
  const primaryColor = company?.primary_color || "#0d7c66";

  return (
    <div className="min-h-screen bg-background">
      {/* Preview Header Bar */}
      <div className="sticky top-0 z-50 bg-muted border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pages
          </Button>
          <Badge variant={page.status === "published" ? "default" : "secondary"}>
            {page.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">Preview: /{page.slug}</p>
      </div>

      {/* Landing Page Preview */}
      <div className="border-4 border-dashed border-muted m-4 rounded-lg overflow-hidden">
        {/* Hero Section */}
        <section 
          className="relative py-20 px-4 text-white"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              {company?.logo_url && (
                <img src={company.logo_url} alt={companyName} className="h-12 w-auto" />
              )}
              <span className="text-2xl font-bold">{companyName}</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {page.title}
            </h1>
            
            <p className="text-xl opacity-90 mb-8 max-w-2xl">
              {page.meta_description}
            </p>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" variant="secondary">
                <Phone className="mr-2 h-5 w-5" />
                Call Now
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 border-white text-white hover:bg-white/20">
                Schedule Service
              </Button>
            </div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="py-8 bg-muted/50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold">Licensed & Insured</p>
                  <p className="text-sm text-muted-foreground">Fully certified</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Star className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold">5-Star Rated</p>
                  <p className="text-sm text-muted-foreground">Trusted by customers</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold">24/7 Available</p>
                  <p className="text-sm text-muted-foreground">Emergency service</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold">Local to {locationDisplay}</p>
                  <p className="text-sm text-muted-foreground">Fast response</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">
              Our {page.visit_type ? page.visit_type.charAt(0).toUpperCase() + page.visit_type.slice(1) : "HVAC"} Services
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {["Heating Systems", "Cooling Systems", "Air Quality"].map((service, i) => (
                <div key={i} className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
                  <h3 className="text-xl font-semibold mb-2">{service}</h3>
                  <p className="text-muted-foreground mb-4">
                    Professional {page.visit_type || "service"} for {page.audience_type || "residential and commercial"} customers in {locationDisplay}.
                  </p>
                  <Button variant="outline" size="sm">Learn More</Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Equipment Section */}
        {page.equipment_type && (
          <section className="py-16 px-4 bg-muted/30">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold mb-4 text-center">
                {page.equipment_type.charAt(0).toUpperCase() + page.equipment_type.slice(1).replace(/-/g, " ")} Specialists
              </h2>
              <p className="text-center text-muted-foreground max-w-2xl mx-auto">
                We specialize in {page.equipment_type.replace(/-/g, " ")} systems for {page.audience_type || "all"} properties in {locationDisplay}. 
                Our certified technicians provide expert {page.visit_type || "service"} to keep your system running efficiently.
              </p>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-16 px-4" style={{ backgroundColor: primaryColor }}>
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl font-bold mb-4">
              Ready for Expert {page.visit_type ? page.visit_type.charAt(0).toUpperCase() + page.visit_type.slice(1) : "Service"} in {locationDisplay}?
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Contact us today for a free estimate
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" variant="secondary">
                <Phone className="mr-2 h-5 w-5" />
                {company?.company_phone || "(555) 123-4567"}
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 border-white text-white hover:bg-white/20">
                <Mail className="mr-2 h-5 w-5" />
                Get Quote
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 bg-foreground text-background">
          <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4">
            <div>
              <p className="font-bold text-lg">{companyName}</p>
              <p className="text-sm opacity-70">
                Serving {locationDisplay} and surrounding areas
              </p>
            </div>
            <div className="flex items-center gap-6 text-sm opacity-70">
              <a href="#" className="hover:opacity-100">Privacy Policy</a>
              <a href="#" className="hover:opacity-100">Terms of Service</a>
              <a href="#" className="hover:opacity-100">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
