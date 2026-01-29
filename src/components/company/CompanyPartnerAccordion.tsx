import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Building2, Phone, Mail, ExternalLink, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Affiliate {
  logo_url: string;
  business_name: string;
  custom_name: string;
  alt_text: string;
}

interface PartnerListing {
  id: string;
  business_name: string;
  business_phone: string | null;
  logo_url: string | null;
  logo_alt_text: string | null;
  bg_image_url: string | null;
  bg_alt_text: string | null;
  first_paragraph: string | null;
  first_bullets: string[] | null;
  second_paragraph: string | null;
  second_bullets: string[] | null;
  affiliates: Affiliate[] | null;
  website_url: string | null;
  contact_email: string | null;
  best_if_used_for: string | null;
}

interface CompanyPartnerAccordionProps {
  companyId: string;
  primaryColor?: string;
}

export default function CompanyPartnerAccordion({ companyId, primaryColor = "#0ea5e9" }: CompanyPartnerAccordionProps) {
  const { data: partners = [], isLoading } = useQuery({
    queryKey: ["partner-listings-public", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_listings")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      
      // Map the data to properly type the JSONB fields
      return (data || []).map(item => ({
        ...item,
        first_bullets: Array.isArray(item.first_bullets) ? item.first_bullets as string[] : null,
        second_bullets: Array.isArray(item.second_bullets) ? item.second_bullets as string[] : null,
        affiliates: Array.isArray(item.affiliates) ? item.affiliates as unknown as Affiliate[] : null,
      })) as PartnerListing[];
    },
    enabled: !!companyId,
  });

  if (isLoading || partners.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Our Partners</h2>
          <p className="text-muted-foreground">
            Trusted companies we work with to provide you the best service
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Accordion type="multiple" className="space-y-3">
            {partners.map((partner) => (
              <AccordionItem
                key={partner.id}
                value={partner.id}
                className="border rounded-lg overflow-hidden bg-card shadow-sm"
              >
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
                  <div className="flex items-center gap-4 w-full">
                    {partner.logo_url ? (
                      <img
                        src={partner.logo_url}
                        alt={partner.logo_alt_text || partner.business_name}
                        className="h-12 w-12 object-contain rounded"
                      />
                    ) : (
                      <div
                        className="h-12 w-12 rounded flex items-center justify-center"
                        style={{ backgroundColor: `${primaryColor}20` }}
                      >
                        <Building2 className="h-6 w-6" style={{ color: primaryColor }} />
                      </div>
                    )}
                    <div className="text-left">
                      <h3 className="font-semibold text-lg">{partner.business_name}</h3>
                      {partner.business_phone && (
                        <p className="text-sm text-muted-foreground">{partner.business_phone}</p>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-0 pb-0">
                  {/* Micro-website content */}
                  <div className="border-t">
                    {/* Header with background */}
                    {partner.bg_image_url && (
                      <div
                        className="h-32 bg-cover bg-center relative"
                        style={{ backgroundImage: `url(${partner.bg_image_url})` }}
                      >
                        <div className="absolute inset-0 bg-black/40" />
                        <div className="absolute bottom-4 left-6 text-white">
                          <h4 className="text-xl font-bold">{partner.business_name}</h4>
                        </div>
                      </div>
                    )}

                    <div className="p-6 space-y-6">
                      {/* First Paragraph & Bullets */}
                      {(partner.first_paragraph || (partner.first_bullets && partner.first_bullets.length > 0)) && (
                        <div className="space-y-3">
                          {partner.first_paragraph && (
                            <p className="text-foreground/80 leading-relaxed">
                              {partner.first_paragraph}
                            </p>
                          )}
                          {partner.first_bullets && partner.first_bullets.length > 0 && (
                            <ul className="space-y-2">
                              {partner.first_bullets.map((bullet, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <CheckCircle 
                                    className="h-5 w-5 mt-0.5 shrink-0" 
                                    style={{ color: primaryColor }} 
                                  />
                                  <span>{bullet}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                      {/* Second Paragraph & Bullets */}
                      {(partner.second_paragraph || (partner.second_bullets && partner.second_bullets.length > 0)) && (
                        <div className="space-y-3">
                          {partner.second_paragraph && (
                            <p className="text-foreground/80 leading-relaxed">
                              {partner.second_paragraph}
                            </p>
                          )}
                          {partner.second_bullets && partner.second_bullets.length > 0 && (
                            <ul className="space-y-2">
                              {partner.second_bullets.map((bullet, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <CheckCircle 
                                    className="h-5 w-5 mt-0.5 shrink-0" 
                                    style={{ color: primaryColor }} 
                                  />
                                  <span>{bullet}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                      {/* Affiliates */}
                      {partner.affiliates && partner.affiliates.length > 0 && (
                        <div className="space-y-3">
                          <h5 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                            Affiliations
                          </h5>
                          <div className="flex flex-wrap gap-4">
                            {partner.affiliates.map((affiliate, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2"
                              >
                                {affiliate.logo_url ? (
                                  <img
                                    src={affiliate.logo_url}
                                    alt={affiliate.alt_text || affiliate.business_name}
                                    className="h-8 w-8 object-contain"
                                  />
                                ) : (
                                  <Building2 className="h-6 w-6 text-muted-foreground" />
                                )}
                                <span className="text-sm font-medium">{affiliate.business_name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Best If Used For */}
                      {partner.best_if_used_for && (
                        <div className="bg-muted/50 rounded-lg p-4">
                          <h5 className="font-semibold text-sm mb-2">Best If Used For</h5>
                          <p className="text-sm text-foreground/80">{partner.best_if_used_for}</p>
                        </div>
                      )}

                      {/* Contact Section */}
                      <div className="flex flex-wrap gap-3 pt-4 border-t">
                        {partner.business_phone && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={`tel:${partner.business_phone}`}>
                              <Phone className="mr-2 h-4 w-4" />
                              Call
                            </a>
                          </Button>
                        )}
                        {partner.contact_email && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={`mailto:${partner.contact_email}`}>
                              <Mail className="mr-2 h-4 w-4" />
                              Email
                            </a>
                          </Button>
                        )}
                        {partner.website_url && (
                          <Button
                            size="sm"
                            style={{ backgroundColor: primaryColor }}
                            asChild
                          >
                            <a href={partner.website_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Visit Website
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
