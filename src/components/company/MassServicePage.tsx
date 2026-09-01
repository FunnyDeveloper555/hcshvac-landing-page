import { useEffect } from "react";
import { Phone, CheckCircle2, MapPin } from "lucide-react";
import {
  MassCountyGroup,
  MassPageRef,
  MassTextBlock,
  defaultMassOverrides,
  defaultMassTextBlocks,
  locationLabel,
  massPagePath,
  mergeMassOverrides,
  serviceBrands,
} from "@/lib/massPages";
import { useMassPageContent } from "@/hooks/useMassPageContent";
import MassHeroCarousel from "@/components/company/MassHeroCarousel";
import hvac1 from "@/assets/hvac-slide-1.jpg";
import hvac2 from "@/assets/hvac-slide-2.jpg";
import hvac3 from "@/assets/hvac-slide-3.jpg";
import hvac4 from "@/assets/hvac-slide-4.jpg";
import hvac5 from "@/assets/hvac-slide-5.jpg";
import hvac6 from "@/assets/hvac-slide-6.jpg";

const HVAC_PHOTOS = [hvac1, hvac2, hvac3, hvac4, hvac5, hvac6];

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
  const opts = { visitType, locationType };
  const pagePath = massPagePath(service, location, opts);

  const brands = serviceBrands(service, company);
  const rowCount = brands.length > 18 ? 3 : brands.length > 8 ? 2 : 1;
  const perRow = Math.ceil(brands.length / rowCount);
  const marqueeRows = Array.from({ length: rowCount }, (_, i) =>
    brands.slice(i * perRow, (i + 1) * perRow),
  ).filter((r) => r.length > 0);

  const phone = company.company_phone || null;

  const siblings =
    groups.find((g) => g.county === location.county && g.state === location.state)?.locations || [];

  const { blocks: savedBlocks, overrides: savedOverrides } = useMassPageContent(
    company.id as string | undefined,
    pagePath,
  );

  const defaults = defaultMassOverrides(company, service, location, opts);
  const content = mergeMassOverrides(defaults, savedOverrides);
  const sections = content.sections;

  const defaultBlocks = defaultMassTextBlocks(company, service, location, opts);
  const textBlocks: MassTextBlock[] = savedBlocks ?? defaultBlocks;

  useEffect(() => {
    document.title = content.metaTitle;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", content.metaDescription);
  }, [content.metaTitle, content.metaDescription]);

  // Pick HVAC photos offset by a hash of the page path so each page varies.
  let photoHash = 0;
  for (let i = 0; i < pagePath.length; i++) photoHash = (photoHash * 31 + pagePath.charCodeAt(i)) | 0;
  const photoOffset = Math.abs(photoHash) % HVAC_PHOTOS.length;
  const photo = (n: number) => HVAC_PHOTOS[(photoOffset + n) % HVAC_PHOTOS.length];
  const heroImage = company.hero_image_url as string | null;
  const fallbackSrc = [heroImage || photo(0), photo(2), photo(4)];

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
          <span className="text-foreground">{content.heading}</span>
        </nav>

        {sections.hero !== false && (
          <MassHeroCarousel
            seed={pagePath}
            kicker={content.heroKicker}
            title={content.heroTitle}
            subtitle={content.heroSubtitle}
            phone={phone}
            onContact={onContact}
          />
        )}

        {sections.intro !== false && (
          <header className="space-y-3">
            <p className="text-sm font-semibold text-primary uppercase tracking-wide">
              {content.heroKicker}
            </p>
            <h1 className="text-3xl md:text-4xl font-bold">{content.heading}</h1>
            <p className="text-sm text-muted-foreground">{content.heroSubtitle}</p>
            <p className="text-muted-foreground max-w-3xl whitespace-pre-wrap">{content.intro}</p>
            {phone && (
              <a
                href={`tel:${String(phone).replace(/[^0-9+]/g, "")}`}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <Phone className="w-4 h-4" />
                Call {phone}
              </a>
            )}
          </header>
        )}

        {sections.bullets !== false && content.bullets.length > 0 && (
          <section className="grid gap-4 sm:grid-cols-2">
            {content.bullets.map((b) => (
              <div key={b} className="flex items-start gap-2 rounded-lg border p-4 bg-background">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">{b}</span>
              </div>
            ))}
          </section>
        )}

        {sections.brands !== false && brands.length > 0 && (
          <section className="relative rounded-xl border bg-gradient-to-br from-muted/60 via-background to-muted/40 overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_1px_1px,var(--foreground)_1px,transparent_0)] bg-[length:24px_24px]" />
            <div className="relative border-b px-6 py-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-semibold">{content.brandsHeading}</h2>
              <p className="text-xs text-muted-foreground">
                {brands.length} {content.brandsNote}
              </p>
            </div>

            <div className="relative py-6 space-y-4 marquee-mask">
              {marqueeRows.map((row, rowIndex) => (
                <div key={rowIndex} className="relative overflow-hidden">
                  <div
                    className={`flex w-max ${
                      rowIndex % 2 === 0 ? "animate-marquee" : "animate-marquee-reverse"
                    } hover:[animation-play-state:paused]`}
                  >
                    {[...row, ...row].map((brand, i) => (
                      <span
                        key={`${brand}-${i}`}
                        className="mx-3 flex shrink-0 items-center gap-2 rounded-full border bg-background/80 backdrop-blur-sm px-5 py-2.5 text-sm font-semibold whitespace-nowrap shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300"
                      >
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        {brand}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Editable editorial text blocks (managed in Page Builder → Mass Pages) */}
        {sections.blocks !== false && textBlocks.length > 0 && (
          <section className="grid gap-6 lg:grid-cols-3">
            {textBlocks.map((block, i) => (
              <div key={`${block.heading}-${i}`} className="rounded-lg border bg-background p-6 space-y-2">
                {block.heading && <h2 className="text-lg font-semibold">{block.heading}</h2>}
                {block.body && (
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{block.body}</p>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Image boxes with editable alt text and captions */}
        {sections.images !== false && content.images.length > 0 && (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {content.images.map((img, i) => (
              <figure key={`${img.alt}-${i}`} className="overflow-hidden rounded-lg border bg-background">
                <img
                  src={img.url || fallbackSrc[i % fallbackSrc.length]}
                  alt={img.alt}
                  loading="lazy"
                  className="h-48 w-full object-cover"
                />
                {img.caption && (
                  <figcaption className="p-3 text-xs text-muted-foreground">{img.caption}</figcaption>
                )}
              </figure>
            ))}
          </section>
        )}

        {sections.nearby !== false && siblings.length > 1 && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">{content.nearbyHeading}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6">
              {siblings
                .filter((l) => l.city !== location.city)
                .map((l) => (
                  <a
                    key={`${l.city}-${l.zip}`}
                    href={`${basePath}${massPagePath(service, l, opts)}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(massPagePath(service, l, opts));
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

        {sections.cta !== false && (
          <section className="rounded-lg border p-6 bg-muted/40 space-y-3">
            <h2 className="text-xl font-semibold">{content.ctaHeading}</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{content.ctaBody}</p>
            <button
              onClick={onContact}
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              {content.ctaButton}
            </button>
          </section>
        )}
      </div>
    </div>
  );
};

export default MassServicePage;
