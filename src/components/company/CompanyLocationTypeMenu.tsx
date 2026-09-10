import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, MapPin } from "lucide-react";
import {
  LocationType,
  MassCountyGroup,
  MassService,
  SERVICE_TYPES,
  ServiceType,
  VISIT_TYPES,
  VisitType,
  enabledServices,
  locationLabel,
  massPagePath,
} from "@/lib/massPages";

interface CompanyLocationTypeMenuProps {
  company: Record<string, unknown> & { name: string };
  groups: MassCountyGroup[];
  locationType: LocationType;
  onNavigate: (path: string) => void;
  /** Prefix for real hrefs (empty on subdomains, /company/:slug on the apex). */
  basePath?: string;
}

/**
 * Location-type landing page (Residential, Commercial, ...): pick a service the
 * company offers, the visit + service type, then a city (CSZ) to open the
 * matching campaign page.
 */
const CompanyLocationTypeMenu = ({
  company,
  groups,
  locationType,
  onNavigate,
  basePath = "",
}: CompanyLocationTypeMenuProps) => {
  const services = useMemo(() => enabledServices(company), [company]);
  const [service, setService] = useState<MassService | null>(null);
  const [visitType, setVisitType] = useState<VisitType>("Emergency");
  const [serviceType, setServiceType] = useState<ServiceType>("Installation");
  const [openCounty, setOpenCounty] = useState<string | null>(null);

  const pathFor = (loc: MassCountyGroup["locations"][number]) =>
    service
      ? massPagePath(service, loc, { locationType, visitType, serviceType })
      : "";

  const titleFor = (loc: MassCountyGroup["locations"][number]) =>
    [
      locationType,
      visitType,
      service?.label ?? "",
      serviceType,
      `${loc.city}, ${loc.state} ${loc.zip}`,
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">
          {locationType} Services — {company.name}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choose the equipment you need help with, then pick your city to open the
          local {locationType.toLowerCase()} page.
        </p>
      </div>

      {/* Step 1 — services offered */}
      {services.length === 0 ? (
        <p className="text-sm text-muted-foreground">No services configured yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {services.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => {
                setService(s);
                setOpenCounty(null);
              }}
              className={
                "px-4 py-2 rounded-full border text-sm font-medium transition-colors " +
                (service?.label === s.label
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted border-border")
              }
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {service && (
        <>
          {/* Step 2 — visit type / service type */}
          <div className="grid sm:grid-cols-2 gap-4 max-w-xl">
            <label className="block">
              <span className="text-xs font-semibold uppercase text-muted-foreground">
                Visit type
              </span>
              <select
                value={visitType}
                onChange={(e) => setVisitType(e.target.value as VisitType)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {VISIT_TYPES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase text-muted-foreground">
                Service type
              </span>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as ServiceType)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {SERVICE_TYPES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Step 3 — CSZ menu */}
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No service areas configured for {company.name} yet.
            </p>
          ) : (
            <ul className="rounded-lg border divide-y bg-background">
              {groups.map((group) => {
                const key = `${group.county}|${group.state}`;
                const open = openCounty === key;
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => setOpenCounty(open ? null : key)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold hover:bg-muted/60 transition-colors"
                    >
                      {open ? (
                        <ChevronDown className="w-4 h-4 text-primary shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                      <span>
                        {group.county}, {group.state}
                      </span>
                      <span className="text-xs text-muted-foreground font-normal">
                        ({group.locations.length})
                      </span>
                    </button>

                    {open && (
                      <ul className="px-3 pb-3 grid sm:grid-cols-2 gap-x-6 gap-y-2">
                        {group.locations.map((loc) => (
                          <li key={`${loc.city}-${loc.zip}`}>
                            <a
                              href={`${basePath}${pathFor(loc)}`}
                              onClick={(e) => {
                                e.preventDefault();
                                onNavigate(pathFor(loc));
                              }}
                              className="flex items-start gap-1.5 py-1 group"
                            >
                              <MapPin className="w-3 h-3 shrink-0 text-muted-foreground mt-1" />
                              <span className="min-w-0">
                                <span className="block text-sm font-medium leading-snug text-foreground group-hover:text-primary transition-colors">
                                  {titleFor(loc)}
                                </span>
                                <span className="block text-xs text-muted-foreground break-all">
                                  {`${basePath}${pathFor(loc)}`}
                                </span>
                                <span className="sr-only">{locationLabel(loc)}</span>
                              </span>
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
        </>
      )}
    </div>
  );
};

export default CompanyLocationTypeMenu;
