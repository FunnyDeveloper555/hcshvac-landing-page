import heroFallback from "@/assets/amerce/hvac-hero.jpg";

interface AmerceOrganicHeroProps {
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

/**
 * Hero built on the Amerce "home-organic" slideshow layout:
 * full-bleed image, small sub text, large display title, white CTA button.
 */
const AmerceOrganicHero = ({
  companyName,
  title,
  tagline,
  description,
  heroImageUrl,
  phone,
  city,
  state,
  onPrimaryCta,
}: AmerceOrganicHeroProps) => {
  const location = [city, state].filter(Boolean).join(", ");
  const image = heroImageUrl || heroFallback;

  return (
    <div className="tf-slideshow tf-btn-swiper-main">
      <div className="slideshow-wrap" style={{ position: "relative" }}>
        <div className="sld_image">
          <img
            width={1920}
            height={810}
            loading="eager"
            decoding="async"
            src={image}
            alt={`${companyName} heating and cooling`}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              background:
                "linear-gradient(180deg, rgba(10,14,20,0.15) 0%, rgba(10,14,20,0.55) 55%, rgba(10,14,20,0.8) 100%)",
            }}
          />
        </div>
        <div className="sld_content pst-3">
          <div className="container">
            <div className="content-sld_wrap">
              <div className="heading">
                <p className="sub-text_sld text-body-1 text-white fade-item fade-item-1 mb-15">
                  {description || tagline || `Comfort you can count on${location ? ` in ${location}` : ""}.`}
                </p>
                <p className="title_sld text-display fw-medium text-white fade-item fade-item-2">
                  {title || `Heating & Cooling, Done Right`}
                </p>
              </div>
              <div className="fade-item fade-item-3 d-flex flex-wrap gap-3">
                <button type="button" className="tf-btn btn-white" onClick={onPrimaryCta}>
                  Book a Service
                </button>
                {phone && (
                  <a
                    href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
                    className="tf-btn"
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

export default AmerceOrganicHero;
