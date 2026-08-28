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

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

interface MassHeroCarouselProps {
  /** Stable string (page slug) — decides the image order. */
  seed: string;
  title: string;
  kicker?: string;
  subtitle?: string;
  phone?: string | null;
  onContact?: () => void;
}

const MassHeroCarousel = ({ seed, title, kicker, subtitle, phone, onContact }: MassHeroCarouselProps) => {
  const h = useMemo(() => hash(seed || "default"), [seed]);

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

  const active = slides[index];
  const cleanPhone = phone ? phone.replace(/[^0-9+]/g, "") : "";

  return (
    <section className="grid gap-0 overflow-hidden rounded-2xl border shadow-lg md:grid-cols-2">
      {/* Left: image carousel */}
      <div className="relative min-h-[260px] md:min-h-[380px] lg:min-h-[420px]">
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

        {/* Bottom-left badge */}
        <div className="absolute bottom-4 left-4 z-10 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
          Fast local dispatch
        </div>

        {/* Slide label */}
        <div className="absolute bottom-4 right-4 z-10 hidden rounded-md bg-black/50 px-2 py-1 text-[11px] text-white sm:block">
          {active.label}
        </div>

        {/* Arrows */}
        <button
          aria-label="Previous slide"
          onClick={() => go(index - 1)}
          className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition-colors hover:bg-black/70"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          aria-label="Next slide"
          onClick={() => go(index + 1)}
          className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition-colors hover:bg-black/70"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => go(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                i === index ? "w-6 bg-white" : "w-2 bg-white/60 hover:bg-white/90"
              )}
            />
          ))}
        </div>
      </div>

      {/* Right: upfront text and CTAs */}
      <div className="flex flex-col justify-center gap-5 bg-foreground p-6 md:p-8 lg:p-10">
        {kicker && (
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary-foreground/70">
            {kicker}
          </p>
        )}

        <div className="space-y-3">
          <h2 className="text-2xl font-bold leading-tight text-primary-foreground md:text-3xl lg:text-4xl">
            {title}
          </h2>
          {subtitle && (
            <p className="text-base text-primary-foreground/85 md:text-lg">
              {subtitle}
            </p>
          )}
          <p className="text-sm leading-relaxed text-primary-foreground/70 md:text-base">
            Get same-day service from licensed technicians who know your neighborhood. Upfront pricing, no hidden fees, and work backed by a satisfaction guarantee.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          {phone && (
            <a
              href={`tel:${cleanPhone}`}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-md transition-transform hover:scale-[1.02] hover:opacity-90"
            >
              <Phone className="w-4 h-4" />
              {phone}
            </a>
          )}
          {onContact && (
            <button
              onClick={onContact}
              className="rounded-lg border-2 border-primary-foreground/30 px-5 py-3 text-sm font-bold text-primary-foreground transition-colors hover:border-primary-foreground/60 hover:bg-primary-foreground/10"
            >
              Request Service
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2 text-xs text-primary-foreground/60">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Same-day appointments
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Upfront pricing
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Licensed & insured
          </span>
        </div>
      </div>
    </section>
  );
};

export default MassHeroCarousel;
