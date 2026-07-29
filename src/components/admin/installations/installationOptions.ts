export type InstallCategory =
  | "residential_hvac"
  | "commercial_hvac"
  | "educational_hvac"
  | "industrial_hvac"
  | "electrical"
  | "plumbing";

export const CATEGORY_LABEL: Record<InstallCategory, string> = {
  residential_hvac: "HVAC Residential",
  commercial_hvac: "HVAC Commercial",
  educational_hvac: "HVAC Educational Facilities",
  industrial_hvac: "HVAC Industrial Facilities",
  electrical: "Electrical",
  plumbing: "Plumbing",
};

const HVAC_ITEMS = [
  "Coil",
  "Condenser",
  "Furnace",
  "Packaged Unit",
  "Humidifier",
  "De-Humidifier",
  "U.V Light",
  "Thermostat",
  "Zoning",
];

const COMMERCIAL_HVAC_ITEMS = [
  "Packed/RTU Unit",
  "Coil",
  "Condenser",
  "Furnace",
  "Humidifier",
  "De-Humidifier",
  "U.V Light",
  "Thermostat",
  "Zoning",
];

export const ITEM_TYPES: Record<InstallCategory, string[]> = {
  residential_hvac: HVAC_ITEMS,
  commercial_hvac: COMMERCIAL_HVAC_ITEMS,
  educational_hvac: COMMERCIAL_HVAC_ITEMS,
  industrial_hvac: COMMERCIAL_HVAC_ITEMS,
  electrical: [
    "Panel / Sub-Panel",
    "Breaker",
    "Disconnect",
    "Wiring / Whip",
    "Outlet / Receptacle",
    "Switch",
    "Surge Protector",
    "EV Charger",
    "Generator",
    "Other",
  ],
  plumbing: [
    "Tanked Water Heater",
    "Tankless Water Heater",
    "Sump Pump",
    "Ejector Pump",
    "Water Softener",
    "Other",
  ],
};

export const HVAC_BRANDS = [
  "American Standard",
  "Ameristar",
  "Bryant",
  "Carrier",
  "Coleman",
  "Daikin",
  "Ducane",
  "Goodman",
  "Heil",
  "Lennox",
  "Mitsubishi",
  "Payne",
  "Rheem",
  "Ruud",
  "Tempstar",
  "Trane",
  "York",
];

export const PLUMBING_BRANDS = [
  "A.O. Smith",
  "Bradford White",
  "Rheem",
  "Rinnai",
  "Navien",
  "Noritz",
  "Bosch",
  "State",
  "Kohler",
  "Zoeller",
  "Liberty",
  "Watts",
];

export const ELECTRICAL_BRANDS = [
  "Square D",
  "Eaton",
  "Siemens",
  "GE",
  "Leviton",
  "Legrand",
  "Generac",
  "Kohler",
  "ChargePoint",
  "Tesla",
];

export function brandsFor(category: InstallCategory): string[] {
  if (category === "plumbing") return PLUMBING_BRANDS;
  if (category === "electrical") return ELECTRICAL_BRANDS;
  return HVAC_BRANDS;
}

export const WARRANTY_YEARS = Array.from({ length: 10 }, (_, i) => i + 1);

export const PICKUP_SLOTS: { key: "front" | "left" | "right" | "back" | "top" | "bottom"; label: string }[] = [
  { key: "front", label: "Front" },
  { key: "left", label: "Left Side" },
  { key: "right", label: "Right Side" },
  { key: "back", label: "Back" },
  { key: "top", label: "Top" },
  { key: "bottom", label: "Bottom" },
];
