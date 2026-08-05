interface AmerceHeroProps {
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

const AmerceHero = ({
  companyName,
  title,
  tagline,
  description,
  heroImageUrl,
  phone,
  city,
  state,
  onPrimaryCta,
}: AmerceHeroProps) => {
  const location = [city, state].filter(Boolean).join(", ");

  return (
    <div className="tf-slideshow">
      <div className="container-full">
        <div className="slider-wrap slideshow-wrap rounded-20 overflow-hidden position-relative">
          <div className="sld_image">
            {heroImageUrl ? (
              <img
                src={heroImageUrl}
                alt={companyName}
                width={1770}
                height={680}
                loading="eager"
                className="scale-item scale-item-1"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div style={{ width: "100%", minHeight: 520, background: "var(--bg-3)" }} />
            )}
          </div>
          <div className="sld_content type-4">
            <div className="content-sld_wrap">
              <h6 className="mb-12 text-white fade-item fade-item-1">
                {tagline || `Trusted HVAC Experts${location ? ` in ${location}` : ""}`}
              </h6>
              <div className="h1 mb-20 text-white fade-item fade-item-2">{title || companyName}</div>
              {description && (
                <p className="text-body-1 text-white fade-item fade-item-3 mb-32">{description}</p>
              )}
              <div className="d-flex flex-wrap gap-12 fade-item fade-item-4">
                <button type="button" className="tf-btn animate-btn" onClick={onPrimaryCta}>
                  Book a Service
                </button>
                {phone && (
                  <a
                    href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
                    className="tf-btn btn-white animate-btn animate-dark"
                  >
                    {phone}
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

export default AmerceHero;
