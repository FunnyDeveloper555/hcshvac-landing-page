// Generated from the uploaded "Databases for Inventory List" workbook (Furnace, Evaporator Coil, Condenser, Water Heater, Boiler sheets).
export type SpecFieldKind = "text" | "textarea" | "url" | "select" | "multi" | "boolean" | "vendor";
export interface SpecField { key: string; label: string; kind: SpecFieldKind; options?: string[] }
export interface SpecCategory { name: string; fields: SpecField[] }

export const PRODUCT_SPEC_CATEGORIES: SpecCategory[] = [
  {
    "name": "Furnace",
    "fields": [
      {
        "key": "series_number",
        "label": "Series Number",
        "kind": "text"
      },
      {
        "key": "vendor",
        "label": "Vendor",
        "kind": "vendor"
      },
      {
        "key": "vendor_sku_item_number",
        "label": "Vendor SKU/Item Number",
        "kind": "text"
      },
      {
        "key": "location_type",
        "label": "Location Type",
        "kind": "multi",
        "options": [
          "Residential",
          "Commercial",
          "Light Commercial",
          "light Industrial",
          "Industrial",
          "Mobile Home Unit"
        ]
      },
      {
        "key": "voltage",
        "label": "Voltage",
        "kind": "select",
        "options": [
          "N/A",
          "24v",
          "120v",
          "208/230",
          "208/230/3",
          "220/240",
          "220/440/3",
          "277/460/3",
          "277/480/3",
          "460/480/3"
        ]
      },
      {
        "key": "a2l_compliant",
        "label": "A2L Compliant",
        "kind": "select",
        "options": [
          "N/A",
          "Yes",
          "No"
        ]
      },
      {
        "key": "energy_star",
        "label": "Energy Star",
        "kind": "select",
        "options": [
          "N/A",
          "Yes",
          "No"
        ]
      },
      {
        "key": "energy_supply_type",
        "label": "Energy Supply Type",
        "kind": "select",
        "options": [
          "Gas",
          "Electric",
          "Propane",
          "Solar",
          "Other"
        ]
      },
      {
        "key": "afue",
        "label": "AFUE",
        "kind": "select",
        "options": [
          "N/A",
          "0.8",
          "0.9",
          "0.92",
          "0.95",
          "0.96",
          "0.97",
          "0.98"
        ]
      },
      {
        "key": "input_btu_s",
        "label": "INPUT BTU's",
        "kind": "select",
        "options": [
          "5000",
          "10000",
          "15000",
          "20000",
          "25000",
          "30000",
          "35000",
          "40000",
          "45000",
          "50000",
          "55000",
          "60000",
          "65000",
          "70000",
          "75000",
          "80000",
          "85000",
          "90000",
          "95000",
          "100000",
          "105000",
          "110000",
          "115000",
          "120000",
          "125000",
          "130000",
          "135000",
          "140000",
          "145000",
          "150000",
          "155000",
          "160000",
          "165000",
          "170000",
          "175000",
          "180000",
          "185000",
          "190000",
          "195000",
          "200000",
          "205000",
          "210000",
          "215000",
          "220000",
          "225000",
          "230000",
          "235000",
          "240000",
          "245000",
          "250000",
          "255000",
          "260000",
          "265000",
          "270000",
          "275000",
          "280000",
          "285000",
          "290000",
          "295000",
          "300000",
          "305000",
          "310000",
          "315000",
          "320000",
          "325000",
          "330000",
          "335000",
          "340000",
          "345000",
          "350000",
          "355000",
          "360000",
          "365000",
          "370000",
          "375000",
          "380000",
          "385000",
          "390000",
          "395000",
          "400000",
          "405000",
          "410000",
          "415000",
          "420000",
          "425000",
          "430000",
          "435000",
          "440000",
          "445000",
          "450000",
          "455000",
          "460000",
          "465000",
          "470000",
          "475000",
          "480000",
          "485000",
          "490000",
          "495000",
          "500000",
          "505000",
          "510000",
          "515000",
          "520000",
          "525000",
          "530000",
          "535000",
          "540000",
          "545000",
          "550000",
          "555000",
          "560000",
          "565000",
          "570000",
          "575000",
          "580000",
          "585000",
          "590000",
          "595000",
          "600000",
          "605000",
          "610000",
          "615000",
          "620000",
          "625000",
          "630000",
          "635000",
          "640000",
          "645000",
          "650000",
          "655000",
          "660000",
          "665000",
          "670000",
          "675000",
          "680000",
          "685000",
          "690000",
          "695000",
          "700000",
          "705000",
          "710000",
          "715000",
          "720000",
          "725000",
          "730000",
          "735000",
          "740000",
          "745000",
          "750000",
          "755000",
          "760000",
          "765000",
          "770000",
          "775000",
          "780000",
          "785000",
          "790000",
          "795000",
          "800000",
          "805000",
          "810000",
          "815000",
          "820000",
          "825000",
          "830000",
          "835000",
          "840000",
          "845000",
          "850000",
          "855000",
          "860000",
          "865000",
          "870000",
          "875000",
          "880000",
          "885000",
          "890000",
          "895000",
          "900000",
          "905000",
          "910000",
          "915000",
          "920000",
          "925000",
          "930000",
          "935000",
          "940000",
          "945000",
          "950000",
          "955000",
          "960000",
          "965000",
          "970000",
          "975000",
          "980000",
          "985000",
          "990000",
          "995000",
          "1000000"
        ]
      },
      {
        "key": "output_btu_s",
        "label": "OUTPUT BTU's",
        "kind": "text"
      },
      {
        "key": "poise",
        "label": "Poise",
        "kind": "multi",
        "options": [
          "Up Flow",
          "Down Flow",
          "Horizontal",
          "Multi-Poise",
          "Side Discharge",
          "Bottom Discharge"
        ]
      },
      {
        "key": "stages",
        "label": "Stages",
        "kind": "select",
        "options": [
          "N/A",
          "Single stage",
          "Two Stage",
          "Two Stage Variable",
          "Modulating"
        ]
      },
      {
        "key": "blower_type",
        "label": "Blower Type",
        "kind": "select",
        "options": [
          "ECM",
          "X13",
          "Frequency Drive",
          "PSC"
        ]
      },
      {
        "key": "blower_speeds",
        "label": "Blower Speeds",
        "kind": "select",
        "options": [
          "N/A",
          "1",
          "2",
          "3",
          "4",
          "5"
        ]
      },
      {
        "key": "blower_tons",
        "label": "Blower Tons",
        "kind": "select",
        "options": [
          "1 Ton",
          "2 Ton",
          "3 Ton",
          "4 Ton",
          "5 Ton",
          "6 Ton",
          "7 Ton",
          "8 Ton",
          "9 Ton",
          "10 Ton",
          "11 Ton",
          "12 Ton",
          "13 Ton",
          "14 Ton",
          "15 Ton",
          "16 Ton",
          "17 Ton",
          "18 Ton",
          "19 Ton",
          "20 Ton",
          "Other"
        ]
      },
      {
        "key": "communicating",
        "label": "Communicating",
        "kind": "select",
        "options": [
          "N/A",
          "Yes",
          "No"
        ]
      },
      {
        "key": "height",
        "label": "Height",
        "kind": "text"
      },
      {
        "key": "width",
        "label": "Width",
        "kind": "select",
        "options": [
          "14.5\"",
          "17.5\"",
          "21\"",
          "24.5\"",
          "Other"
        ]
      },
      {
        "key": "depth",
        "label": "Depth",
        "kind": "text"
      },
      {
        "key": "weight",
        "label": "Weight",
        "kind": "text"
      },
      {
        "key": "our_cost",
        "label": "Our Cost ($)",
        "kind": "text"
      },
      {
        "key": "discontinued",
        "label": "Discontinued",
        "kind": "boolean"
      },
      {
        "key": "replaced_with",
        "label": "Replaced With",
        "kind": "text"
      }
    ]
  },
  {
    "name": "Evaporator Coil",
    "fields": [
      {
        "key": "vendor",
        "label": "Vendor",
        "kind": "vendor"
      },
      {
        "key": "vendor_sku_item_number",
        "label": "Vendor SKU/Item Number",
        "kind": "text"
      },
      {
        "key": "voltage",
        "label": "Voltage",
        "kind": "select",
        "options": [
          "N/A",
          "24v",
          "120v",
          "208/230",
          "208/230/3",
          "220/240",
          "220/440/3",
          "277/460/3",
          "277/480/3",
          "460/480/3"
        ]
      },
      {
        "key": "a2l_kit_required",
        "label": "A2L Kit Required",
        "kind": "select",
        "options": [
          "No",
          "Yes",
          "N/A"
        ]
      },
      {
        "key": "system_type",
        "label": "System Type",
        "kind": "multi",
        "options": [
          "Residential",
          "Light Commerical",
          "Commerical",
          "Industrial"
        ]
      },
      {
        "key": "casing",
        "label": "Casing",
        "kind": "select",
        "options": [
          "Uncased",
          "Cased"
        ]
      },
      {
        "key": "coil_type",
        "label": "Coil Type",
        "kind": "select",
        "options": [
          "A-Coil",
          "N-Coil",
          "Slab Coil"
        ]
      },
      {
        "key": "efficacy_type",
        "label": "Efficacy Type",
        "kind": "select",
        "options": [
          "Piston (Orifice)",
          "TXV (Thermal Expansion Valve)",
          "EEV (Electronic Expansion Valve)"
        ]
      },
      {
        "key": "poise",
        "label": "Poise",
        "kind": "select",
        "options": [
          "Up/Down Flow",
          "Horizontal Dedicated",
          "Horizontal Left",
          "Horizontal Right",
          "Multipoise"
        ]
      },
      {
        "key": "series_number",
        "label": "Series Number",
        "kind": "text"
      },
      {
        "key": "tonnage",
        "label": "Tonnage",
        "kind": "select",
        "options": [
          "1.5",
          "2",
          "2.5",
          "3",
          "3.5",
          "4",
          "5",
          "7",
          "10",
          "15",
          "20",
          "Other [____________]"
        ]
      },
      {
        "key": "btu_s",
        "label": "BTU's",
        "kind": "select",
        "options": [
          "3000",
          "6000",
          "9000",
          "12,000 (1 Ton)",
          "15000",
          "18,000 (1.5 Ton)",
          "21000",
          "24,000 (2 Ton)",
          "27000",
          "30,000 (2.5 Ton)",
          "33000",
          "36,000 (3 Ton)",
          "39000",
          "42,000 (3.5 Ton)",
          "45000",
          "48,000 (4 Ton)",
          "51000",
          "54000",
          "57000",
          "60,000 (5 Ton)",
          "63000",
          "66000",
          "69000",
          "72000",
          "75000",
          "78000",
          "81000",
          "84,000 (7 Ton)",
          "87000",
          "90000",
          "93000",
          "96000",
          "99000",
          "102000",
          "105000",
          "108000",
          "111000",
          "114000",
          "117000",
          "12,0000 (10 Ton)",
          "123000",
          "126000",
          "129000",
          "132000",
          "135000",
          "138000",
          "141000",
          "144000",
          "147000",
          "150000",
          "153000",
          "156000",
          "159000",
          "162000",
          "165000",
          "168000",
          "171000",
          "174000",
          "177000",
          "180,000 (15 Ton)",
          "183000",
          "186000",
          "189000",
          "192000",
          "195000",
          "198000",
          "201000",
          "204000",
          "207000",
          "210000",
          "213000",
          "216000",
          "219000",
          "222000",
          "225000",
          "228000",
          "231000",
          "234000",
          "237000",
          "240,000 (20 Ton)"
        ]
      },
      {
        "key": "seer_rating",
        "label": "Seer Rating",
        "kind": "select",
        "options": [
          "7.7 (HSPF)",
          "13 Seer",
          "14 Seer",
          "15 Seer",
          "16 Seer",
          "17 Seer",
          "18 Seer",
          "19 Seer",
          "20 Seer",
          "20 Seer Plus"
        ]
      },
      {
        "key": "refrigerant",
        "label": "Refrigerant",
        "kind": "multi",
        "options": [
          "R22",
          "R22/R410a",
          "R32/R454b",
          "R32/R454b/R410a/R22",
          "R410a",
          "R32",
          "R454b",
          "Flex Coil"
        ]
      },
      {
        "key": "type",
        "label": "Type",
        "kind": "select",
        "options": [
          "Txv",
          "Piston",
          "EEV",
          "Capillary"
        ]
      },
      {
        "key": "height_casing_or_uncased_coil",
        "label": "Height (Casing or UnCased Coil)",
        "kind": "text"
      },
      {
        "key": "width",
        "label": "Width",
        "kind": "text"
      },
      {
        "key": "depth",
        "label": "Depth",
        "kind": "text"
      },
      {
        "key": "weight",
        "label": "Weight",
        "kind": "text"
      },
      {
        "key": "our_cost",
        "label": "Our Cost ($)",
        "kind": "text"
      },
      {
        "key": "discontinued",
        "label": "Discontinued",
        "kind": "boolean"
      },
      {
        "key": "replaced_with",
        "label": "Replaced With",
        "kind": "text"
      }
    ]
  },
  {
    "name": "Condenser",
    "fields": [
      {
        "key": "series_number",
        "label": "Series Number",
        "kind": "text"
      },
      {
        "key": "vendor",
        "label": "Vendor",
        "kind": "vendor"
      },
      {
        "key": "vendor_sku_item_number",
        "label": "Vendor SKU/Item Number",
        "kind": "text"
      },
      {
        "key": "location_type",
        "label": "Location Type",
        "kind": "multi",
        "options": [
          "Residential",
          "Commercial",
          "Light Commercial",
          "light Industrial",
          "Industrial",
          "Mobile Home Unit"
        ]
      },
      {
        "key": "application_type",
        "label": "Application Type",
        "kind": "select",
        "options": [
          "Outside Ground",
          "Outside Brackets Mountable",
          "Wall Hung/Mountable",
          "RoofTop Stand Alone",
          "Through The Roof",
          "Through the Wall",
          "Window Unit",
          "Portable/Temporary"
        ]
      },
      {
        "key": "voltage",
        "label": "Voltage",
        "kind": "select",
        "options": [
          "N/A",
          "24v",
          "120v",
          "208/230",
          "208/230/3",
          "220/240",
          "220/440/3",
          "277/460/3",
          "277/480/3",
          "460/480/3"
        ]
      },
      {
        "key": "refrigerant_type",
        "label": "Refrigerant Type",
        "kind": "text"
      },
      {
        "key": "a2l_compliant",
        "label": "A2L Compliant",
        "kind": "select",
        "options": [
          "N/A",
          "Yes",
          "No"
        ]
      },
      {
        "key": "energy_star",
        "label": "Energy Star",
        "kind": "select",
        "options": [
          "N/A",
          "Yes",
          "No"
        ]
      },
      {
        "key": "decibel_rating",
        "label": "Decibel Rating",
        "kind": "text"
      },
      {
        "key": "compressor_type",
        "label": "Compressor Type",
        "kind": "select",
        "options": [
          "Inverter / Variable-Speed Compressor",
          "Scroll",
          "Reciprocating (Piston) Compressor",
          "Screw",
          "Rotary",
          "Centrifical",
          "Variable Capacity (Digital Scroll)"
        ]
      },
      {
        "key": "btu_s",
        "label": "BTU's",
        "kind": "select",
        "options": [
          "3000",
          "6000",
          "9000",
          "12,000 (1 Ton)",
          "15000",
          "18,000 (1.5 Ton)",
          "21000",
          "24,000 (2 Ton)",
          "27000",
          "30,000 (2.5 Ton)",
          "33000",
          "36,000 (3 Ton)",
          "39000",
          "42,000 (3.5 Ton)",
          "45000",
          "48,000 (4 Ton)",
          "51000",
          "54000",
          "57000",
          "60,000 (5 Ton)",
          "63000",
          "66000",
          "69000",
          "72000",
          "75000",
          "78000",
          "81000",
          "84,000 (7 Ton)",
          "87000",
          "90000",
          "93000",
          "96000",
          "99000",
          "102000",
          "105000",
          "108000",
          "111000",
          "114000",
          "117000",
          "12,0000 (10 Ton)",
          "123000",
          "126000",
          "129000",
          "132000",
          "135000",
          "138000",
          "141000",
          "144000",
          "147000",
          "150000",
          "153000",
          "156000",
          "159000",
          "162000",
          "165000",
          "168000",
          "171000",
          "174000",
          "177000",
          "180,000 (15 Ton)",
          "183000",
          "186000",
          "189000",
          "192000",
          "195000",
          "198000",
          "201000",
          "204000",
          "207000",
          "210000",
          "213000",
          "216000",
          "219000",
          "222000",
          "225000",
          "228000",
          "231000",
          "234000",
          "237000",
          "240,000 (20 Ton)"
        ]
      },
      {
        "key": "stages",
        "label": "Stages",
        "kind": "select",
        "options": [
          "N/A",
          "1",
          "2",
          "3",
          "Other"
        ]
      },
      {
        "key": "fan_discharge",
        "label": "Fan Discharge",
        "kind": "select",
        "options": [
          "Top Discharge",
          "Side Discharge"
        ]
      },
      {
        "key": "communicating",
        "label": "Communicating",
        "kind": "text"
      },
      {
        "key": "height",
        "label": "Height",
        "kind": "text"
      },
      {
        "key": "width",
        "label": "Width",
        "kind": "text"
      },
      {
        "key": "depth",
        "label": "Depth",
        "kind": "text"
      },
      {
        "key": "weight",
        "label": "Weight",
        "kind": "text"
      },
      {
        "key": "our_cost",
        "label": "Our Cost ($)",
        "kind": "text"
      },
      {
        "key": "discontinued",
        "label": "Discontinued",
        "kind": "boolean"
      },
      {
        "key": "replaced_with",
        "label": "Replaced With",
        "kind": "text"
      }
    ]
  },
  {
    "name": "Water Heater",
    "fields": [
      {
        "key": "vendor",
        "label": "Vendor",
        "kind": "vendor"
      },
      {
        "key": "vendor_sku_item_number",
        "label": "Vendor SKU/Item Number",
        "kind": "text"
      },
      {
        "key": "location_type",
        "label": "Location Type",
        "kind": "multi",
        "options": [
          "Residential",
          "Commercial",
          "Light Commercial",
          "light Industrial",
          "Industrial",
          "Mobile Home Unit"
        ]
      },
      {
        "key": "receipt_estimate_description",
        "label": "Receipt/Estimate Description",
        "kind": "textarea"
      },
      {
        "key": "manufactures_warranty_statement",
        "label": "Manufactures Warranty Statement",
        "kind": "text"
      },
      {
        "key": "warranty_link_manufactures",
        "label": "Warranty Link (Manufactures)",
        "kind": "url"
      },
      {
        "key": "energy_star_rated",
        "label": "Energy Star Rated",
        "kind": "select",
        "options": [
          "N/A",
          "Yes",
          "No"
        ]
      },
      {
        "key": "gallons_capacity_size",
        "label": "Gallons (Capacity/Size)",
        "kind": "select",
        "options": [
          "N /A",
          "5 Gallon",
          "6 Gallon",
          "10 Gallon",
          "20 Gallon",
          "30 Gallon",
          "40 Gallon",
          "50 Gallon",
          "75 Gallon",
          "100 Gallon",
          "125 Gallon",
          "Other"
        ]
      },
      {
        "key": "energy_supply_type",
        "label": "Energy Supply Type",
        "kind": "select",
        "options": [
          "Gas",
          "Electric",
          "Propane",
          "Solar",
          "Other"
        ]
      },
      {
        "key": "btu_hr_input",
        "label": "BTU/Hr Input",
        "kind": "text"
      },
      {
        "key": "lp_btu_hr_input",
        "label": "LP BTU/Hr Input",
        "kind": "text"
      },
      {
        "key": "recovery_at_90_f_rise_us_gph",
        "label": "Recovery at 90°F Rise (US GPH)",
        "kind": "text"
      },
      {
        "key": "floor_to_exhaust_connection_inches",
        "label": "Floor To Exhaust Connection (Inches)",
        "kind": "text"
      },
      {
        "key": "full_jacket_diameter_inches",
        "label": "Full Jacket Diameter (Inches)",
        "kind": "text"
      },
      {
        "key": "vent_type",
        "label": "Vent Type",
        "kind": "select",
        "options": [
          "N/A",
          "Atmospheric",
          "Direct Vent (PVC",
          "Direct Vent (Flex)",
          "Direct Vent (Stainless)",
          "Power Vent (PVC)"
        ]
      },
      {
        "key": "vent_piping_qty",
        "label": "Vent Piping QTY",
        "kind": "select",
        "options": [
          "N/A",
          "1 Pipe (O Only)",
          "2 Pipe (I&O)",
          "2 Pipe (I Optional)"
        ]
      },
      {
        "key": "vent_size_inches",
        "label": "Vent Size (Inches)",
        "kind": "select",
        "options": [
          "N/A",
          "2\"",
          "3\"",
          "4\"",
          "5\"",
          "6\"",
          "7\"",
          "8\"",
          "10\"",
          "12\""
        ]
      },
      {
        "key": "condensing_water_heater",
        "label": "Condensing Water Heater",
        "kind": "select",
        "options": [
          "N/A",
          "Yes",
          "No"
        ]
      },
      {
        "key": "circulation_pump",
        "label": "Circulation Pump",
        "kind": "select",
        "options": [
          "N/A",
          "Yes",
          "No"
        ]
      },
      {
        "key": "ignition_type",
        "label": "Ignition Type",
        "kind": "select",
        "options": [
          "N/A",
          "Manual Ignition (Standing Piolet)",
          "Electronic Spark Ignition (Manual)",
          "Electronic Ignition (Automatic)",
          "Hot Surface Ignitor (Automatic)"
        ]
      },
      {
        "key": "standing_pilot",
        "label": "Standing Pilot",
        "kind": "select",
        "options": [
          "N/A",
          "Yes",
          "No"
        ]
      },
      {
        "key": "flame_sensor",
        "label": "Flame Sensor",
        "kind": "select",
        "options": [
          "N/A",
          "ThermoCouple",
          "Flame Sensor",
          "ThermoPile Generator"
        ]
      },
      {
        "key": "floor_to_t_p_connections_inches",
        "label": "Floor to T&P Connections (Inches)",
        "kind": "text"
      },
      {
        "key": "floor_to_gas_connection_inches",
        "label": "Floor To Gas Connection (Inches)",
        "kind": "text"
      },
      {
        "key": "floor_to_top_of_heater_inches",
        "label": "Floor to Top of Heater (Inches)",
        "kind": "text"
      },
      {
        "key": "depth_front_to_back_of_unit_inches",
        "label": "Depth Front to Back of Unit (Inches)",
        "kind": "text"
      },
      {
        "key": "water_connection_npt_size_inches",
        "label": "Water Connection NPT Size (Inches)",
        "kind": "select",
        "options": [
          "N/A",
          "1/2\"",
          "3/4\"",
          "1\"",
          "1 1/4\"",
          "1 1/2\"",
          "2\""
        ]
      },
      {
        "key": "gas_connection_size_inches",
        "label": "Gas Connection Size (Inches)",
        "kind": "select",
        "options": [
          "N/A",
          "1/2\"",
          "3/4\"",
          "1\"",
          "1 1/4\"",
          "1 1/2\"",
          "2\""
        ]
      },
      {
        "key": "dry_weight_lbs",
        "label": "Dry Weight (LBS)",
        "kind": "text"
      },
      {
        "key": "our_cost",
        "label": "Our Cost ($)",
        "kind": "text"
      },
      {
        "key": "discontinued",
        "label": "Discontinued",
        "kind": "boolean"
      },
      {
        "key": "replaced_with",
        "label": "Replaced With",
        "kind": "text"
      }
    ]
  },
  {
    "name": "Boiler",
    "fields": [
      {
        "key": "series",
        "label": "Series",
        "kind": "text"
      },
      {
        "key": "type",
        "label": "Type",
        "kind": "select",
        "options": [
          "Hot Water",
          "Steam",
          "Tankless",
          "Electric"
        ]
      },
      {
        "key": "location_type",
        "label": "Location Type",
        "kind": "multi",
        "options": [
          "Residential",
          "Commercial",
          "Light Commercial",
          "Industrial"
        ]
      },
      {
        "key": "btu_s",
        "label": "BTU's",
        "kind": "text"
      },
      {
        "key": "voltage",
        "label": "Voltage",
        "kind": "select",
        "options": [
          "24v",
          "120v",
          "208/230",
          "208/230/3",
          "220/240",
          "220/440/3",
          "277/460/3",
          "277/480/3",
          "460/480/3"
        ]
      },
      {
        "key": "vent_type",
        "label": "Vent Type",
        "kind": "select",
        "options": [
          "Atmospheric (Conventional Vent)",
          "Direct Vent (PVC)",
          "Direct Vent (Stainless)",
          "Direct Vent (Flexable Steel)",
          "Ventless"
        ]
      },
      {
        "key": "flue_vent_size",
        "label": "Flue Vent Size",
        "kind": "select",
        "options": [
          "N/A",
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
          "10",
          "11",
          "12",
          "13",
          "14",
          "15",
          "16",
          "17",
          "18"
        ]
      },
      {
        "key": "flue_quantity",
        "label": "Flue Quantity",
        "kind": "select",
        "options": [
          "N/A",
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
          "10",
          "11",
          "12",
          "13",
          "14",
          "15",
          "16",
          "17",
          "18"
        ]
      },
      {
        "key": "energy_supply_type",
        "label": "Energy Supply Type",
        "kind": "select",
        "options": [
          "Gas",
          "Electric",
          "Propane",
          "Solar",
          "GeoThermal",
          "Other"
        ]
      },
      {
        "key": "height",
        "label": "Height",
        "kind": "text"
      },
      {
        "key": "width",
        "label": "Width",
        "kind": "text"
      },
      {
        "key": "depth",
        "label": "Depth",
        "kind": "text"
      },
      {
        "key": "weight",
        "label": "Weight",
        "kind": "text"
      },
      {
        "key": "knock_down",
        "label": "Knock Down",
        "kind": "select",
        "options": [
          "N/A",
          "Yes",
          "No"
        ]
      },
      {
        "key": "number_of_sections",
        "label": "Number of Sections",
        "kind": "select",
        "options": [
          "N/A",
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
          "10",
          "11",
          "12",
          "13",
          "14",
          "15",
          "16",
          "17",
          "18"
        ]
      },
      {
        "key": "number_of_shipping_boxes",
        "label": "Number of Shipping Boxes",
        "kind": "select",
        "options": [
          "N/A",
          "1"
        ]
      },
      {
        "key": "supply_connections",
        "label": "Supply Connections",
        "kind": "select",
        "options": [
          "Top Left Only",
          "Top Right Only",
          "Top Left and Right",
          "Left Side Only",
          "Right Side Only",
          "Left and Right Side",
          "Bottom"
        ]
      },
      {
        "key": "return_connections",
        "label": "Return Connections",
        "kind": "select",
        "options": [
          "Top Left Only",
          "Top Right Only",
          "Top Left and Right",
          "Left Side Only",
          "Right Side Only",
          "Left and Right Side",
          "Bottom"
        ]
      },
      {
        "key": "discontinued",
        "label": "Discontinued",
        "kind": "boolean"
      },
      {
        "key": "replaced_with",
        "label": "Replaced With",
        "kind": "text"
      }
    ]
  }
];

export const specCategory = (name?: string | null) => PRODUCT_SPEC_CATEGORIES.find((c) => c.name === name);
