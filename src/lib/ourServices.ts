// "Our Services" matrix for a company:
//   equipment type  x  property type  x  job type
// Stored on companies.our_services as { [key]: true } where key = `${equipment}|${property}|${job}`

export const OUR_SERVICE_EQUIPMENT = [
  "Air Conditioning",
  "Furnace",
  "Boilers",
  "Steam Boilers",
  "Tankless Boilers",
  "Duct Work / Ducting",
  "Water Heaters",
  "Tankless Water Heaters",
  "Mini Split",
  "Thermostat Upgrade / Replacement",
  "Humidifiers",
  "Dehumidifiers",
  "Air Purification",
  "Annual HVAC Maintenance",
  "Coils",
  "Gas Pipe",
  "Plumbing",
] as const;

export const OUR_SERVICE_PROPERTY_TYPES = [
  "Residential",
  "Commercial",
  "Light Industrial",
  "Industrial",
  "Churches",
  "Medical Facilities",
  "Educational Facilities",
] as const;

export const OUR_SERVICE_JOB_TYPES = [
  "Repair",
  "Service",
  "Installation",
  "Estimate",
  "Buyer/Seller Reports",
] as const;

export type OurServicesMap = Record<string, boolean>;

export const ourServiceKey = (equipment: string, property: string, job: string) =>
  `${equipment}|${property}|${job}`;

export function parseOurServices(raw: unknown): OurServicesMap {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: OurServicesMap = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (v) out[k] = true;
  }
  return out;
}

export const isOurServiceChecked = (map: OurServicesMap, e: string, p: string, j: string) =>
  !!map[ourServiceKey(e, p, j)];

/** Every checked combination, flattened. */
export function listOurServices(map: OurServicesMap) {
  const rows: { equipment: string; property: string; job: string; label: string }[] = [];
  for (const equipment of OUR_SERVICE_EQUIPMENT) {
    for (const property of OUR_SERVICE_PROPERTY_TYPES) {
      for (const job of OUR_SERVICE_JOB_TYPES) {
        if (map[ourServiceKey(equipment, property, job)]) {
          rows.push({
            equipment,
            property,
            job,
            label: `${property} ${equipment} ${job}`,
          });
        }
      }
    }
  }
  return rows;
}

/** Equipment -> job labels, used for the public "Our Services" accordion. */
export function groupOurServicesByEquipment(map: OurServicesMap) {
  const groups: { equipment: string; items: string[] }[] = [];
  for (const equipment of OUR_SERVICE_EQUIPMENT) {
    const items: string[] = [];
    for (const property of OUR_SERVICE_PROPERTY_TYPES) {
      for (const job of OUR_SERVICE_JOB_TYPES) {
        if (map[ourServiceKey(equipment, property, job)]) {
          items.push(`${property} ${equipment} ${job}`);
        }
      }
    }
    if (items.length) groups.push({ equipment, items });
  }
  return groups;
}

/** Options for "Select Visit Reason" in scheduling forms and for Field Report Types. */
export function ourServiceVisitReasons(map: OurServicesMap): string[] {
  return listOurServices(map).map((r) => r.label);
}

export const countOurServices = (map: OurServicesMap) =>
  Object.values(map).filter(Boolean).length;

/** Maps the appointment_type enum to an "Our Services" property type. */
export const APPOINTMENT_TYPE_PROPERTY: Record<string, string | null> = {
  residential: "Residential",
  commercial: "Commercial",
  non_profit: "Commercial",
  church: "Churches",
  school: "Educational Facilities",
  government: "Commercial",
  other: null,
};

export interface VisitReasonOption {
  /** Stored value (full label, includes property type). */
  value: string;
  /** Shown to the user (property type omitted when already known). */
  label: string;
}

/**
 * Visit reason options, optionally limited to a single property type so the
 * list stays short (residential appointments only show residential services).
 */
export function ourServiceVisitOptions(
  map: OurServicesMap,
  property?: string | null,
): VisitReasonOption[] {
  const rows = listOurServices(map);
  const scoped = property ? rows.filter((r) => r.property === property) : rows;
  const use = scoped.length ? scoped : rows;
  const seen = new Set<string>();
  const out: VisitReasonOption[] = [];
  for (const r of use) {
    if (seen.has(r.label)) continue;
    seen.add(r.label);
    out.push({
      value: r.label,
      label: property && scoped.length ? `${r.equipment} - ${r.job}` : r.label,
    });
  }
  return out;
}
