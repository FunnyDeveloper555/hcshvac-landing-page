import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

import slide1 from "@/assets/hvac-slide-1.jpg";
import slide2 from "@/assets/hvac-slide-2.jpg";
import slide3 from "@/assets/hvac-slide-3.jpg";
import slide4 from "@/assets/hvac-slide-4.jpg";
import slide5 from "@/assets/hvac-slide-5.jpg";
import slide6 from "@/assets/hvac-slide-6.jpg";

const POOL = [
  { src: slide1, label: "Air conditioning service" },
  { src: slide2, label: "Furnace and heating service" },
  { src: slide3, label: "Commercial rooftop units" },
  { src: slide4, label: "Fast local dispatch" },
  { src: slide5, label: "Refrigerant and diagnostics" },
  { src: slide6, label: "Boilers and water heaters" },
];

const STYLES = ["fade", "slide", "kenburns", "thumbs", "split"] as const;
type CarouselStyle = (typeof STYLES)[number];

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

interface MassHeroCarouselProps {
  /** Stable string (page slug) — decides the carousel style and image order. */
  seed: string;
  title: string;
  kicker?: string;
  subtitle?: string;
  phone?: string | null;
  onContact?: () => void;
}

const MassHeroCarousel = ({ seed, title, kicker, subtitle, phone, onContact }: MassHeroCarouselProps) => {
  const h = useMemo(() => hash(seed || "default"), [seed]);
  const style: CarouselStyle = STYLES[h % STYLES.length];

  const slides = useMemo(() => {
    const offset = h % POOL.length;
    const count = 3 + (h % 3); // 3–5 slides
    return Array.from({ length: count }, (_, i) => POOL[(offset + i) % POOL.length]);
  }, [h]);

  const [index, setIndex] = useState(0);
  const total = slides.length;
  const go = (n: number) => setIndex(((n % total) + total) % total);

  useEffect(() => {
    const t = setInterval(() => setIndex((p) => (p + 1) % total), 5200);
    return () => clearInterval(t);
  }, [total]);

  const Caption = (
    <div className="space-y-2 text-white drop-shadow">
      {kicker && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">{kicker}</p>
      )}
      <h2 className="text-2xl md:text-4xl font-bold leading-tight max-w-2xl">{title}</h2>
      {subtitle && <p className="text-sm md:text-base text-white/85 max-w-xl">{subtitle}</p>}
      <div className="flex flex-wrap gap-2 pt-2">
        {phone && (
          <a
            href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Phone className="w-4 h-4" />
            {phone}
          </a>
        )}
        {onContact && (
          <button
            onClick={onContact}
            className="rounded-md border border-white/70 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
          >
            Request Service
          </button>
        )}
      </div>
    </div>
  );

  const Arrows = (
    <>
      <button
        aria-label="Previous slide"
        onClick={() => go(index - 1)}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/40 p-2 text-white hover:bg-black/70"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        aria-label="Next slide"
        onClick={() => go(index + 1)}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/40 p-2 text-white hover:bg-black/70"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </>
  );

  const Dots = (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
      {slides.map((_, i) => (
        <button
          key={i}
          aria-label={`Go to slide ${i + 1}`}
          onClick={() => go(i)}
          className={cn(
            "h-2 rounded-full transition-all",
            i === index ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
          )}
        />
      ))}
    </div>
  );

  // Style 5: split — image panel next to a solid content panel
  if (style === "split") {
    const active = slides[index];
    return (
      <section className="grid gap-0 overflow-hidden rounded-xl border md:grid-cols-2">
        <div className="relative min-h-[260px] md:min-h-[360px]">
          {slides.map((s, i) => (
            <img
              key={i}
              src={s.src}
              alt={`${title} — ${s.label}`}
              width={1600}
              height={900}
              loading={i === 0 ? "eager" : "lazy"}
              className={cn(
                "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
                i === index ? "opacity-100" : "opacity-0"
              )}
            />
          ))}
          <div className="absolute bottom-3 left-3 z-10 rounded bg-black/50 px-2 py-1 text-[11px] text-white">
            {active.label}
          </div>
          {Arrows}
        </div>
        <div className="flex flex-col justify-center gap-2 bg-foreground p-6 md:p-10">
          <div className="[&_*]:!text-primary-foreground">{Caption}</div>
        </div>
      </section>
    );
  }

  // Style 4: thumbs — large stage with a thumbnail rail
  if (style === "thumbs") {
    return (
      <section className="space-y-3">
        <div className="relative overflow-hidden rounded-xl border">
          <div className="relative h-[280px] md:h-[420px]">
            {slides.map((s, i) => (
              <img
                key={i}
                src={s.src}
                alt={`${title} — ${s.label}`}
                width={1600}
                height={900}
                loading={i === 0 ? "eager" : "lazy"}
                className={cn(
                  "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
                  i === index ? "opacity-100" : "opacity-0"
                )}
              />
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-10">{Caption}</div>
          {Arrows}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {slides.map((s, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Show ${s.label}`}
              className={cn(
                "h-16 w-24 shrink-0 overflow-hidden rounded-md border-2 transition-all",
                i === index ? "border-primary opacity-100" : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <img src={s.src} alt={s.label} loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </section>
    );
  }

  // Style 3: kenburns — slow zoom with centered caption
  if (style === "kenburns") {
    return (
      <section className="relative overflow-hidden rounded-xl border">
        <div className="relative h-[300px] md:h-[440px]">
          {slides.map((s, i) => (
            <div
              key={i}
              className={cn(
                "absolute inset-0 transition-opacity duration-1000",
                i === index ? "opacity-100" : "opacity-0"
              )}
            >
              <img
                src={s.src}
                alt={`${title} — ${s.label}`}
                width={1600}
                height={900}
                loading={i === 0 ? "eager" : "lazy"}
                className={cn(
                  "h-full w-full object-cover transition-transform duration-[6000ms] ease-out",
                  i === index ? "scale-110" : "scale-100"
                )}
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <div className="[&_h2]:mx-auto [&_p]:mx-auto">{Caption}</div>
        </div>
        {Dots}
      </section>
    );
  }

  // Style 2: slide — horizontal track
  if (style === "slide") {
    return (
      <section className="relative overflow-hidden rounded-xl border">
        <div
          className="flex h-[280px] md:h-[420px] transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((s, i) => (
            <div key={i} className="relative h-full w-full shrink-0">
              <img
                src={s.src}
                alt={`${title} — ${s.label}`}
                width={1600}
                height={900}
                loading={i === 0 ? "eager" : "lazy"}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent" />
            </div>
          ))}
        </div>
        <div className="absolute inset-y-0 left-0 flex items-center p-6 md:p-12">{Caption}</div>
        {Arrows}
        {Dots}
      </section>
    );
  }

  // Style 1: fade
  return (
    <section className="relative overflow-hidden rounded-xl border">
      <div className="relative h-[280px] md:h-[420px]">
        {slides.map((s, i) => (
          <img
            key={i}
            src={s.src}
            alt={`${title} — ${s.label}`}
            width={1600}
            height={900}
            loading={i === 0 ? "eager" : "lazy"}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-1000",
              i === index ? "opacity-100" : "opacity-0"
            )}
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
      <div className="absolute inset-x-0 bottom-0 p-6 md:p-10">{Caption}</div>
      {Arrows}
      {Dots}
    </section>
  );
};

export default MassHeroCarousel;
