/**
 * Mass page generation for company sites.
 *
 * Every company site exposes a "Mass Pages" menu built dynamically from the
 * company profile: the service categories the company offers (crossed with)
 * the counties / cities in its service areas.
 *
 * URL shape (single segment, no nesting):
 *   /FurnaceRepair-CookCounty-ChicagoIL60617
 */

export type MassServiceGroup =
  | "Air Conditioning"
  | "Furnace"
  | "Water Heater"
  | "Boiler"
  | "Mini Split"
  | "Coils"
  | "Gas Pipe"
  | "Plumbing";

export interface MassService {
  /** Display label, e.g. "Furnace Repair" */
  label: string;
  group: MassServiceGroup;
  action: "Service" | "Repair" | "Installation";
  /** Company profile columns holding the related brand / equipment list. */
  brandFields: string[];
  /** When true the category only shows if one of its brandFields has entries. */
  requiresProfileData?: boolean;
}

const svc = (
  group: MassServiceGroup,
  brandFields: string[],
  requiresProfileData = false,
): MassService => ({
  label: group,
  group,
  action: "Service",
  brandFields,
  requiresProfileData,
});

/**
 * One entry per equipment category. Service / Repair / Installation are no
 * longer separate options — the visit type covers that distinction.
 */
export const MASS_SERVICES: MassService[] = [
  svc("Air Conditioning", [
    "hvac_brands_service",
    "hvac_brands_repair",
    "hvac_brands_install",
    "brands_serviced",
    "brands_installed",
  ]),
  svc("Furnace", [
    "hvac_brands_service",
    "hvac_brands_repair",
    "hvac_brands_install",
    "brands_serviced",
    "brands_installed",
  ]),
  svc("Water Heater", ["water_heaters_service", "water_heaters_repair", "water_heaters_install"]),
  svc("Boiler", ["boilers_service", "boilers_repair", "boilers_install"]),
  svc("Mini Split", [
    "hvac_brands_service",
    "hvac_brands_repair",
    "hvac_brands_install",
    "brands_serviced",
    "brands_installed",
  ]),
  svc("Coils", ["coils_service", "coils_repair", "coils_install"], true),
  svc("Gas Pipe", ["gas_pipe_service", "gas_pipe_repair", "gas_pipe_install"], true),
  svc("Plumbing", [
    "plumbing_equipment_service",
    "plumbing_equipment_repair",
    "plumbing_equipment_install",
  ], true),
];


export interface MassLocation {
  city: string;
  county: string;
  state: string;
  zip: string;
}

export interface MassCountyGroup {
  county: string;
  state: string;
  locations: MassLocation[];
}

/** Step 2 of the mass page form: the urgency / timing of the visit. */
export const VISIT_TYPES = [
  "Emergency",
  "24 Hours",
  "Urgent",
  "Over Nights",
  "After Hours",
] as const;
export type VisitType = (typeof VISIT_TYPES)[number];

/** Step 5 of the mass page form: the kind of work being performed. */
export const SERVICE_TYPES = [
  "Installation",
  "Service",
  "Repair",
  "Estimate",
] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

/** Step 3 of the mass page form: the kind of property. */
export const LOCATION_TYPES = [
  "Residential",
  "Commercial",
  "Light Industrial",
  "Industrial",
  "Educational Facilities",
  "Churches",
  "Medical Offices",
] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

export interface MassPageOptions {
  visitType?: VisitType | null;
  locationType?: LocationType | null;
  serviceType?: ServiceType | null;
}

export interface MassPageRef {
  slug: string;
  service: MassService;
  location: MassLocation;
  visitType?: VisitType | null;
  locationType?: LocationType | null;
  serviceType?: ServiceType | null;
}

/** "Carol Stream" -> "CarolStream" */
export const compact = (value: string): string => value.replace(/[^A-Za-z0-9]/g, "");

/** "FurnaceRepair" -> "Furnace Repair" */
export const uncompact = (value: string): string =>
  value.replace(/([a-z0-9])([A-Z])/g, "$1 $2").trim();

export const serviceSlugPart = (service: MassService): string => compact(service.label);

