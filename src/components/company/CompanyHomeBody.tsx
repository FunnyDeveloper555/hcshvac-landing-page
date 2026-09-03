import { Accordion } from "@/components/ui/accordion";
import CompanyServiceAreasAccordion from "@/components/company/CompanyServiceAreasAccordion";
import CompanyBrandsAccordion from "@/components/company/CompanyBrandsAccordion";
import CompanyBrandsServiceAccordion from "@/components/company/CompanyBrandsServiceAccordion";
import CompanyBrandsRepairAccordion from "@/components/company/CompanyBrandsRepairAccordion";
import PlumbingTypesInstallAccordion from "@/components/company/PlumbingTypesInstallAccordion";
import PlumbingTypesServiceAccordion from "@/components/company/PlumbingTypesServiceAccordion";
import PlumbingTypesRepairAccordion from "@/components/company/PlumbingTypesRepairAccordion";
import CompanyEquipmentListAccordion from "@/components/company/CompanyEquipmentListAccordion";
import CompanyPartnerAccordion from "@/components/company/CompanyPartnerAccordion";
import CompanyCoupons from "@/components/company/CompanyCoupons";
import CompanyContact from "@/components/company/CompanyContact";

interface Coupon {
  title: string;
  description: string;
  code: string;
}

/**
 * Shared body sections for company sites (accordions, partners, coupons, contact).
 * Used on the home page and on every generated mass page.
 */
interface CompanyHomeBodyProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  company: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  theme: any;
  /** Hide the contact block when the host page renders its own. */
  showContact?: boolean;
  /** Campaign theme family used to style Partners / Offers / Contact blocks. */
  variant?: "standard" | "spotlight" | "conversion" | "editorial" | "compact";
}

const EQUIPMENT_FIELDS = [
  "boilers_install", "boilers_service", "boilers_repair",
  "water_heaters_install", "water_heaters_service", "water_heaters_repair",
  "coils_install", "coils_service", "coils_repair",
  "gas_pipe_install", "gas_pipe_service", "gas_pipe_repair",
] as const;

const BODY_VARIANT_STYLES: Record<
  string,
  { partners: string; coupons: string; contact: string }
> = {
  standard: {
    partners: "bg-muted/30 border-y",
    coupons: "bg-background border-t-4 border-primary",
    contact: "bg-primary/5 border-t",
  },
};

const CompanyHomeBody = ({
  company,
  theme,
  showContact = true,
  variant = "standard",
}: CompanyHomeBodyProps) => {
  const vs = BODY_VARIANT_STYLES[variant] || BODY_VARIANT_STYLES.standard;
  const hasLists =
    (company.service_areas?.length ?? 0) > 0 ||
    (company.hvac_brands_install?.length ?? 0) > 0 ||
    (company.hvac_brands_service?.length ?? 0) > 0 ||
    (company.hvac_brands_repair?.length ?? 0) > 0 ||
    (company.plumbing_equipment_install?.length ?? 0) > 0 ||
    (company.plumbing_equipment_service?.length ?? 0) > 0 ||
    (company.plumbing_equipment_repair?.length ?? 0) > 0 ||
    EQUIPMENT_FIELDS.some((f) => (company[f] as string[] | null)?.length);

  const coupons = (company.coupons || []) as Coupon[];

  return (
    <>
      {hasLists && (
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
                {([
                  { key: "boilers", title: "Boilers" },
                  { key: "water_heaters", title: "Water Heaters" },
                  { key: "coils", title: "Coils" },
                  { key: "gas_pipe", title: "Gas Pipe" },
                ] as const).flatMap(({ key, title }) =>
                  ([
                    { suffix: "install", label: `${title} We Install` },
                    { suffix: "service", label: `${title} We Service` },
                    { suffix: "repair", label: `${title} We Repair` },
                  ] as const).map(({ suffix, label }) => {
                    const field = `${key}_${suffix}`;
                    return (
                      <CompanyEquipmentListAccordion
                        key={field}
                        value={field}
                        title={label}
                        items={(company[field] as string[] | null) ?? null}
                        primaryColor={theme.colors.primary}
                      />
                    );
                  })
                )}
              </Accordion>
            </div>
          </div>
        </section>
      )}

      <div className={vs.partners}>
        <CompanyPartnerAccordion companyId={company.id} primaryColor={theme.colors.primary} />
      </div>
      <div className={vs.coupons}>
        <CompanyCoupons coupons={coupons} primaryColor={theme.colors.primary} />
      </div>
      {showContact && (
        <div id="company-contact" className={vs.contact}>
          <CompanyContact company={company} theme={theme} />
        </div>
      )}
    </>
  );
};

export default CompanyHomeBody;
