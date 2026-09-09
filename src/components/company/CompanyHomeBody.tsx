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
  /** Mass page title prefix used in the "Other Areas We Service" city labels. */
  areasTitlePrefix?: string | null;
}

const EQUIPMENT_FIELDS = [
  "boilers_install", "boilers_service", "boilers_repair",
  "water_heaters_install", "water_heaters_service", "water_heaters_repair",
  "coils_install", "coils_service", "coils_repair",
  "gas_pipe_install", "gas_pipe_service", "gas_pipe_repair",
] as const;

/**
 * Each campaign theme frames Our Partners / Special Offers / Contact Us
 * differently so the five templates read as distinct designs.
 */
/**
 * Our Partners gets a structurally different treatment per theme:
 * card grid, glass panel, ticket rows, editorial rules, or a dense list.
 */
const PARTNER_STYLES: Record<string, string> = {
  standard: [
    "bg-muted/30 border-y",
    "[&_section]:!py-12",
    "[&_.max-w-4xl]:!max-w-5xl",
    // two-column card grid with lift on hover
    "[&_.space-y-3]:!grid [&_.space-y-3]:!gap-4 [&_.space-y-3]:sm:!grid-cols-2 [&_.space-y-3]:!space-y-0",
    "[&_.space-y-3>div]:!self-start [&_.space-y-3>div]:!transition-shadow [&_.space-y-3>div]:hover:!shadow-lg",
    "[&_h2]:!text-3xl [&_h2]:!font-bold",
  ].join(" "),
  spotlight: [
    "relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/60 text-primary-foreground",
    "[&_section]:!bg-transparent [&_section]:!py-16",
    "[&_h2]:!text-4xl [&_h2]:!font-semibold [&_h2]:!tracking-tight",
    "[&_.text-muted-foreground]:!text-primary-foreground/80",
    // floating glass cards, staggered scale on hover
    "[&_.space-y-3]:!space-y-5",
    "[&_.space-y-3>div]:!rounded-3xl [&_.space-y-3>div]:!border-0 [&_.space-y-3>div]:!bg-background/95 [&_.space-y-3>div]:!shadow-2xl",
    "[&_.space-y-3>div]:!backdrop-blur-md [&_.space-y-3>div]:!transition-transform [&_.space-y-3>div]:!duration-500 [&_.space-y-3>div]:hover:!scale-[1.02]",
    "[&_button]:!py-6",
  ].join(" "),
  conversion: [
    "bg-background border-y-4 border-primary",
    "[&_section]:!bg-background [&_section]:!py-10",
    "[&_h2]:!uppercase [&_h2]:!tracking-tight [&_h2]:!text-3xl [&_h2]:!font-black",
    // square high-contrast rows with a thick action bar on the left
    "[&_.space-y-3]:!space-y-0 [&_.space-y-3]:!divide-y [&_.space-y-3]:!divide-primary/30 [&_.space-y-3]:!border-2 [&_.space-y-3]:!border-primary",
    "[&_.space-y-3>div]:!rounded-none [&_.space-y-3>div]:!border-0 [&_.space-y-3>div]:!border-l-8 [&_.space-y-3>div]:!border-l-primary [&_.space-y-3>div]:!shadow-none",
    "[&_.space-y-3>div]:!transition-transform [&_.space-y-3>div]:hover:!translate-x-1",
    "[&_button]:!uppercase [&_button]:!tracking-wide [&_h3]:!uppercase [&_h3]:!font-extrabold [&_h3]:!text-base",
  ].join(" "),
  editorial: [
    "bg-background border-t",
    "[&_section]:!bg-background [&_section]:!py-16",
    "[&_h2]:!font-serif [&_h2]:!text-4xl [&_h2]:!font-normal",
    "[&_h3]:!font-serif [&_h3]:!font-medium",
    // hairline rules instead of cards, generous rhythm
    "[&_.max-w-4xl]:!max-w-3xl",
    "[&_.space-y-3]:!space-y-0 [&_.space-y-3]:!divide-y [&_.space-y-3]:!divide-border",
    "[&_.space-y-3>div]:!rounded-none [&_.space-y-3>div]:!border-0 [&_.space-y-3>div]:!bg-transparent [&_.space-y-3>div]:!shadow-none",
    "[&_button]:!px-0 [&_button]:!py-6 [&_button]:hover:!bg-transparent",
  ].join(" "),
  compact: [
    "bg-background",
    "[&_section]:!py-6",
    "[&_h2]:!text-lg [&_h2]:!font-semibold [&_.mb-8]:!mb-4",
    // dense pill list, three across on wide screens
    "[&_.space-y-3]:!grid [&_.space-y-3]:!gap-2 [&_.space-y-3]:lg:!grid-cols-3 [&_.space-y-3]:!space-y-0",
    "[&_.space-y-3>div]:!self-start [&_.space-y-3>div]:!rounded-2xl [&_.space-y-3>div]:!bg-primary/5 [&_.space-y-3>div]:!shadow-none",
    "[&_button]:!px-4 [&_button]:!py-2.5 [&_h3]:!text-sm [&_img]:!h-8 [&_img]:!w-8",
  ].join(" "),
};

const BODY_VARIANT_STYLES: Record<
  string,
  { partners: string; coupons: string; contact: string }
> = {
  standard: {
    partners: PARTNER_STYLES.standard,
    coupons: "bg-background border-t-4 border-primary",
    contact: "bg-primary/5 border-t",
  },
  spotlight: {
    partners: PARTNER_STYLES.spotlight,
    coupons:
      "bg-primary/5 py-2 [&_.container]:max-w-4xl [&_[class*=rounded]]:!rounded-3xl [&_[class*=shadow]]:!shadow-xl",
    contact: "bg-gradient-to-br from-primary/10 via-background to-primary/5",
  },
  conversion: {
    partners: PARTNER_STYLES.conversion,
    coupons:
      "bg-primary/10 border-y-2 border-dashed border-primary [&_h2]:!uppercase [&_[class*=rounded]]:!rounded-none",
    contact: "bg-primary/5 border-t-4 border-primary [&_h2]:!uppercase",
  },
  editorial: {
    partners: PARTNER_STYLES.editorial,
    coupons: "bg-muted/40 border-y [&_h2]:!font-serif [&_[class*=rounded]]:!rounded-none",
    contact: "bg-background border-t-2 border-primary/30 [&_h2]:!font-serif",
  },
  compact: {
    partners: PARTNER_STYLES.compact,
    coupons: "bg-primary/5 [&_section]:!py-5 [&_h2]:!text-lg [&_[class*=rounded]]:!rounded-2xl",
    contact: "bg-background [&_section]:!py-6 [&_h2]:!text-lg",
  },
};

const CompanyHomeBody = ({
  company,
  theme,
  showContact = true,
  variant = "standard",
  areasTitlePrefix,
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
