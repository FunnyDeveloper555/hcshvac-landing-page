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
  action: MassService["action"],
  brandFields: string[],
  requiresProfileData = false,
): MassService => ({
  label: `${group} ${action}`,
  group,
  action,
  brandFields,
  requiresProfileData,
});

export const MASS_SERVICES: MassService[] = [
  svc("Air Conditioning", "Service", ["hvac_brands_service", "brands_serviced"]),
  svc("Air Conditioning", "Repair", ["hvac_brands_repair", "brands_serviced"]),
  svc("Air Conditioning", "Installation", ["hvac_brands_install", "brands_installed"]),
  svc("Furnace", "Service", ["hvac_brands_service", "brands_serviced"]),
  svc("Furnace", "Repair", ["hvac_brands_repair", "brands_serviced"]),
  svc("Furnace", "Installation", ["hvac_brands_install", "brands_installed"]),
  svc("Water Heater", "Service", ["water_heaters_service"]),
  svc("Water Heater", "Repair", ["water_heaters_repair"]),
  svc("Water Heater", "Installation", ["water_heaters_install"]),
  svc("Boiler", "Service", ["boilers_service"]),
  svc("Boiler", "Repair", ["boilers_repair"]),
  svc("Boiler", "Installation", ["boilers_install"]),
  svc("Mini Split", "Service", ["hvac_brands_service", "brands_serviced"]),
  svc("Mini Split", "Repair", ["hvac_brands_repair", "brands_serviced"]),
  svc("Mini Split", "Installation", ["hvac_brands_install", "brands_installed"]),
  svc("Coils", "Service", ["coils_service"], true),
  svc("Coils", "Repair", ["coils_repair"], true),
  svc("Coils", "Installation", ["coils_install"], true),
  svc("Gas Pipe", "Service", ["gas_pipe_service"], true),
  svc("Gas Pipe", "Repair", ["gas_pipe_repair"], true),
  svc("Gas Pipe", "Installation", ["gas_pipe_install"], true),
  svc("Plumbing", "Service", ["plumbing_equipment_service"], true),
  svc("Plumbing", "Repair", ["plumbing_equipment_repair"], true),
  svc("Plumbing", "Installation", ["plumbing_equipment_install"], true),
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

/** Step 2 of the mass page form: the kind of visit. */
export const VISIT_TYPES = [
  "Emergency",
  "Installation",
  "Estimate",
  "Repair",
  "Service",
] as const;
export type VisitType = (typeof VISIT_TYPES)[number];

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
}

export interface MassPageRef {
  slug: string;
  service: MassService;
  location: MassLocation;
  visitType?: VisitType | null;
  locationType?: LocationType | null;
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
    ...locationSlugParts(loc),
  ]
    .filter(Boolean)
    .join("-");

export const massPagePath = (
  service: MassService,
  loc: MassLocation,
  opts: MassPageOptions = {},
): string => `/${massPageSlug(service, loc, opts)}`;

/** "Furnace Repair, Emergency, Residential, Joliet, IL 60431" */
export const massPageSummary = (
  serviceLabel: string,
  loc: MassLocation,
  opts: MassPageOptions = {},
): string =>
  [
    serviceLabel,
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
  const { visitType, locationType } = options;
  const place = locationLabel(location);
  const audience = locationType ? `${locationType.toLowerCase()} properties` : "homes and businesses";
  const brands = serviceBrands(service, company);
  const brandLine = brands.length ? brands.slice(0, 6).join(", ") : "all major brands";
  const phone = (company.company_phone as string | null) || null;

  return [
    {
      heading: `Why ${location.city} chooses ${company.name}`,
      body: `${company.name} has built its reputation on honest ${service.label.toLowerCase()} for ${audience} across ${place}. Every visit starts with a full diagnostic, a clear explanation of what we found, and pricing you approve before any work begins — no surprises after the job is done.`,
    },
    {
      heading: `What our ${service.label.toLowerCase()} includes`,
      body: `Our ${location.county} technicians arrive stocked for ${service.action.toLowerCase()} work on ${brandLine}. We check airflow, electrical connections, refrigerant or gas pressures, safety controls and thermostat operation, then document the results so you know exactly what condition your system is in.`,
    },
    {
      heading: `Fast scheduling across ${location.county}`,
      body: `${visitType === "Emergency" ? "Emergency calls are dispatched around the clock" : "Same-day and next-day appointments are usually available"} for ${location.city} and neighboring communities in ${location.county}, ${location.state}. Call ${phone || "our office"} or request service online and we will confirm an arrival window that fits your schedule.`,
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
 * Slug shape: Service[-VisitType][-LocationType]-County-CityStateZip
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

  let visitType: VisitType | null = null;
  let locationType: LocationType | null = null;
  let servicePart = "";
  for (const seg of middles) {
    const l = LOCATION_TYPES.find((t) => compact(t).toLowerCase() === seg.toLowerCase());
    if (l && !locationType && !servicePart) {
      locationType = l;
      continue;
    }
    const v = VISIT_TYPES.find((t) => compact(t).toLowerCase() === seg.toLowerCase());
    if (v && !visitType && !servicePart) {
      visitType = v;
      continue;
    }
    if (servicePart) return null; // more than one service segment
    servicePart = seg;
  }
  if (!servicePart) return null;

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
      (s) => serviceSlugPart(s).toLowerCase() === servicePart.toLowerCase(),
    ) || customService(uncompact(servicePart));

  return {
    slug: massPageSlug(service, location, { visitType, locationType }),
    service,
    location,
    visitType,
    locationType,
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
    sections: { ...defaults.sections, ...(s.sections || {}) },
  };
};
