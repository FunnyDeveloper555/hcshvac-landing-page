// Option lists for the Residential Site Location Profile Questionnaire

export const HEATING_TYPES = [
  "Furnace", "Air Handler", "Boiler Hot Water", "Boiler Steam",
  "Hydronic", "Heat Pump", "Waste Oil Heater", "Mini Split",
];

export const POISE_OPTIONS = [
  "N/A", "Up Flow", "Down Flow",
  "Horizontal Left/Up Flow", "Horizontal Right/Up Flow",
  "Horizontal Left/Down Flow", "Horizontal Right/Down Flow",
];

export const WIDTH_OPTIONS = ["14.5\"", "17.5\"", "21\"", "24.5\""];

export const AFUE_OPTIONS = ["80%", "82.5%", "90%", "92%", "95%", "96.5%", "97%", "98%"];

export const STAGE_OPTIONS = ["Single Stage", "Two Stage", "Two Stage Variable", "Modulating"];

export const ENERGY_SUPPLY = [
  "Natural Gas", "Propane", "Electric", "Waste Oil", "Oil",
  "Diesel", "Gasoline", "Generator",
];

export const VOLTAGE_OPTIONS = ["120v", "208/230v", "240v", "Other"];

export const BTU_KW = [
  "40,000 BTU / 5Kw", "45,000 BTU / 10Kw", "50,000 BTU / 15Kw", "55,000 BTU / 20Kw",
  "60,000 BTU", "65,000 BTU", "70,000 BTU", "75,000 BTU", "80,000 BTU",
  "85,000 BTU", "90,000 BTU", "95,000 BTU", "100,000 BTU", "110,000 BTU",
  "115,000 BTU", "120,000 BTU", "125,000 BTU", "130,000 BTU", "135,000 BTU",
  "140,000 BTU", "145,000 BTU", "150,000 BTU", "155,000 BTU",
];

export const AGE_OPTIONS = [
  "N/A", "1-5 Years", "6-8 Years", "8-10 Years",
  "10-12 Years", "12-15 Years", "16-20 Years", "20+ Years", "UNKNOWN",
];

export const THERMOSTAT_OPTIONS = [
  "Standard/Basic", "Wifi/Smart", "Dedicated Communicating", "Heat Only",
];

// Cooling
export const COOLING_LOCATION = [
  "Left Side of Residence", "Right Side of Residence",
  "Back- Left Side", "Back - Center", "Back - Right",
];

export const COOLING_ACCESS = [
  "Accessible Completely", "Gate – Left Side", "Gate – Right Side",
  "Ladder Required", "Other",
];

export const COOLING_MOUNTING = [
  "Brackets", "Brackets and Pad", "Pad On Ground", "Concrete/Paver Brick Pad",
];

// Sump / Ejector
export const HP_OPTIONS = ["¼ HP", "1/3 HP", "½ HP", "¾ HP", "1 HP", "Other", "UNKNOWN"];
export const PIPE_OPTIONS = ["1 ¼\" PVC", "1 ½\" PVC", "2\" PVC", "Other", "UNKNOWN"];

// Filter size photo (shared across all system kinds)
export const FILTER_SIZE_PHOTO_SLOTS = [
  { key: "filter_size", label: "Filter Size" },
];

export const FILTER_QUANTITY_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

// Belt size photo (shared across all system kinds)
export const BELT_SIZE_PHOTO_SLOTS = [
  { key: "belt_size", label: "Belt Size" },
];

// Field documents photo (shared across all system kinds)
export const FIELD_DOCUMENTS_PHOTO_SLOTS = [
  { key: "field_documents", label: "Field Documents" },
];



// Photo slots per system kind
export const HEATING_PHOTO_SLOTS = [
  { key: "label_plate", label: "Label Plate" },
  { key: "upper_section", label: "Upper Section" },
  { key: "lower_section", label: "Lower Section" },
  { key: "photo_right", label: "Photo Right" },
  { key: "photo_center", label: "Photo Center" },
  { key: "flue_at_unit", label: "Flue Assembly At Unit" },
  { key: "flue_run", label: "Flue Assembly (RUN)" },
  { key: "flue_exterior", label: "Flue Assembly Exterior" },
  { key: "drain_at_unit", label: "Drain Assembly At Unit" },
  { key: "drain_termination", label: "Drain Assembly Termination" },
  { key: "humidifier", label: "Humidifier" },
  { key: "uv_light", label: "U.V Light" },
  { key: "filter_assembly", label: "Filter Assembly" },
  { key: "thermostat", label: "Thermostat" },
];

export const COOLING_PHOTO_SLOTS = [
  { key: "label_plate", label: "Label Plate" },
  { key: "condenser", label: "Condenser Unit" },
  { key: "disconnect", label: "Disconnect Box" },
  { key: "line_set", label: "Line Set" },
  { key: "pad_mounting", label: "Pad / Mounting" },
  { key: "outside_termination", label: "Outside Termination" },
];

export const SUMP_PHOTO_SLOTS = [
  { key: "pit", label: "Pit" },
  { key: "piping", label: "Piping" },
  { key: "electrical", label: "Electrical" },
  { key: "inside_through_wall", label: "Inside Through Wall" },
  { key: "outside_termination", label: "Outside Termination" },
  { key: "item_of_concern", label: "Item of Concern" },
];

export const EJECTOR_PHOTO_SLOTS = SUMP_PHOTO_SLOTS;

// Water Heater
export const WATER_HEATER_TYPES = [
  "Tank - Natural Gas", "Tank - Propane", "Tank - Electric", "Tank - Oil",
  "Tankless - Natural Gas", "Tankless - Propane", "Tankless - Electric",
  "Hybrid / Heat Pump", "Indirect (Boiler)", "Point-of-Use",
];

export const WATER_HEATER_CAPACITY = [
  "20 Gallon", "30 Gallon", "40 Gallon", "50 Gallon", "55 Gallon",
  "65 Gallon", "75 Gallon", "80 Gallon", "100 Gallon", "119 Gallon",
  "Tankless (GPM)", "Other",
];

export const WATER_HEATER_VENT = [
  "Atmospheric", "Power Vent", "Direct Vent", "Power Direct Vent",
  "Condensing", "Electric (None)", "Other",
];

export const WATER_HEATER_LOCATION = [
  "Basement", "Utility Closet", "Garage", "Attic",
  "Crawl Space", "Mechanical Room", "Exterior", "Other",
];

export const WATER_HEATER_PHOTO_SLOTS = [
  { key: "label_plate", label: "Label Plate" },
  { key: "full_view", label: "Full View" },
  { key: "top_connections", label: "Top / Connections" },
  { key: "gas_electric_supply", label: "Gas / Electric Supply" },
  { key: "flue_at_unit", label: "Flue / Vent At Unit" },
  { key: "flue_termination", label: "Flue / Vent Termination" },
  { key: "expansion_tank", label: "Expansion Tank" },
  { key: "tp_relief", label: "T&P Relief / Drain" },
  { key: "shutoff_valve", label: "Shutoff Valve" },
  { key: "pan_drain", label: "Drip Pan / Drain" },
];

