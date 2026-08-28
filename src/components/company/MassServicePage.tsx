import { useEffect } from "react";
import { Phone, CheckCircle2, MapPin } from "lucide-react";
import {
  MassCountyGroup,
  MassPageRef,
  locationLabel,
  massPageSummary,
  massPagePath,
  serviceBrands,
} from "@/lib/massPages";
import MassHeroCarousel from "@/components/company/MassHeroCarousel";



interface MassServicePageProps {
  company: Record<string, unknown> & {
    name: string;
    company_phone?: string | null;
  };
  page: MassPageRef;
  groups: MassCountyGroup[];
  onNavigate: (path: string) => void;
  /** Prefix for real hrefs (empty on subdomains, /company/:slug on the apex). */
  basePath?: string;
  onHome: () => void;
  onContact: () => void;
}

const MassServicePage = ({
  company,
  page,
  groups,
  onNavigate,
  basePath = "",
  onHome,
  onContact,
}: MassServicePageProps) => {
  const { service, location, visitType, locationType } = page;
  const place = locationLabel(location);
  const serviceTitle = visitType ? `${visitType} ${service.label}` : service.label;
  const heading = `${serviceTitle} in ${place}`;
  const summary = massPageSummary(service.label, location, { visitType, locationType });
  const brands = serviceBrands(service, company);
  const phone = company.company_phone || null;

  const siblings =
    groups.find((g) => g.county === location.county && g.state === location.state)?.locations || [];

  useEffect(() => {
    document.title = `${heading} | ${company.name}`.slice(0, 60);
    const audience = locationType ? `${locationType.toLowerCase()} properties` : "homes and businesses";
    const description = `${company.name} provides expert ${serviceTitle.toLowerCase()} for ${audience} in ${place} and throughout ${location.county}.`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description.slice(0, 158));
  }, [heading, place, serviceTitle, locationType, company.name, location.county]);

  const bullets = [
    visitType === "Emergency"
      ? `24/7 emergency ${service.label.toLowerCase()} in ${location.city}`
      : `Same-day ${service.label.toLowerCase()} appointments in ${location.city}`,
    locationType
      ? `${locationType} specialists for ${location.city} properties`
      : "Licensed, bonded and insured technicians",
    "Upfront pricing with no hidden fees",
    `Serving all of ${location.county}, ${location.state}`,
  ];

  const audience = locationType ? `${locationType.toLowerCase()} properties` : "homes and businesses";
  const brandLine = brands.length ? brands.slice(0, 6).join(", ") : "all major brands";

  const textBlocks = [
    {
      heading: `Why ${location.city} chooses ${company.name}`,
      body: `${company.name} has built its reputation on honest ${service.label.toLowerCase()} for ${audience} across ${place}. Every visit starts with a full diagnostic, a clear explanation of what we found, and pricing you approve before any work begins — no surprises after the job is done.`,
    },
    {
      heading: `What our ${service.label.toLowerCase()} includes`,
      body: `Our ${location.county} technicians arrive stocked for ${service.action.toLowerCase()} work on ${brandLine}. We check airflow, electrical connections, refrigerant or gas pressures, safety controls and thermostat operation, then document the results so you know exactly what condition your system is in.`,
    },
    {
      heading: `Fast scheduling across ${location.county}`,
      body: `${visitType === "Emergency" ? "Emergency calls are dispatched around the clock" : "Same-day and next-day appointments are usually available"} for ${location.city} and neighboring communities in ${location.county}, ${location.state}. Call ${phone || "our office"} or request service online and we will confirm an arrival window that fits your schedule.`,
    },
  ];

  const heroImage = (company.hero_image_url as string | null) || "/amerce/images/section/text-image.jpg";
  const imageBoxes = [
    {
      src: heroImage,
      alt: `${company.name} technician performing ${service.label.toLowerCase()} in ${place}`,
      caption: `${serviceTitle} in ${location.city}, ${location.state}`,
    },
    {
      src: "/amerce-template/assets/images/section/text-image.jpg",
      alt: `${service.group} equipment ready for ${service.action.toLowerCase()} in ${location.county}`,
      caption: `${service.group} ${service.action.toLowerCase()} for ${audience}`,
    },
    {
      src: "/amerce-template/assets/images/section/banner-2.jpg",
      alt: `${company.name} serving ${location.county}, ${location.state}`,
      caption: `Licensed and insured across ${location.county}`,
    },
  ];



  return (
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-4 space-y-10">
        <nav className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
          <button onClick={onHome} className="hover:text-primary">Home</button>
          <span>/</span>
          <button onClick={() => onNavigate("/mass-pages")} className="hover:text-primary">
            Service Areas
          </button>
          <span>/</span>
          <span className="text-foreground">{heading}</span>
        </nav>

        <MassHeroCarousel
          seed={massPagePath(service, location, { visitType, locationType })}
          kicker={`${location.county}, ${location.state}`}
          title={heading}
          subtitle={summary}
          phone={phone}
          onContact={onContact}
        />


        <header className="space-y-3">
          <p className="text-sm font-semibold text-primary uppercase tracking-wide">
            {location.county}, {location.state}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold">{heading}</h1>
          <p className="text-sm text-muted-foreground">{summary}</p>
          <p className="text-muted-foreground max-w-3xl">
            {company.name} delivers professional {service.label.toLowerCase()} for homes and
            businesses in {place}. Our technicians know the equipment, the codes and the weather in{" "}
            {location.county} — so you get a lasting fix the first time.
          </p>
          {phone && (
            <a
              href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Phone className="w-4 h-4" />
              Call {phone}
            </a>
          )}
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          {bullets.map((b) => (
            <div key={b} className="flex items-start gap-2 rounded-lg border p-4 bg-background">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm">{b}</span>
            </div>
          ))}
        </section>

        {brands.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              Brands we {service.action === "Installation" ? "install" : service.action.toLowerCase()} in{" "}
              {location.city}
            </h2>
            <div className="flex flex-wrap gap-2">
              {brands.slice(0, 60).map((brand) => (
                <span
                  key={brand}
                  className="rounded-full border px-3 py-1 text-xs text-foreground/80"
                >
                  {brand}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Three editorial text blocks (SEO body copy) */}
        <section className="grid gap-6 lg:grid-cols-3">
          {textBlocks.map((block) => (
            <div key={block.heading} className="rounded-lg border bg-background p-6 space-y-2">
              <h2 className="text-lg font-semibold">{block.heading}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{block.body}</p>
            </div>
          ))}
        </section>

        {/* Three image boxes with descriptive alt text */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {imageBoxes.map((img) => (
            <figure key={img.alt} className="overflow-hidden rounded-lg border bg-background">
              <img
                src={img.src}
                alt={img.alt}
                loading="lazy"
                className="h-48 w-full object-cover"
              />
              <figcaption className="p-3 text-xs text-muted-foreground">{img.caption}</figcaption>
            </figure>
          ))}
        </section>

        {siblings.length > 1 && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              {service.label} nearby in {location.county}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6">
              {siblings
                .filter((l) => l.city !== location.city)
                .map((l) => (
                  <a
                    key={`${l.city}-${l.zip}`}
                    href={`${basePath}${massPagePath(service, l, { visitType, locationType })}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(massPagePath(service, l, { visitType, locationType }));
                    }}
                    className="flex items-center gap-1.5 py-1 text-sm text-foreground/80 hover:text-primary"
                  >
                    <MapPin className="w-3 h-3 shrink-0 text-muted-foreground" />
                    <span className="truncate">
                      {service.label} in {l.city}, {l.state}
                    </span>
                  </a>
                ))}
            </div>
          </section>
        )}





        <section className="rounded-lg border p-6 bg-muted/40 space-y-3">
          <h2 className="text-xl font-semibold">Book {service.label} in {location.city}</h2>
          <p className="text-sm text-muted-foreground">
            Tell us what's going on and we'll get a technician scheduled in {place}.
          </p>
          <button
            onClick={onContact}
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Request Service
          </button>
        </section>
      </div>
    </div>
  );
};

export default MassServicePage;
