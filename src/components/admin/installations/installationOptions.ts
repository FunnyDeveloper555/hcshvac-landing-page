export type InstallCategory = "residential_hvac" | "commercial_hvac" | "plumbing";

export const CATEGORY_LABEL: Record<InstallCategory, string> = {
  residential_hvac: "Residential HVAC",
  commercial_hvac: "Commercial HVAC",
  plumbing: "Plumbing",
};

export const ITEM_TYPES: Record<InstallCategory, string[]> = {
  residential_hvac: [
    "Coil",
    "Condenser",
    "Furnace",
    "Packaged Unit",
    "Humidifier",
    "De-Humidifier",
    "U.V Light",
    "Thermostat",
    "Zoning",
  ],
  commercial_hvac: [
    "Packed/RTU Unit",
    "Coil",
    "Condenser",
    "Furnace",
    "Humidifier",
    "De-Humidifier",
    "U.V Light",
    "Thermostat",
    "Zoning",
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

export const WARRANTY_YEARS = Array.from({ length: 10 }, (_, i) => i + 1);
