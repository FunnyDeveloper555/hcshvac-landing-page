import { useEffect, useRef, useState } from "react";
import { Phone, CheckCircle2, MapPin } from "lucide-react";
import {
  MassCountyGroup,
  MassPageRef,
  MassTextBlock,
  defaultMassOverrides,
  defaultMassTextBlocks,
  locationLabel,
  massPagePath,
  massTemplatePath,
  mergeMassOverrides,
  serviceBrands,
  massCampaignTemplate,
  MassSectionKey,
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
  const templatePath = massTemplatePath(service, opts);

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
    templatePath,
  );

  // ---- Admin live preview (?preview=1): unsaved edits arrive by postMessage ----
  const isPreview =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("preview") === "1";
  const [draft, setDraft] = useState<{
    overrides?: Record<string, unknown> | null;
    blocks?: MassTextBlock[] | null;
    section?: string | null;
  } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPreview) return;
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string } | null;
      if (!data || data.type !== "mass-preview") return;
      setDraft(data as typeof draft);
    };
    window.addEventListener("message", onMessage);
    window.parent?.postMessage({ type: "mass-preview-ready" }, "*");
    return () => window.removeEventListener("message", onMessage);
  }, [isPreview]);

  const focusSection = isPreview ? draft?.section || null : null;

  // Scroll the previewed section into view whenever the editor changes tabs.
  useEffect(() => {
    if (!focusSection || !rootRef.current) return;
    const el = rootRef.current.querySelector(`[data-mass-section="${focusSection}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focusSection]);

  const defaults = defaultMassOverrides(company, service, location, opts);
  const effectiveOverrides = isPreview && draft?.overrides
    ? { ...(savedOverrides || {}), ...draft.overrides }
    : savedOverrides;
  const content = mergeMassOverrides(defaults, effectiveOverrides);
  const sections = content.sections;

  const defaultBlocks = defaultMassTextBlocks(company, service, location, opts);
  const draftBlocks = isPreview && draft?.blocks ? draft.blocks : null;
  const textBlocks: MassTextBlock[] = draftBlocks ?? savedBlocks ?? defaultBlocks;

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

  // `?tpl=` lets the admin preview a different theme template without saving.
  const tplPreview =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("tpl")
      : null;
  const layout = massCampaignTemplate(tplPreview || content.template);
  const theme = layout.theme;
  const telHref = phone ? `tel:${String(phone).replace(/[^0-9+]/g, "")}` : null;

  const themeVars = {
    "--primary": theme.primary,
    "--primary-foreground": theme.primaryForeground,
    "--accent": theme.accent,
    "--accent-foreground": theme.primary,
    "--ring": theme.primary,
    "--radius": theme.radius,
    "--muted": theme.surface,
  } as React.CSSProperties;

  const heroVariants: Record<string, JSX.Element> = {
    carousel: (
      <MassHeroCarousel
        seed={pagePath}
        kicker={content.heroKicker}
        title={content.heroTitle}
        subtitle={content.heroSubtitle}
        phone={phone}
        onContact={onContact}
      />
    ),
    split: (
      <div className="grid gap-8 lg:grid-cols-2 items-center rounded-3xl bg-gradient-to-br from-primary/10 via-background to-accent p-8">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {content.heroKicker}
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold leading-tight">{content.heroTitle}</h1>
          <p className="text-muted-foreground">{content.heroSubtitle}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={onContact}
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg hover:opacity-90"
            >
              {content.ctaButton}
            </button>
            {telHref && (
              <a
                href={telHref}
                className="rounded-full border border-primary/30 px-6 py-3 text-sm font-semibold text-primary"
              >
                {phone}
              </a>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <img src={photo(0)} alt={content.heroTitle} loading="lazy" className="col-span-2 h-56 w-full rounded-3xl object-cover shadow-xl" />
          <img src={photo(1)} alt={content.heading} loading="lazy" className="h-32 w-full rounded-2xl object-cover" />
          <img src={photo(3)} alt={content.heading} loading="lazy" className="h-32 w-full rounded-2xl object-cover" />
        </div>
      </div>
    ),
    banner: (
      <div className="relative overflow-hidden rounded-sm border-y-4 border-primary bg-primary text-primary-foreground p-8 text-center">
        <p className="text-xs font-black uppercase tracking-[0.3em] opacity-80">{content.heroKicker}</p>
        <h1 className="mt-2 text-3xl md:text-5xl font-extrabold uppercase leading-tight">
          {content.heroTitle}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm opacity-90">{content.heroSubtitle}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {telHref && (
            <a href={telHref} className="rounded-sm bg-background px-8 py-3 text-base font-extrabold text-primary">
              CALL {phone}
            </a>
          )}
          <button
            onClick={onContact}
            className="rounded-sm border-2 border-primary-foreground px-8 py-3 text-base font-extrabold uppercase"
          >
            {content.ctaButton}
          </button>
        </div>
      </div>
    ),
    editorial: (
      <div className="border-b pb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          {content.heroKicker}
        </p>
        <h1 className="mt-3 max-w-4xl font-serif text-4xl md:text-5xl font-semibold leading-tight">
          {content.heroTitle}
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-muted-foreground">{content.heroSubtitle}</p>
        {telHref && (
          <a href={telHref} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4">
            <Phone className="w-4 h-4" /> {phone}
          </a>
        )}
      </div>
    ),
    compact: (
      <div className="rounded-3xl bg-primary/5 p-6 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
          {content.heroKicker}
        </p>
        <h1 className="mt-1 text-2xl font-semibold">{content.heroTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{content.heroSubtitle}</p>
        <div className="mt-4 flex flex-col gap-2">
          {telHref && (
            <a href={telHref} className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
              Call {phone}
            </a>
          )}
          <button onClick={onContact} className="rounded-full border px-5 py-2.5 text-sm font-semibold">
            {content.ctaButton}
          </button>
        </div>
      </div>
    ),
  };

  const templateHeader = (() => {
    const inner = (
      <>
        <span className="font-bold">{company.name}</span>
        <span className="flex items-center gap-3 text-sm">
          {telHref && (
            <a href={telHref} className="inline-flex items-center gap-1.5 font-semibold">
              <Phone className="w-3.5 h-3.5" /> {phone}
            </a>
          )}
          <button onClick={onContact} className="hidden sm:inline">
            {content.ctaButton}
          </button>
        </span>
      </>
    );
    switch (theme.headerVariant) {
      case "solid":
        return (
          <div className="bg-primary text-primary-foreground">
            <div className="container mx-auto flex items-center justify-between px-4 py-2.5">{inner}</div>
          </div>
        );
      case "glass":
        return (
          <div className="bg-primary/95 text-primary-foreground backdrop-blur-md">
            <div className="container mx-auto flex items-center justify-between px-4 py-3">{inner}</div>
          </div>
        );
      case "alert":
        return (
          <div className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider">
            <div className="container mx-auto flex items-center justify-between px-4 py-2">
              <span>⚠ 24/7 Emergency Dispatch — {company.name}</span>
              {telHref && <a href={telHref}>Call {phone}</a>}
            </div>
          </div>
        );
      case "minimal":
        return (
          <div className="bg-primary text-primary-foreground">
            <div className="container mx-auto flex items-center justify-between px-4 py-3 font-serif">{inner}</div>
          </div>
        );
      default:
        return (
          <div className="bg-primary text-primary-foreground">
            <div className="container mx-auto px-4 py-2.5 text-center text-sm font-semibold">
              {company.name}
              {phone ? ` · ${phone}` : ""}
            </div>
          </div>
        );
    }
  })();

  const templateFooter = (() => {
    const links = (
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <button onClick={onHome} className="hover:underline">Home</button>
        <button onClick={() => onNavigate("/mass-pages")} className="hover:underline">Service Areas</button>
        <button onClick={onContact} className="hover:underline">Contact</button>
      </div>
    );
    switch (theme.footerVariant) {
      case "dark":
        return (
          <footer className="mt-12 bg-primary text-primary-foreground">
            <div className="container mx-auto flex flex-col gap-3 px-4 py-8 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-lg font-bold">{company.name}</div>
                <p className="text-xs opacity-80">{content.heroKicker} · {phone}</p>
              </div>
              {links}
            </div>
          </footer>
        );
      case "gradient":
        return (
          <footer className="mt-16 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
            <div className="container mx-auto space-y-3 px-4 py-10 text-center">
              <div className="text-2xl font-semibold">{company.name}</div>
              <p className="text-sm opacity-90">{content.ctaBody}</p>
              <div className="flex justify-center">{links}</div>
            </div>
          </footer>
        );
      case "compact":
        return (
          <footer className="mt-10 bg-primary text-primary-foreground">
            <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-4 text-xs font-bold uppercase">
              <span>{company.name}</span>
              {telHref && <a href={telHref} className="underline">Call {phone}</a>}
            </div>
          </footer>
        );
      case "columns":
        return (
          <footer className="mt-14 bg-primary text-primary-foreground">
            <div className="container mx-auto grid gap-6 px-4 py-10 sm:grid-cols-3">
              <div>
                <div className="font-serif text-lg font-semibold">{company.name}</div>
                <p className="mt-1 text-xs opacity-80">{phone}</p>
              </div>
              <div className="space-y-1 text-sm">
                <div className="font-semibold">Navigate</div>
                {links}
              </div>
              <div className="text-sm">
                <div className="font-semibold">Service area</div>
                <p className="opacity-80">{place}</p>
              </div>
            </div>
          </footer>
        );
      default:
        return (
          <footer className="mt-8 bg-primary py-6 text-center text-xs text-primary-foreground">
            {company.name} · {phone}
          </footer>
        );
    }
  })();

  /* ---- Request Service (CTA) — one distinct layout per theme ---- */
  const ctaVariants: Record<string, JSX.Element> = {
    // Split panel with a ticked checklist rail
    standard: (
      <section
        className="overflow-hidden border border-primary/20 bg-background shadow-sm transition-shadow hover:shadow-md"
        style={{ borderRadius: theme.radius }}
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/40 to-primary" />
        <div className="grid md:grid-cols-[1.4fr_1fr]">
          <div className="space-y-3 p-6">
            <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              Request Service
            </p>
            <h2 className={theme.headingClass}>{content.ctaHeading}</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{content.ctaBody}</p>
            <ul className="grid gap-1.5 pt-1 sm:grid-cols-2">
              {["Licensed & insured techs", "Upfront pricing", "Same-day dispatch", "Workmanship guarantee"].map((t) => (
                <li key={t} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col justify-center gap-3 bg-primary p-6 text-primary-foreground">
            {telHref && (
              <a href={telHref} className="flex items-center gap-2 text-lg font-bold">
                <Phone className="w-5 h-5" /> {phone}
              </a>
            )}
            <button
              onClick={onContact}
              className="bg-background px-5 py-2.5 text-sm font-bold text-primary transition-transform hover:-translate-y-0.5"
              style={{ borderRadius: theme.radius }}
            >
              {content.ctaButton}
            </button>
            <p className="text-xs opacity-80">Same-day scheduling in {place}</p>
          </div>
        </div>
      </section>
    ),
    // Immersive gradient stage with glowing orbs
    spotlight: (
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-primary/90 to-primary/50 p-10 text-center text-primary-foreground shadow-2xl">
        <div className="absolute -right-20 -top-24 h-64 w-64 animate-pulse rounded-full bg-primary-foreground/10 blur-2xl" />
        <div className="absolute -bottom-24 -left-16 h-72 w-72 animate-pulse rounded-full bg-primary-foreground/10 blur-3xl [animation-delay:1.5s]" />
        <div className="relative mx-auto max-w-2xl space-y-5">
          <p className="text-[10px] uppercase tracking-[0.5em] opacity-80">Request Service</p>
          <h2 className="text-4xl font-semibold leading-tight">{content.ctaHeading}</h2>
          <div className="mx-auto h-px w-24 bg-primary-foreground/40" />
          <p className="text-sm leading-relaxed opacity-90 whitespace-pre-wrap">{content.ctaBody}</p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={onContact}
              className="rounded-full bg-background px-9 py-3.5 text-sm font-semibold text-primary shadow-xl transition-transform duration-300 hover:scale-105"
            >
              {content.ctaButton}
            </button>
            {telHref && (
              <a
                href={telHref}
                className="rounded-full border border-primary-foreground/50 px-9 py-3.5 text-sm font-semibold backdrop-blur-sm transition-colors hover:bg-primary-foreground/10"
              >
                {phone}
              </a>
            )}
          </div>
        </div>
      </section>
    ),
    // Hard-sell ticket block with striped urgency bar
    conversion: (
      <section className="border-4 border-primary bg-primary/5">
        <div
          className="px-4 py-2 text-center text-xs font-black uppercase tracking-[0.3em] text-primary-foreground"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, hsl(var(--primary)) 0 12px, hsl(var(--primary) / 0.75) 12px 24px)",
          }}
        >
          ⚡ Request Service Now — Fast Response in {place}
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <h2 className="text-2xl font-black uppercase leading-tight">{content.ctaHeading}</h2>
            <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{content.ctaBody}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["No overtime fees", "Upfront quotes", "Open 24/7"].map((t) => (
                <span key={t} className="border-2 border-primary px-2 py-0.5 text-[10px] font-black uppercase text-primary">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {telHref && (
              <a
                href={telHref}
                className="rounded-sm bg-primary px-6 py-4 text-center text-lg font-black text-primary-foreground shadow-[4px_4px_0_hsl(var(--foreground))] transition-transform active:translate-y-0.5"
              >
                CALL {phone}
              </a>
            )}
            <button
              onClick={onContact}
              className="rounded-sm border-2 border-primary px-6 py-2.5 text-sm font-extrabold uppercase text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              {content.ctaButton}
            </button>
          </div>
        </div>
      </section>
    ),
    // Magazine column with numbered steps
    editorial: (
      <section className="border-y-2 border-primary/30 py-10">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="font-serif text-xs uppercase tracking-[0.35em] text-primary">Request Service</p>
            <h2 className="mt-3 font-serif text-4xl font-normal leading-tight">{content.ctaHeading}</h2>
            <p className="mt-4 border-l-2 border-primary/40 pl-4 font-serif text-base leading-relaxed text-muted-foreground whitespace-pre-wrap">
              {content.ctaBody}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-8">
              <button
                onClick={onContact}
                className="border-b-2 border-primary pb-1 font-serif text-sm uppercase tracking-[0.2em] text-primary transition-opacity hover:opacity-70"
              >
                {content.ctaButton}
              </button>
              {telHref && (
                <a href={telHref} className="inline-flex items-center gap-2 font-serif text-base">
                  <Phone className="w-4 h-4 text-primary" /> {phone}
                </a>
              )}
            </div>
          </div>
          <ol className="space-y-4 md:border-l md:pl-8">
            {[
              ["Tell us what's wrong", "A quick call or form is all it takes."],
              ["We schedule your visit", `A technician is routed to ${place}.`],
              ["Repair, done right", "Upfront pricing, guaranteed workmanship."],
            ].map(([title, body], i) => (
              <li key={title} className="flex gap-4">
                <span className="font-serif text-2xl text-primary/50">{`0${i + 1}`}</span>
                <div>
                  <div className="font-serif text-base font-medium">{title}</div>
                  <p className="text-sm text-muted-foreground">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    ),
    // Mobile-first action card
    compact: (
      <section className="rounded-2xl bg-gradient-to-b from-primary to-primary/85 p-5 text-center text-primary-foreground shadow-lg">
        <span className="inline-block rounded-full bg-primary-foreground/15 px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest">
          Request Service
        </span>
        <h2 className="mt-2 text-lg font-semibold">{content.ctaHeading}</h2>
        <p className="mt-1 text-xs opacity-90 whitespace-pre-wrap">{content.ctaBody}</p>
        <div className="mt-4 flex flex-col gap-2">
          {telHref && (
            <a href={telHref} className="rounded-full bg-background px-5 py-3 text-sm font-bold text-primary shadow-md">
              Call {phone}
            </a>
          )}
          <button
            onClick={onContact}
            className="rounded-full border border-primary-foreground/60 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-primary-foreground/10"
          >
            {content.ctaButton}
          </button>
        </div>
        <p className="mt-3 text-[10px] uppercase tracking-widest opacity-70">Serving {place}</p>
      </section>
    ),
  };

  const nodes: Partial<Record<MassSectionKey, JSX.Element | null>> = {
    hero: <div key="hero">{heroVariants[theme.heroVariant] || heroVariants.carousel}</div>,
    intro: (
      <header key="intro" className="space-y-3">
        <p className="text-sm font-semibold text-primary uppercase tracking-wide">
          {content.heroKicker}
        </p>
        <h2 className={theme.headingClass}>{content.heading}</h2>
        <p className="text-sm text-muted-foreground">{content.heroSubtitle}</p>
        <p className="text-muted-foreground max-w-3xl whitespace-pre-wrap">{content.intro}</p>
        {telHref && (
          <a
            href={telHref}
            className="inline-flex items-center gap-2 bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            style={{ borderRadius: theme.radius }}
          >
            <Phone className="w-4 h-4" />
            Call {phone}
          </a>
        )}
      </header>
    ),
    bullets:
      content.bullets.length > 0 ? (
        <section key="bullets" className="grid gap-4 sm:grid-cols-2">
          {content.bullets.map((b) => (
            <div key={b} className={`flex items-start gap-2 p-4 ${theme.cardClass}`}>
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm">{b}</span>
            </div>
          ))}
        </section>
      ) : null,
    brands:
      brands.length > 0 ? (
        <section
          key="brands"
          className={`relative overflow-hidden bg-gradient-to-br from-muted/60 via-background to-accent ${theme.cardClass}`}
        >
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_1px_1px,var(--foreground)_1px,transparent_0)] bg-[length:24px_24px]" />
          <div className="relative border-b px-6 py-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className={theme.headingClass}>{content.brandsHeading}</h2>
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
      ) : null,
    blocks:
      textBlocks.length > 0 ? (
        <section key="blocks" className="grid gap-6 lg:grid-cols-3">
          {textBlocks.map((block, i) => (
            <div key={`${block.heading}-${i}`} className={`p-6 space-y-2 ${theme.cardClass}`}>
              {block.heading && <h2 className="text-lg font-semibold">{block.heading}</h2>}
              {block.body && (
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {block.body}
                </p>
              )}
            </div>
          ))}
        </section>
      ) : null,
    images:
      content.images.length > 0 ? (
        <section key="images" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {content.images.map((img, i) => (
            <figure key={`${img.alt}-${i}`} className={`overflow-hidden ${theme.cardClass}`}>
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
      ) : null,
    nearby:
      siblings.length > 1 ? (
        <section key="nearby" className="space-y-3">
          <h2 className={theme.headingClass}>{content.nearbyHeading}</h2>
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
      ) : null,
    cta: <div key="cta">{ctaVariants[theme.bodyVariant] || ctaVariants.standard}</div>,
  };

  return (
    <div style={themeVars} className="pb-0" ref={rootRef}>
      <div className="pt-24" data-mass-section="header">{templateHeader}</div>
      <div className={`container mx-auto px-4 py-8 ${theme.sectionGap}`}>
        <nav className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
          <button onClick={onHome} className="hover:text-primary">Home</button>
          <span>/</span>
          <button onClick={() => onNavigate("/mass-pages")} className="hover:text-primary">
            Service Areas
          </button>
          <span>/</span>
          <span className="text-foreground">{content.heading}</span>
        </nav>

        {layout.order.map((key) => (sections[key] === false ? null : nodes[key] || null))}
      </div>
      {templateFooter}
    </div>
  );
};


export default MassServicePage;
