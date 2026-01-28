import { MapPin } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

interface CompanyServiceAreasAccordionProps {
  companyName: string;
  serviceAreas: string[] | null;
  primaryColor?: string;
}

const CompanyServiceAreasAccordion = ({ companyName, serviceAreas, primaryColor }: CompanyServiceAreasAccordionProps) => {
  if (!serviceAreas || serviceAreas.length === 0) return null;

  // Group areas by state
  const areasByState = serviceAreas.reduce((acc, area) => {
    const parts = area.split(", ");
    const state = parts[parts.length - 1] || "Other";
    if (!acc[state]) acc[state] = [];
    acc[state].push(area);
    return acc;
  }, {} as Record<string, string[]>);

  const totalStates = Object.keys(areasByState).length;

  return (
    <AccordionItem value="service-areas" className="border rounded-lg px-4 bg-background">
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
          <span className="font-semibold text-lg">Area's We Service</span>
          <Badge variant="secondary" className="ml-2">
            {serviceAreas.length} locations across {totalStates} {totalStates === 1 ? "state" : "states"}
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 pt-2 pb-4">
          {Object.entries(areasByState)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([state, areas]) => (
              <div key={state} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-foreground">{state}</span>
                  <Badge variant="outline" className="text-xs">
                    {areas.length} {areas.length === 1 ? "city" : "cities"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {areas
                    .sort((a, b) => a.localeCompare(b))
                    .map((area, index) => {
                      const displayName = area.replace(`, ${state}`, "");
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm truncate" title={area}>
                            {displayName}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default CompanyServiceAreasAccordion;
