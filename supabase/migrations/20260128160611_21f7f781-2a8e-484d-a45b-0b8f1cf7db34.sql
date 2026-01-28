-- Create brands table for HVAC equipment brands
CREATE TABLE public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active brands"
ON public.brands FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can view all brands"
ON public.brands FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert brands"
ON public.brands FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update brands"
ON public.brands FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete brands"
ON public.brands FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_brands_updated_at
BEFORE UPDATE ON public.brands
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert all HVAC equipment brands
INSERT INTO public.brands (name) VALUES
('AAF'), ('AAON'), ('AAONAIRE'), ('AbsolutAire'), ('Adams'), ('Addison'), ('Adirondack-Aire'), ('ADP'), ('Advantage'), ('AEC'),
('AERO'), ('Aeroflo'), ('AeroSys Incorporated'), ('Air Star'), ('AIRBLOC'), ('AIRCO'), ('AirEase'), ('AirEase-Johnson'), ('Airedale'), ('Aire-Flo'),
('AirPac'), ('Airquest'), ('AirTemp'), ('Airtherm'), ('Airwell-Fedders'), ('AITONS'''), ('Allied Air/Allied-Commercial'), ('AllStyle'), ('Alton'), ('Amana'),
('AMBIRAD'), ('American Best'), ('American Furnace'), ('American Radiator'), ('American Standard'), ('Ameristar'), ('Anthes'), ('Anthratube'), ('Applied Air'), ('Aqua Products'),
('Aqua Star'), ('AQUAS'), ('AquaSnap'), ('Aquazone'), ('ARCOAIRE'), ('ArcticCircle'), ('ARGO'), ('ARKLA'), ('Armstrong'), ('Armstrong Air'),
('Aspen'), ('Atherion'), ('Avenger'), ('Axeman-Anderson'), ('Aztec'), ('BARD'), ('BARTACO'), ('BASMOR'), ('BDP'), ('BEACON/MORRIS'),
('BENJAMIN'), ('Benson'), ('BERNER'), ('BIASI'), ('BLACKHEAT'), ('BORG-WARNER'), ('BOSCH'), ('Broan'), ('Brock'), ('Brute'),
('Brute II'), ('Bryan Boilers'), ('Bryant'), ('Buderus'), ('Buffalo'), ('Burnham'), ('Cadet'), ('California Heat Pump'), ('Canatal'), ('Captive-Aire'),
('Carrier'), ('Celsior'), ('Centaurus'), ('Central Electric Furnace'), ('Century'), ('Champion'), ('Champion Cooler'), ('Chromalox'), ('Chrysler Air-Temp'), ('Clare'),
('Clearfire'), ('Cleaver Brooks'), ('ClimaCool'), ('Climate Control'), ('Climate Master'), ('Climate Worx'), ('ClimateCraft'), ('Cold Flow'), ('Cold Point'), ('Coleman'),
('Columbia'), ('COMBAT'), ('Comfort-Aire'), ('Comfortmaker'), ('Comfortwave'), ('Comitale/CNI'), ('Command-Aire'), ('Commercial-Pak'), ('Compu-Aire'), ('Concord'),
('Conquest'), ('Consolidated Industries'), ('COOLIT'), ('Copeland'), ('Copper-fin'), ('Copper-fin II'), ('Co-Ray-Vac'), ('Corsair'), ('Counterflow'), ('Cox'),
('Crane'), ('Crest'), ('Dadanco'), ('Daikin'), ('Data Aire'), ('Day & Night'), ('Dayton'), ('Delco-Heat'), ('Delta'), ('Desert Aire'),
('DesignLine'), ('Dettson'), ('Directflo'), ('Dornback'), ('DryAire'), ('Dual Air'), ('Ducane'), ('Dunham-Bush'), ('Dunkirk'), ('Duromatic-Airco'),
('Duromatic-Olsen'), ('DynaPac'), ('ECONAR'), ('ECR'), ('ECUA'), ('EDPAC'), ('Effinity 93'), ('Electra'), ('Embassy'), ('Emerson'),
('EMI'), ('Energy Kinetics'), ('EnergyRite'), ('Enerstor'), ('Enterprise Fawcett'), ('EnviroAir'), ('Enviromaster'), ('Essick Air'), ('Eubank'), ('Evapco'),
('Evcon'), ('E-verter'), ('EVO'), ('Fedders'), ('FHP'), ('First Co.'), ('Ford'), ('Franklin Electrick'), ('Fraser-Johnston'), ('Friedrich'),
('Frigidaire'), ('FTXL'), ('Fujitsu'), ('Gaffers & Sattler'), ('General Electric - (GE)'), ('Geo-comfort'), ('Geo-Flo'), ('Geosource'), ('Gibson'), ('Glowcore'),
('GmC'), ('Goettl'), ('Goodman'), ('Governaire'), ('Grandaire'), ('Green Colonial'), ('Grimsby'), ('Guardian'), ('H.B. Smith'), ('Haier'),
('Hallmark'), ('Hamilton'), ('Hamilton Electric'), ('HAYWARD'), ('Heat Controller'), ('Heatmaster'), ('HECD'), ('Heil'), ('Heil-Quaker'), ('Herman-Nelson'),
('Holland'), ('Hot Dawg'), ('Hydraulics Institute'), ('HydroHeat'), ('Hydron/Hydron Module'), ('Hydro-Temp'), ('HydroTherm'), ('Hyfra'), ('Janitrol'), ('Johnson'),
('Johnstone'), ('Keeprite'), ('Kelvinator'), ('Kenmore'), ('Kewanee Boilers'), ('King'), ('Klimaire'), ('Knight'), ('Knight XL'), ('Koldwave'),
('Koppel'), ('KwiKool'), ('L.J. Wing'), ('Laars'), ('Layton'), ('Lear Siegler'), ('LECS'), ('Lendell'), ('Lennox'), ('LG'),
('Liberty'), ('Liebert'), ('Lifebreath'), ('Lincoln Barrièr'), ('Lochinvar'), ('LSB'), ('Luxaire'), ('Magic Aire'), ('Magic Chef'), ('Magic-Pak'),
('MAGNATHERM'), ('Mammoth'), ('Marley'), ('Marvair'), ('MASCOT FT Boiler'), ('MASCOT LX Boiler'), ('MasterCool'), ('Maximum'), ('Maytag'), ('McQuay'),
('Metromatic'), ('MIDEA'), ('Mighty Therm'), ('Mighty Therm2'), ('Miller'), ('Mini Therm'), ('MiniPac'), ('Mini-Star'), ('Mitsubishi'), ('Modine'),
('ModPac'), ('MoistAir'), ('Moncreif'), ('Montgomery Ward'), ('Mortex'), ('Motivair'), ('Movincool'), ('MRCOOL'), ('Munchkin'), ('National Comfort Products'),
('Neotherm'), ('New Yorker'), ('Newmac'), ('NOBLE'), ('NORDAIRNICHE'), ('Nordic Air'), ('Nordyne'), ('Nortek (Nordyne Manufacturing)'), ('Northstar'), ('NuTemp'),
('NuTone'), ('Olsen'), ('Olympia'), ('Oneida Royal'), ('OneX'), ('Oxbox'), ('P.F.C.'), ('Paloma'), ('Panasonic'), ('Patriot 80'),
('Pavillion'), ('Payne'), ('Peerless'), ('Pennant'), ('Pennco'), ('Penstan-AirEase'), ('Perfex'), ('Philco'), ('Pinnacle'), ('Polenz'),
('Port-A-Cool'), ('PortaPac'), ('Power-fin'), ('Precision'), ('Premier'), ('Purefire'), ('Purmo'), ('Quiet Kool'), ('R.B.I.'), ('Raypac Motivair'),
('Raypak'), ('Red T'), ('Regal'), ('Regal Star'), ('Remington'), ('Republic'), ('Resco'), ('Retroaire'), ('Reznor'), ('Rheem'),
('Rheos'), ('Richmond'), ('Riello'), ('Rinnai'), ('Riva'), ('Robur'), ('Ruud'), ('Samsung'), ('Sanyo'), ('Saturn'),
('Savio'), ('ScavPac'), ('Sears'), ('Semco'), ('Sentra'), ('Sharp'), ('Sierra'), ('Singer'), ('Skyline'), ('Slant Fin'),
('SlimPac'), ('Smith Cast Iron Boilers'), ('Snyder General'), ('Solaia'), ('Space Conditioner'), ('SpacePak'), ('Spec-Air'), ('SPX'), ('Square D'), ('Sterling'),
('Sterling Industrial'), ('Stewart-Warner'), ('Suburban Dynaline 3'), ('Summit'), ('Sun'), ('Sun Glow'), ('Sunbelt'), ('Sunburst'), ('Super Hot'), ('SYNC'),
('Tappan'), ('Tecumseh'), ('Teledyne Laars'), ('Temprite'), ('Tempstar'), ('TempTek'), ('Tetco'), ('Thatcher'), ('Thermal Solutions'), ('Thermal Zone'),
('ThermaQuiet'), ('Thermo Pride'), ('Thermo Products'), ('Thermoflo'), ('Timken'), ('Titan Air'), ('Trane'), ('Tranquility'), ('Trianco'), ('Trident'),
('Tridon'), ('Trilogy'), ('U. S. Boiler'), ('Ultimate'), ('Ultracool'), ('ULTRAVAC'), ('Union Energy'), ('United Refrigeration'), ('Utica'), ('Vaillant'),
('Valedictorian'), ('Vantage'), ('Ventrol'), ('Vesta'), ('Viessmann'), ('Vision'), ('Vulcan'), ('WaterFurnace'), ('Weatherking'), ('Weathermaster'),
('Webco'), ('Weil-McLain'), ('Wesper'), ('Westinghouse'), ('Whirlpool'), ('Williams'), ('Williamson Thermoflo'), ('Winchester'), ('Worcester'), ('York'), ('Zoneline');