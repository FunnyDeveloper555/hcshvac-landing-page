import { MapPin } from "lucide-react";

interface Company {
  name: string;
  service_areas: string[] | null;
}

interface CompanyServiceAreasProps {
  company: Company;
}

const CompanyServiceAreas = ({ company }: CompanyServiceAreasProps) => {
  if (!company.service_areas || company.service_areas.length === 0) return null;

  // Group areas by state
  const areasByState = company.service_areas.reduce((acc, area) => {
    const parts = area.split(", ");
    const state = parts[parts.length - 1] || "Other";
    if (!acc[state]) acc[state] = [];
    acc[state].push(area);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <section id="service-areas" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Service Areas</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {company.name} proudly serves the following areas. Contact us to confirm service availability in your location.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Object.entries(areasByState).map(([state, areas]) => (
            <div key={state} className="bg-muted/30 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                {state}
              </h3>
              <ul className="space-y-2">
                {areas.slice(0, 10).map((area, index) => (
                  <li key={index} className="text-muted-foreground text-sm">
                    {area.replace(`, ${state}`, "")}
                  </li>
                ))}
                {areas.length > 10 && (
                  <li className="text-primary text-sm font-medium">
                    +{areas.length - 10} more cities
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CompanyServiceAreas;
