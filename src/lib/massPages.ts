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
  "Industrial",
  "Educational Facilities",
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
    serviceSlugPart(service),
    opts.visitType ? compact(opts.visitType) : "",
    opts.locationType ? compact(opts.locationType) : "",
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

/** Resolve a URL slug back to a service + location for this company. */
export const resolveMassPage = (
  slug: string,
  company: Record<string, unknown>,
  groups: MassCountyGroup[],
): MassPageRef | null => {
  const target = slug.replace(/^\//, "").toLowerCase();
  if (!target || target.includes("/")) return null;

  for (const service of enabledServices(company)) {
    for (const group of groups) {
      for (const location of group.locations) {
        if (massPageSlug(service, location).toLowerCase() === target) {
          return { slug: massPageSlug(service, location), service, location };
        }
      }
    }
  }
  return null;
};
