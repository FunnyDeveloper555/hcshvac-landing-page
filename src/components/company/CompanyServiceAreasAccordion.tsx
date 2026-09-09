import { MapPin } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

interface CompanyServiceAreasAccordionProps {
  companyName: string;
  serviceAreas: string[] | null;
  primaryColor?: string;
  /**
   * Mass page title prefix (e.g. "Residential-Emergency-AirConditioning").
   * When set, every city entry is labelled "<prefix>-<City>, <County>, <ST>".
   */
  titlePrefix?: string | null;
}

/** "Addison (Township), DuPage County, IL" -> parts */
const parseArea = (area: string) => {
  const parts = area.split(",").map((p) => p.trim());
  const state = parts.length > 1 ? parts[parts.length - 1] : "Other";
  const county = parts.length > 2 ? parts[parts.length - 2] : "Other Areas";
  const city = parts[0] || area;
  return { city, county, state };
};

const CompanyServiceAreasAccordion = ({
  companyName,
  serviceAreas,
  primaryColor,
  titlePrefix,
}: CompanyServiceAreasAccordionProps) => {
  if (!serviceAreas || serviceAreas.length === 0) return null;

  // state -> county -> cities
  const tree: Record<string, Record<string, { city: string; state: string; county: string }[]>> = {};
  serviceAreas.forEach((area) => {
    const p = parseArea(area);
    tree[p.state] ??= {};
    tree[p.state][p.county] ??= [];
    tree[p.state][p.county].push(p);
  });

  const totalStates = Object.keys(tree).length;
  const label = titlePrefix
    ? (p: { city: string; county: string; state: string }) =>
        `${titlePrefix}-${p.city}, ${p.county}, ${p.state}`
    : (p: { city: string; county: string; state: string }) => `${p.city}, ${p.county}`;

  return (
    <AccordionItem value="service-areas" className="border rounded-lg px-4 bg-background">
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
          <span className="font-semibold text-lg">
            {titlePrefix ? "Other Areas We Service" : "Area's We Service"}
          </span>
          <Badge variant="secondary" className="ml-2">
            {serviceAreas.length} locations across {totalStates} {totalStates === 1 ? "state" : "states"}
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="pt-1 pb-4">
          <Accordion type="multiple" className="w-full space-y-2">
            {Object.entries(tree)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([state, counties]) => {
                const stateCount = Object.values(counties).reduce((n, c) => n + c.length, 0);
                return (
                  <AccordionItem
                    key={state}
                    value={`state-${state}`}
                    className="border rounded-md px-3 bg-muted/20"
                  >
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{state}</span>
                        <Badge variant="outline" className="text-xs">
                          {Object.keys(counties).length}{" "}
                          {Object.keys(counties).length === 1 ? "county" : "counties"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {stateCount} {stateCount === 1 ? "city" : "cities"}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Accordion type="multiple" className="w-full space-y-2 pb-2">
                        {Object.entries(counties)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([county, cities]) => (
                            <AccordionItem
                              key={county}
                              value={`county-${state}-${county}`}
                              className="border rounded-md px-3 bg-background"
                            >
                              <AccordionTrigger className="hover:no-underline py-2.5">
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                                  <span className="text-sm font-medium">{county}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {cities.length} {cities.length === 1 ? "city" : "cities"}
                                  </Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1 pb-2">
                                  {cities
                                    .sort((a, b) => a.city.localeCompare(b.city))
                                    .map((p, index) => {
                                      const text = label(p);
                                      return (
                                        <div
                                          key={`${p.city}-${index}`}
                                          className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                                        >
                                          <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                          <span className="text-xs truncate" title={text}>
                                            {text}
                                          </span>
                                        </div>
                                      );
                                    })}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                      </Accordion>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
          </Accordion>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default CompanyServiceAreasAccordion;
