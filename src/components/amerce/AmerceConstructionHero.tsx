import heroFallback from "@/assets/amerce/hvac-hero.jpg";

interface AmerceConstructionHeroProps {
  companyName: string;
  title?: string | null;
  tagline?: string | null;
  description?: string | null;
  heroImageUrl?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  onPrimaryCta?: () => void;
}

const MARQUEE_ITEMS = [
  "24/7 EMERGENCY SERVICE",
  "LICENSED & INSURED TECHNICIANS",
  "FREE ESTIMATES ON INSTALLATIONS",
  "FINANCING OPTIONS AVAILABLE",
];

/**
 * Hero built on the Amerce "home-construction" slideshow layout:
 * marquee strip + full-bleed rounded slide with overlaid content.
 */
const AmerceConstructionHero = ({
  companyName,
  title,
  tagline,
  description,
  heroImageUrl,
  phone,
  city,
  state,
  onPrimaryCta,
}: AmerceConstructionHeroProps) => {
  const location = [city, state].filter(Boolean).join(", ");
  const image = heroImageUrl || heroFallback;

  return (
    <div className="tf-slideshow tf-btn-swiper-main">
      <div className="infiniteSlide-text-v03 mb-40">
        <div className="infiniteSlide infiniteSlide-wrapper">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((text, i) => (
            <span key={`${text}-${i}`} className="d-inline-flex align-items-center">
              <p className="text fw-medium mb-0">{text}</p>
              <i className="icon-Star2 mx-3" />
            </span>
          ))}
        </div>
      </div>

      <div className="container-full">
        <div className="slider-wrap slideshow-wrap rounded-20 overflow-hidden">
          <div className="sld_image">
            <img
              width={1770}
              height={680}
              loading="eager"
              decoding="async"
              src={image}
              alt={`${companyName} heating and cooling`}
              className="scale-item scale-item-1"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, rgba(15,17,20,0.82) 0%, rgba(15,17,20,0.62) 45%, rgba(15,17,20,0.1) 100%)",
            }}
          />
          <div className="sld_content type-4">
            <div className="content-sld_wrap">
              <h6 className="mb-12 text-white fade-item fade-item-1">
                {(tagline || `Trusted HVAC experts${location ? ` in ${location}` : ""}`).toUpperCase()}
              </h6>
              <div className="h1 mb-20 text-white fade-item fade-item-2">{title || companyName}</div>
              {description && (
                <p className="text-body-1 text-white fade-item fade-item-3 mb-32">{description}</p>
              )}
              <div className="fade-item fade-item-4 d-flex flex-wrap gap-3">
                <button type="button" className="tf-btn btn-white animate-btn animate-dark" onClick={onPrimaryCta}>
                  Book a Service
                </button>
                {phone && (
                  <a
                    href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
                    className="tf-btn animate-btn"
                    style={{ backgroundColor: "var(--primary)", borderColor: "var(--primary)", color: "#fff" }}
                  >
                    Call {phone}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AmerceConstructionHero;