export const locationSlugParts = (loc: MassLocation): string[] => [
  compact(loc.county),
  `${compact(loc.city)}${compact(loc.state)}${compact(loc.zip)}`,
];

export const massPageSlug = (
  service: MassService,
  loc: MassLocation,
  opts: MassPageOptions = {},
): string =>
  [
    opts.locationType ? compact(opts.locationType) : "",
    opts.visitType ? compact(opts.visitType) : "",
    serviceSlugPart(service),
    opts.serviceType ? compact(opts.serviceType) : "",
    ...locationSlugParts(loc),
  ]
    .filter(Boolean)
    .join("-");

export const massPagePath = (
  service: MassService,
  loc: MassLocation,
  opts: MassPageOptions = {},
): string => `/${massPageSlug(service, loc, opts)}`;

/* ------------------------------------------------------------------ *
 * Master template ("campaign") paths — no county / city component.
 * Content saved here applies to every page matching the criteria.
 * ------------------------------------------------------------------ */

export const MASS_TEMPLATE_PREFIX = "/__template/";

export const massTemplatePath = (
  service: MassService,
  opts: MassPageOptions = {},
): string =>
  MASS_TEMPLATE_PREFIX +
  [
    opts.locationType ? compact(opts.locationType) : "",
    opts.visitType ? compact(opts.visitType) : "",
    serviceSlugPart(service),
    opts.serviceType ? compact(opts.serviceType) : "",
  ]
    .filter(Boolean)
    .join("-");

export const isMassTemplatePath = (path: string): boolean =>
  path.startsWith(MASS_TEMPLATE_PREFIX);

/**
 * Derive the master template path a specific mass page belongs to.
 * Page slug: LocationType-VisitType-Service-ServiceType-County-CityStateZip
 * Template slug: LocationType-VisitType-Service-ServiceType
 */
