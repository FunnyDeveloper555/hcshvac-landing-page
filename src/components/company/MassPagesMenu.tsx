import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, MapPin } from "lucide-react";
import {
  MassCountyGroup,
  MassService,
  enabledServices,
  massPagePath,
  locationLabel,
} from "@/lib/massPages";

interface MassPagesMenuProps {
  company: Record<string, unknown> & { name: string };
  groups: MassCountyGroup[];
  onNavigate: (path: string) => void;
  /** Prefix for real hrefs (empty on subdomains, /company/:slug on the apex). */
  basePath?: string;
}

/**
 * Nested "Mass Pages" tree: service category -> county -> city page link.
 * Fully derived from the company profile (services + service areas).
 */
const MassPagesMenu = ({ company, groups, onNavigate, basePath = "" }: MassPagesMenuProps) => {
  const services = useMemo(() => enabledServices(company), [company]);
  const [openService, setOpenService] = useState<string | null>(services[0]?.label ?? null);
  const [openCounty, setOpenCounty] = useState<string | null>(null);

  const totalPages = services.length * groups.reduce((n, g) => n + g.locations.length, 0);

  const toggleService = (service: MassService) => {
    setOpenCounty(null);
    setOpenService((prev) => (prev === service.label ? null : service.label));
  };

  if (groups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No service areas configured for {company.name} yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Service &amp; Location Pages</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {totalPages.toLocaleString()} pages across {groups.length}{" "}
          {groups.length === 1 ? "county" : "counties"} — pick a service, then a city.
        </p>
      </div>

      <ul className="rounded-lg border divide-y bg-background">
        {services.map((service) => {
          const serviceOpen = openService === service.label;
          return (
            <li key={service.label}>
              <button
                type="button"
                onClick={() => toggleService(service)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold hover:bg-muted/60 transition-colors"
              >
                {serviceOpen ? (
                  <ChevronDown className="w-4 h-4 text-primary shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <span>{service.label}</span>
              </button>

              {serviceOpen && (
                <ul className="pb-2">
                  {groups.map((group) => {
                    const countyKey = `${service.label}|${group.county}|${group.state}`;
                    const countyOpen = openCounty === countyKey;
                    return (
                      <li key={countyKey} className="pl-6">
                        <button
                          type="button"
                          onClick={() => setOpenCounty(countyOpen ? null : countyKey)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-sm font-medium text-primary hover:underline"
                        >
                          {countyOpen ? (
                            <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                          )}
                          {group.county}
                          <span className="text-xs text-muted-foreground font-normal">
                            ({group.locations.length})
                          </span>
                        </button>

                        {countyOpen && (
                          <ul className="pl-6 py-1 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-4">
                            {group.locations.map((loc) => (
                              <li key={`${loc.city}-${loc.zip}`}>
                                <a
                                  href={`${basePath}${massPagePath(service, loc)}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    onNavigate(massPagePath(service, loc));
                                  }}
                                  className="flex items-center gap-1.5 py-1 text-sm text-foreground/80 hover:text-primary transition-colors"
                                >
                                  <MapPin className="w-3 h-3 shrink-0 text-muted-foreground" />
                                  <span className="truncate">{locationLabel(loc)}</span>
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default MassPagesMenu;
