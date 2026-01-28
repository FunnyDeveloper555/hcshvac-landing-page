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
    <section id="service-areas" className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h3 className="text-2xl md:text-3xl font-bold mb-3 flex items-center justify-center gap-2">
            <MapPin className="w-6 h-6" style={{ color: primaryColor }} />
            Area's We Service
          </h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {companyName} proudly serves {serviceAreas.length} locations across {totalStates} {totalStates === 1 ? "state" : "states"}.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Accordion type="multiple" className="w-full">
            {Object.entries(areasByState)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([state, areas]) => (
                <AccordionItem key={state} value={state} className="border rounded-lg mb-2 px-4 bg-background">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4" style={{ color: primaryColor }} />
                      <span className="font-semibold text-lg">{state}</span>
                      <Badge variant="secondary" className="ml-2">
                        {areas.length} {areas.length === 1 ? "city" : "cities"}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-2 pb-4">
                      {areas
                        .sort((a, b) => a.localeCompare(b))
                        .map((area, index) => {
                          // Remove state from display if it's at the end
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
                  </AccordionContent>
                </AccordionItem>
              ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default CompanyServiceAreasAccordion;
