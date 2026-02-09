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
                  {/* Micro-website layout */}
                  <div className="border-t relative overflow-hidden">
                    {/* Background image layer */}
                    {partner.bg_image_url && (
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-15"
                        style={{ backgroundImage: `url(${partner.bg_image_url})` }}
                      />
                    )}

                    <div className="relative z-10">
                      {/* Top Banner: Logo + Name + Phone */}
                      <div
                        className="flex items-center justify-between px-6 py-4 border-b"
                        style={{ backgroundColor: `${primaryColor}15` }}
                      >
                        <div className="flex items-center gap-3">
                          <h4 className="font-bold text-lg">{partner.business_name}</h4>
                        </div>
                        <div className="flex items-center gap-3">
                          {partner.logo_url && (
                            <img
                              src={partner.logo_url}
                              alt={partner.logo_alt_text || partner.business_name}
                              className="h-10 w-auto object-contain"
                            />
                          )}
                          {partner.business_phone && (
                            <a
                              href={`tel:${partner.business_phone}`}
                              className="font-bold text-lg whitespace-nowrap"
                              style={{ color: primaryColor }}
                            >
                              {partner.business_phone}
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Text Box 1: Introduction */}
                      {partner.first_paragraph && (
                        <div className="mx-6 mt-5">
                          <div
                            className="rounded-lg border-2 p-4 text-center"
                            style={{ borderColor: `${primaryColor}60`, backgroundColor: `${primaryColor}08` }}
                          >
                            <p className="text-sm font-semibold mb-1" style={{ color: primaryColor }}>
                              Introduction
                            </p>
                            <p className="text-foreground/80 text-sm leading-relaxed">
                              {partner.first_paragraph}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Affiliates row (brand logos) */}
                      {partner.affiliates && partner.affiliates.length > 0 && (
                        <div className="mx-6 mt-4 flex flex-wrap items-center justify-center gap-4">
                          {partner.affiliates.map((affiliate, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-1">
                              {affiliate.logo_url ? (
                                <img
                                  src={affiliate.logo_url}
                                  alt={affiliate.alt_text || affiliate.business_name}
                                  className="h-12 w-auto object-contain"
                                />
                              ) : (
                                <div className="bg-muted rounded px-3 py-2 flex items-center gap-2">
                                  <Building2 className="h-5 w-5 text-muted-foreground" />
                                  <span className="text-xs font-medium">{affiliate.custom_name || affiliate.business_name}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Text Box 2: Details with two-column bullets */}
                      {(partner.second_paragraph || (partner.first_bullets && partner.first_bullets.length > 0) || (partner.second_bullets && partner.second_bullets.length > 0)) && (
                        <div className="mx-6 mt-4">
                          <div
                            className="rounded-lg border-2 p-4"
                            style={{ borderColor: `${primaryColor}60`, backgroundColor: `${primaryColor}08` }}
                          >
                            {partner.second_paragraph && (
                              <p className="text-foreground/80 text-sm leading-relaxed text-center mb-3">
                                {partner.second_paragraph}
                              </p>
                            )}

                            {/* Two-column bullet layout */}
                            {((partner.first_bullets && partner.first_bullets.length > 0) || (partner.second_bullets && partner.second_bullets.length > 0)) && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                                {partner.first_bullets && partner.first_bullets.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: primaryColor }}>
                                      Services
                                    </p>
                                    <ul className="space-y-1">
                                      {partner.first_bullets.map((bullet, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm">
                                          <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: primaryColor }} />
                                          <span>{bullet}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {partner.second_bullets && partner.second_bullets.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: primaryColor }}>
                                      Features
                                    </p>
                                    <ul className="space-y-1">
                                      {partner.second_bullets.map((bullet, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm">
                                          <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: primaryColor }} />
                                          <span>{bullet}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Best If Used For */}
                      {partner.best_if_used_for && (
                        <div className="mx-6 mt-4">
                          <div className="bg-muted/50 rounded-lg p-3">
                            <h5 className="font-semibold text-xs uppercase tracking-wide mb-1" style={{ color: primaryColor }}>
                              Best If Used For
                            </h5>
                            <p className="text-sm text-foreground/80">{partner.best_if_used_for}</p>
                          </div>
                        </div>
                      )}

                      {/* Contact Footer */}
                      <div
                        className="mx-6 mt-4 mb-5 rounded-lg p-4 flex flex-wrap items-center justify-center gap-4"
                        style={{ backgroundColor: `${primaryColor}15` }}
                      >
                        {partner.contact_email && (
                          <a
                            href={`mailto:${partner.contact_email}`}
                            className="flex items-center gap-2 text-sm font-medium hover:underline"
                            style={{ color: primaryColor }}
                          >
                            <Mail className="h-4 w-4" />
                            {partner.contact_email}
                          </a>
                        )}
                        {partner.website_url && (
                          <a
                            href={partner.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm font-medium hover:underline"
                            style={{ color: primaryColor }}
                          >
                            <ExternalLink className="h-4 w-4" />
                            {partner.website_url}
                          </a>
                        )}
                        {partner.business_phone && (
                          <a
                            href={`tel:${partner.business_phone}`}
                            className="flex items-center gap-2 text-sm font-medium hover:underline"
                            style={{ color: primaryColor }}
                          >
                            <Phone className="h-4 w-4" />
                            {partner.business_phone}
                          </a>
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