export const massTemplatePathForPage = (pagePath: string): string | null => {
  if (isMassTemplatePath(pagePath)) return pagePath;
  const parts = pagePath.replace(/^\//, "").split("-").filter(Boolean);
  if (parts.length < 3) return null;
  return MASS_TEMPLATE_PREFIX + parts.slice(0, parts.length - 2).join("-");
};


const classifyMiddles = (parts: string[]): {
  loc?: LocationType;
  visit?: VisitType;
  serviceType?: ServiceType;
  serviceCategory?: string;
} => {
  const loc = LOCATION_TYPES.find((l) => parts.some((p) => compact(l).toLowerCase() === p.toLowerCase()));
  const visit = VISIT_TYPES.find((v) => parts.some((p) => compact(v).toLowerCase() === p.toLowerCase()));
  const serviceType = SERVICE_TYPES.find((s) => parts.some((p) => compact(s).toLowerCase() === p.toLowerCase()));
  const rest = parts.filter(
    (p) =>
      (!loc || compact(loc).toLowerCase() !== p.toLowerCase()) &&
      (!visit || compact(visit).toLowerCase() !== p.toLowerCase()) &&
      (!serviceType || compact(serviceType).toLowerCase() !== p.toLowerCase()),
  );
  return { loc, visit, serviceType, serviceCategory: rest.join("-") || undefined };
};

/**
 * Order-insensitive grouping key so pages saved with the legacy
 * Service-VisitType-LocationType order still match their master campaign.
 */
export const massTemplateKey = (path: string): string | null => {
  const raw = isMassTemplatePath(path)
    ? path.replace(MASS_TEMPLATE_PREFIX, "")
    : path.replace(/^\//, "");
  let parts = raw.split("-").filter(Boolean);
  if (!isMassTemplatePath(path)) {
    if (parts.length < 3) return null;
    parts = parts.slice(0, parts.length - 2);
  }
  if (!parts.length) return null;
  return parts.map((p) => p.toLowerCase()).sort().join("|");
};

/**
 * Master template path for a page, with segments normalised to the
 * canonical LocationType-VisitType-Service-ServiceType order (legacy pages
 * were saved Service-VisitType-LocationType first).
 */
export const massTemplatePathOrdered = (path: string): string | null => {
  const derived = massTemplatePathForPage(path);
  if (!derived) return null;
  const parts = derived.replace(MASS_TEMPLATE_PREFIX, "").split("-").filter(Boolean);
  const { loc, visit, serviceType, serviceCategory } = classifyMiddles(parts);
  return MASS_TEMPLATE_PREFIX + [loc, visit, serviceCategory, serviceType].filter(Boolean).join("-");
};

/**
 * Normalise any mass page path to the canonical
 * LocationType-VisitType-Service-ServiceType-County-CityStateZip order.
 * Legacy paths were saved Service-VisitType-LocationType first.
 */
export const massCanonicalPagePath = (path: string): string => {
  if (isMassTemplatePath(path)) return massTemplatePathOrdered(path) || path;
  const parts = path.replace(/^\//, "").replace(/\/$/, "").split("-").filter(Boolean);
  if (parts.length < 3) return path;
  const tail = parts.slice(parts.length - 2);
  const middles = parts.slice(0, parts.length - 2);
  const { loc, visit, serviceType, serviceCategory } = classifyMiddles(middles);
  return `/${[loc, visit, serviceCategory, serviceType, ...tail].filter(Boolean).join("-")}`;
};








/** Human label for a master template path, e.g. "Residential · Emergency · Furnace Repair" */
export const massTemplateLabel = (path: string): string =>
  path
    .replace(MASS_TEMPLATE_PREFIX, "")
    .split("-")
    .map((p) => uncompact(p))
    .join(" · ");

/** "Furnace Repair, Service, Emergency, Residential, Joliet, IL 60431" */
export const massPageSummary = (
  serviceLabel: string,
  loc: MassLocation,
  opts: MassPageOptions = {},
): string =>
  [
    serviceLabel,
    opts.serviceType || "",
    opts.visitType || "",
    opts.locationType || "",
    `${loc.city}, ${loc.state}${loc.zip ? ` ${loc.zip}` : ""}`,
  ]
    .filter(Boolean)
    .join(", ");

export const locationLabel = (loc: MassLocation): string =>
  `${loc.city}, ${loc.state}${loc.zip ? ` ${loc.zip}` : ""}`;

/** Returns true when the company profile enables this service category. */
export const isServiceEnabled = (
  service: MassService,
  company: Record<string, unknown>,
): boolean => {
  if (!service.requiresProfileData) return true;
  return service.brandFields.some((field) => {
    const value = company[field];
    return Array.isArray(value) && value.length > 0;
  });
};

export const enabledServices = (company: Record<string, unknown>): MassService[] =>
  MASS_SERVICES.filter((s) => isServiceEnabled(s, company));

export const serviceBrands = (
  service: MassService,
  company: Record<string, unknown>,
): string[] => {
  for (const field of service.brandFields) {
    const value = company[field];
    if (Array.isArray(value) && value.length > 0) return value as string[];
  }
  return [];
};

export interface MassTextBlock {
  heading: string;
  body: string;
}

/** Default editorial copy for a mass page. Used as the seed for admin editing. */
export const defaultMassTextBlocks = (
  company: Record<string, unknown> & { name: string; company_phone?: string | null },
  service: MassService,
  location: MassLocation,
  options: MassPageOptions = {},
): MassTextBlock[] => {
  const { visitType, locationType, serviceType } = options;
  const place = locationLabel(location);
  const audience = locationType ? `${locationType.toLowerCase()} properties` : "homes and businesses";
  const brands = serviceBrands(service, company);
  const brandLine = brands.length ? brands.slice(0, 6).join(", ") : "all major brands";
  const phone = (company.company_phone as string | null) || null;
  const work = serviceType
    ? `${serviceType.toLowerCase()} ${service.action.toLowerCase()}`
    : service.action.toLowerCase();

  return [
    {
      heading: `Why ${location.city} chooses ${company.name}`,
      body: `${company.name} has built its reputation on honest ${work} for ${audience} across ${place}. Every visit starts with a full diagnostic, a clear explanation of what we found, and pricing you approve before any work begins — no surprises after the job is done.`,
    },
    {
      heading: `What our ${service.label.toLowerCase()} includes`,
      body: `Our ${location.county} technicians arrive stocked for ${work} on ${brandLine}. We check airflow, electrical connections, refrigerant or gas pressures, safety controls and thermostat operation, then document the results so you know exactly what condition your system is in.`,
    },
    {
      heading: `Fast scheduling across ${location.county}`,
      body: `${visitType === "Emergency" || visitType === "24 Hours" || visitType === "Urgent" ? "Calls are dispatched around the clock" : "Same-day and next-day appointments are usually available"} for ${location.city} and neighboring communities in ${location.county}, ${location.state}. Call ${phone || "our office"} or request service online and we will confirm an arrival window that fits your schedule.`,
    },
  ];
};



/** Metadata pulled from the `cities` table, keyed by "city|state". */
export interface CityMeta {
  county: string | null;
  zip: string | null;
}

const cleanCity = (raw: string) => raw.replace(/\s*\(township\)\s*/i, "").trim();

export const cityKey = (city: string, state: string) =>
  `${cleanCity(city).toLowerCase()}|${state.toLowerCase()}`;

/**
 * Turns the company's `service_areas` strings into county-grouped locations.
 * Accepts both "Addison, IL" and "Addison, DuPage County, IL".
 */
export const buildCountyGroups = (
  serviceAreas: string[] | null | undefined,
  cityMeta: Record<string, CityMeta>,
): MassCountyGroup[] => {
  const groups = new Map<string, MassCountyGroup>();
  const seen = new Set<string>();

  (serviceAreas || []).forEach((raw) => {
    const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length < 2) return;
    const state = parts[parts.length - 1];
    const city = cleanCity(parts[0]);
    if (!city || !state) return;

    const meta = cityMeta[cityKey(city, state)];
    const countyFromArea = parts.length >= 3 ? parts[1] : null;
    const county =
      (countyFromArea || meta?.county || "").split("/")[0].trim() || "Other Areas";
    const zip = (meta?.zip || "").split("/")[0].trim();

    const dedupe = `${county}|${city}|${state}`.toLowerCase();
    if (seen.has(dedupe)) return;
    seen.add(dedupe);

    const groupKey = `${county}|${state}`;
    if (!groups.has(groupKey)) groups.set(groupKey, { county, state, locations: [] });
    groups.get(groupKey)!.locations.push({ city, county, state, zip });
  });

  const result = Array.from(groups.values());
  result.forEach((g) => g.locations.sort((a, b) => a.city.localeCompare(b.city)));
  return result.sort((a, b) => a.county.localeCompare(b.county));
};

/**
 * Resolve a URL slug back to a service + optional visit/location type + location.
 * Slug shape: LocationType-VisitType-Service-ServiceType-County-CityStateZip
 * Legacy shape: Service[-VisitType][-LocationType]-County-CityStateZip
 */
export const resolveMassPage = (
  slug: string,
  company: Record<string, unknown>,
  groups: MassCountyGroup[],
): MassPageRef | null => {
  const raw = slug.replace(/^\//, "").replace(/\/$/, "");
  if (!raw || raw.includes("/")) return null;

  const parts = raw.split("-").filter(Boolean);
  if (parts.length < 3) return null;

  const cityPart = parts[parts.length - 1].toLowerCase();
  const countyPart = parts[parts.length - 2].toLowerCase();
  const middles = parts.slice(0, parts.length - 2);

  const { loc, visit, serviceType, serviceCategory } = classifyMiddles(middles);
  if (!serviceCategory) return null;

  let location: MassLocation | null = null;
  for (const group of groups) {
    if (compact(group.county).toLowerCase() !== countyPart) continue;
    const match = group.locations.find(
      (loc) =>
        `${compact(loc.city)}${compact(loc.state)}${compact(loc.zip)}`.toLowerCase() === cityPart,
    );
    if (match) {
      location = match;
      break;
    }
  }
  if (!location) return null;

  const service =
    enabledServices(company).find(
      (s) => serviceSlugPart(s).toLowerCase() === serviceCategory.toLowerCase(),
    ) || customService(uncompact(serviceCategory));

  return {
    slug: massPageSlug(service, location, {
      visitType: visit || null,
      locationType: loc || null,
      serviceType: serviceType || null,
    }),
    service,
    location,
    visitType: visit || null,
    locationType: loc || null,
    serviceType: serviceType || null,
  };
};

/** Build a service-like object for a label that is not in MASS_SERVICES (e.g. a product). */
export const customService = (label: string): MassService => {
  const action: MassService["action"] = /install/i.test(label)
    ? "Installation"
    : /repair/i.test(label)
      ? "Repair"
      : "Service";
  return { label, group: "Air Conditioning", action, brandFields: [] };
};

/* ------------------------------------------------------------------ *
 * Full mass page content overrides (edited in Page Builder → Mass Pages)
 * ------------------------------------------------------------------ */

export interface MassImageBox {
  url?: string;
  alt: string;
  caption: string;
}

export interface MassPageSections {
  hero?: boolean;
  intro?: boolean;
  bullets?: boolean;
  brands?: boolean;
  blocks?: boolean;
  images?: boolean;
  nearby?: boolean;
  cta?: boolean;
  homeBody?: boolean;
}

export interface MassPageOverrides {
  metaTitle?: string;
  metaDescription?: string;
  heroKicker?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heading?: string;
  intro?: string;
  bullets?: string[];
  brandsHeading?: string;
  brandsNote?: string;
  images?: MassImageBox[];
  nearbyHeading?: string;
  ctaHeading?: string;
  ctaBody?: string;
  ctaButton?: string;
  sections?: MassPageSections;
  /** Pre-designed campaign template (layout) id. */
  template?: string;

}

export const ALL_MASS_SECTIONS: Array<{ key: keyof MassPageSections; label: string }> = [
  { key: "hero", label: "Hero carousel" },
  { key: "intro", label: "Heading & intro text" },
  { key: "bullets", label: "Highlight bullets" },
  { key: "brands", label: "Brands marquee" },
  { key: "blocks", label: "Editorial text blocks" },
  { key: "images", label: "Image boxes" },
  { key: "nearby", label: "Nearby cities links" },
  { key: "cta", label: "Booking call to action" },
  { key: "homeBody", label: "Home page body content" },
];

/* ------------------------------------------------------------------ *
 * Pre-designed campaign templates (layouts for mass pages)
 * ------------------------------------------------------------------ */

export type MassSectionKey = keyof MassPageSections;

/** Visual identity of a campaign template (colors + section styling). */
export interface MassTemplateTheme {
  /** HSL triplets (no hsl() wrapper) injected as scoped CSS variables. */
  primary: string;
  primaryForeground: string;
  accent: string;
  surface: string;
  radius: string;
  heroVariant: "carousel" | "split" | "banner" | "editorial" | "compact";
  headerVariant: "solid" | "glass" | "alert" | "minimal" | "centered";
  footerVariant: "dark" | "gradient" | "compact" | "columns" | "minimal";
  /** Styling family for Contact Us / Special Offers / Request Service / Our Partners. */
  bodyVariant: "standard" | "spotlight" | "conversion" | "editorial" | "compact";
  cardClass: string;
  headingClass: string;
  sectionGap: string;
  label: string;
}

export interface MassCampaignTemplate {
  id: string;
  name: string;
  description: string;
  /** Section render order, top to bottom. */
  order: MassSectionKey[];
  /** Sections hidden by this template unless re-enabled per campaign. */
  sections: MassPageSections;
  theme: MassTemplateTheme;
}


export const MASS_CAMPAIGN_TEMPLATES: MassCampaignTemplate[] = [
  {
    id: "standard",
    name: "Standard Service Page",
    description:
      "Ocean-blue palette, photo carousel hero, solid header bar and dark footer. Balanced layout that works for every service.",
    order: ["hero", "intro", "bullets", "brands", "blocks", "images", "nearby", "cta", "homeBody"],
    sections: {},
    theme: {
      label: "Ocean Blue",
      primary: "199 89% 42%",
      primaryForeground: "0 0% 100%",
      accent: "199 89% 95%",
      surface: "205 40% 98%",
      radius: "0.5rem",
      heroVariant: "carousel",
      headerVariant: "solid",
      bodyVariant: "standard",
      footerVariant: "dark",
      cardClass: "rounded-lg border bg-background shadow-sm",
      headingClass: "text-2xl font-bold tracking-tight",
      sectionGap: "space-y-10",
    },
  },
  {
    id: "spotlight",
    name: "Image Spotlight",
    description:
      "Deep violet palette, split image hero, glass header and gradient footer. Photo-forward layout for visual services.",
    order: ["hero", "images", "intro", "bullets", "blocks", "brands", "nearby", "cta", "homeBody"],
    sections: {},
    theme: {
      label: "Violet Studio",
      primary: "263 70% 52%",
      primaryForeground: "0 0% 100%",
      accent: "263 70% 96%",
      surface: "263 30% 98%",
      radius: "1.25rem",
      heroVariant: "split",
      headerVariant: "glass",
      bodyVariant: "spotlight",
      footerVariant: "gradient",
      cardClass: "rounded-3xl border-0 bg-background shadow-xl ring-1 ring-primary/10",
      headingClass: "text-3xl font-semibold tracking-tight",
      sectionGap: "space-y-14",
    },
  },
  {
    id: "conversion",
    name: "Conversion Focused",
    description:
      "Urgent orange palette, bold banner hero, red alert header strip and compact footer. Best for emergency campaigns.",
    order: ["hero", "intro", "cta", "bullets", "brands", "blocks", "images", "nearby", "homeBody"],
    sections: { homeBody: false },
    theme: {
      label: "Emergency Orange",
      primary: "14 88% 48%",
      primaryForeground: "0 0% 100%",
      accent: "14 88% 95%",
      surface: "24 60% 98%",
      radius: "0.25rem",
      heroVariant: "banner",
      headerVariant: "alert",
      bodyVariant: "conversion",
      footerVariant: "compact",
      cardClass: "rounded-sm border-2 border-primary/25 bg-background",
      headingClass: "text-2xl font-extrabold uppercase tracking-tight",
      sectionGap: "space-y-8",
    },
  },
  {
    id: "local-seo",
    name: "Local SEO Long-Form",
    description:
      "Forest-green editorial palette, text-first hero, minimal serif header and multi-column footer. Built for search ranking.",
    order: ["hero", "intro", "blocks", "bullets", "nearby", "brands", "images", "cta", "homeBody"],
    sections: {},
    theme: {
      label: "Forest Editorial",
      primary: "158 64% 28%",
      primaryForeground: "0 0% 100%",
      accent: "158 40% 94%",
      surface: "60 20% 98%",
      radius: "0.125rem",
      heroVariant: "editorial",
      headerVariant: "minimal",
      bodyVariant: "editorial",
      footerVariant: "columns",
      cardClass: "rounded-none border-l-4 border-primary/40 bg-background pl-5",
      headingClass: "text-3xl font-serif font-semibold",
      sectionGap: "space-y-12",
    },
  },
  {
    id: "compact",
    name: "Compact Landing",
    description:
      "Indigo mobile-first palette, condensed centered hero, centered header and minimal footer. Fast to load and easy to scan.",
    order: ["hero", "intro", "bullets", "cta", "nearby"],
    sections: { brands: false, blocks: false, images: false, homeBody: false },
    theme: {
      label: "Indigo Compact",
      primary: "231 60% 48%",
      primaryForeground: "0 0% 100%",
      accent: "231 60% 96%",
      surface: "231 30% 98%",
      radius: "9999px",
      heroVariant: "compact",
      headerVariant: "centered",
      bodyVariant: "compact",
      footerVariant: "minimal",
      cardClass: "rounded-2xl border bg-background/70 backdrop-blur",
      headingClass: "text-xl font-semibold",
      sectionGap: "space-y-6",
    },
  },
];


export const DEFAULT_MASS_CAMPAIGN_TEMPLATE = "standard";

export const massCampaignTemplate = (id?: string | null): MassCampaignTemplate =>
  MASS_CAMPAIGN_TEMPLATES.find((t) => t.id === id) || MASS_CAMPAIGN_TEMPLATES[0];



/** Suggested values for every editable field on a mass page. */
export const defaultMassOverrides = (
  company: Record<string, unknown> & { name: string; company_phone?: string | null },
  service: MassService,
  location: MassLocation,
  options: MassPageOptions = {},
): Required<Omit<MassPageOverrides, "sections">> & { sections: MassPageSections } => {
  const { visitType, locationType } = options;
  const place = locationLabel(location);
  const serviceTitle = visitType ? `${visitType} ${service.label}` : service.label;
  const heading = `${serviceTitle} in ${place}`;
  const audience = locationType ? `${locationType.toLowerCase()} properties` : "homes and businesses";

  return {
    metaTitle: `${heading} | ${company.name}`.slice(0, 60),
    metaDescription: `${company.name} provides expert ${serviceTitle.toLowerCase()} for ${audience} in ${place} and throughout ${location.county}.`.slice(0, 158),
    heroKicker: `${location.county}, ${location.state}`,
    heroTitle: heading,
    heroSubtitle: massPageSummary(service.label, location, options),
    heading,
    intro: `${company.name} delivers professional ${service.label.toLowerCase()} for homes and businesses in ${place}. Our technicians know the equipment, the codes and the weather in ${location.county} — so you get a lasting fix the first time.`,
    bullets: [
      visitType === "Emergency"
        ? `24/7 emergency ${service.label.toLowerCase()} in ${location.city}`
        : `Same-day ${service.label.toLowerCase()} appointments in ${location.city}`,
      locationType
        ? `${locationType} specialists for ${location.city} properties`
        : "Licensed, bonded and insured technicians",
      "Upfront pricing with no hidden fees",
      `Serving all of ${location.county}, ${location.state}`,
    ],
    brandsHeading: `Brands we ${
      service.action === "Installation" ? "install" : service.action.toLowerCase()
    } in ${location.city}`,
    brandsNote: `manufacturers supported by our ${location.county} technicians`,
    images: [
      {
        alt: `${company.name} technician performing ${service.label.toLowerCase()} in ${place}`,
        caption: `${serviceTitle} in ${location.city}, ${location.state}`,
      },
      {
        alt: `${service.group} equipment ready for ${service.action.toLowerCase()} in ${location.county}`,
        caption: `${service.group} ${service.action.toLowerCase()} for ${audience}`,
      },
      {
        alt: `${company.name} serving ${location.county}, ${location.state}`,
        caption: `Licensed and insured across ${location.county}`,
      },
    ],
    nearbyHeading: `${service.label} nearby in ${location.county}`,
    ctaHeading: `Book ${service.label} in ${location.city}`,
    ctaBody: `Tell us what's going on and we'll get a technician scheduled in ${place}.`,
    ctaButton: "Request Service",
    template: DEFAULT_MASS_CAMPAIGN_TEMPLATE,
    sections: {

      hero: true,
      intro: true,
      bullets: true,
      brands: true,
      blocks: true,
      images: true,
      nearby: true,
      cta: true,
      homeBody: true,
    },
  };
};

/** Merge saved overrides over the suggested defaults. */
export const mergeMassOverrides = (
  defaults: ReturnType<typeof defaultMassOverrides>,
  saved: MassPageOverrides | null | undefined,
) => {
  const s = saved || {};
  const text = <K extends keyof MassPageOverrides>(k: K) =>
    (typeof s[k] === "string" && (s[k] as string).length > 0 ? (s[k] as string) : (defaults[k as never] as unknown as string));
  return {
    metaTitle: text("metaTitle"),
    metaDescription: text("metaDescription"),
    heroKicker: text("heroKicker"),
    heroTitle: text("heroTitle"),
    heroSubtitle: text("heroSubtitle"),
    heading: text("heading"),
    intro: text("intro"),
    bullets: Array.isArray(s.bullets) ? s.bullets.filter(Boolean) : defaults.bullets,
    brandsHeading: text("brandsHeading"),
    brandsNote: text("brandsNote"),
    images: Array.isArray(s.images) && s.images.length > 0 ? s.images : defaults.images,
    nearbyHeading: text("nearbyHeading"),
    ctaHeading: text("ctaHeading"),
    ctaBody: text("ctaBody"),
    ctaButton: text("ctaButton"),
    template: text("template") || DEFAULT_MASS_CAMPAIGN_TEMPLATE,
    sections: {
      ...defaults.sections,
      ...massCampaignTemplate(s.template).sections,
      ...(s.sections || {}),
    },
  };

};
