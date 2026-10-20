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
    "Boiler",
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

// ============================================================
// On-Location Install Profile — spec fields per item_type
// ============================================================
export type SpecField = {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "textarea";
  options?: string[];
  suffix?: string;
};

const HVAC_COMMON: SpecField[] = [
  { key: "tonnage", label: "Tonnage", type: "select", options: ["1.5","2","2.5","3","3.5","4","5"] },
  { key: "btu", label: "BTU / hr", type: "text" },
  { key: "seer", label: "SEER / SEER2", type: "text" },
  { key: "refrigerant", label: "Refrigerant", type: "select", options: ["R-410A","R-32","R-454B","R-22"] },
  { key: "voltage", label: "Voltage", type: "select", options: ["115V","208/230V","460V"] },
  { key: "breaker_amps", label: "Breaker (A)", type: "text" },
];

const COIL_SPEC: SpecField[] = [
  { key: "tonnage", label: "Tonnage", type: "select", options: ["1.5","2","2.5","3","3.5","4","5"] },
  { key: "btu", label: "BTU", type: "text" },
  { key: "seer", label: "SEER / SEER2", type: "text" },
  { key: "refrigerant", label: "Refrigerant", type: "select", options: ["R-410A","R-32","R-454B","R-22"] },
];

const FURNACE_SPEC: SpecField[] = [
  { key: "input_btu", label: "Input BTU", type: "text" },
  { key: "afue", label: "AFUE %", type: "text" },
  { key: "fuel", label: "Fuel", type: "select", options: ["Natural Gas","Propane","Oil","Electric"] },
  { key: "stage", label: "Stage", type: "select", options: ["Single","Two-Stage","Modulating"] },
  { key: "orientation", label: "Orientation", type: "select", options: ["Upflow","Downflow","Horizontal"] },
  { key: "vent_type", label: "Vent Type", type: "select", options: ["B-Vent","Direct Vent","Power Vent"] },
];

const WATER_HEATER_SPEC: SpecField[] = [
  { key: "capacity_gal", label: "Capacity (gal)", type: "text" },
  { key: "fuel", label: "Fuel", type: "select", options: ["Natural Gas","Propane","Electric"] },
  { key: "input_btu", label: "Input BTU", type: "text" },
  { key: "vent_type", label: "Vent Type", type: "select", options: ["Atmospheric","Power Vent","Direct Vent","Concentric"] },
  { key: "warranty_tank", label: "Tank Warranty (yrs)", type: "text" },
];

const ELECTRICAL_SPEC: SpecField[] = [
  { key: "amperage", label: "Amperage", type: "text" },
  { key: "voltage", label: "Voltage", type: "select", options: ["120V","240V","208V","480V"] },
  { key: "phase", label: "Phase", type: "select", options: ["Single","Three"] },
  { key: "wire_gauge", label: "Wire Gauge", type: "text" },
];

export function specFieldsFor(category: InstallCategory, itemType: string): SpecField[] {
  if (category === "plumbing") {
    if (/water heater/i.test(itemType)) return WATER_HEATER_SPEC;
    return [
      { key: "capacity", label: "Capacity / Size", type: "text" },
      { key: "notes_spec", label: "Notes", type: "textarea" },
    ];
  }
  if (category === "electrical") return ELECTRICAL_SPEC;
  // HVAC categories
  if (/^coil$/i.test(itemType)) return COIL_SPEC;
  if (/furnace/i.test(itemType)) return FURNACE_SPEC;
  if (/thermostat/i.test(itemType)) {
    return [
      { key: "wifi", label: "Wi-Fi Enabled", type: "select", options: ["Yes","No"] },
      { key: "stages_heat", label: "Heat Stages", type: "text" },
      { key: "stages_cool", label: "Cool Stages", type: "text" },
    ];
  }
  if (/humidifier|u\.v|zoning/i.test(itemType)) {
    return [
      { key: "model_class", label: "Model Class", type: "text" },
      { key: "voltage", label: "Voltage", type: "select", options: ["24V","120V","208/230V"] },
    ];
  }
  return HVAC_COMMON;
}

export const INSTALL_PHOTO_SLOTS: { key: string; label: string }[] = [
  { key: "nameplate", label: "Name Plate / Label" },
  { key: "installed_front", label: "Installed — Front" },
  { key: "installed_side", label: "Installed — Side" },
  { key: "connections", label: "Connections" },
  { key: "electrical", label: "Electrical" },
  { key: "venting", label: "Venting / Flue" },
  { key: "condensate", label: "Condensate / Drain" },
  { key: "general", label: "General Photo" },
  { key: "area_of_concern", label: "Area of Concern" },
];

