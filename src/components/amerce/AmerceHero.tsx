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

  const background = heroImageUrl
    ? `linear-gradient(90deg, rgba(12,12,20,0.85) 0%, rgba(12,12,20,0.55) 55%, rgba(12,12,20,0.25) 100%), url("${heroImageUrl}") center/cover no-repeat`
    : "linear-gradient(120deg, var(--bg-3) 0%, rgba(0,0,0,0.85) 100%)";

  return (
    <div className="tf-slideshow">
      <div className="container-full">
        <div
          className="slideshow-wrap rounded-20 overflow-hidden d-flex align-items-center"
          style={{ background, minHeight: 560 }}
        >
          <div className="container py-5">
            <div className="row">
              <div className="col-lg-7">
                <h6 className="mb-12" style={{ color: "var(--primary)" }}>
                  {tagline || `Trusted HVAC Experts${location ? ` in ${location}` : ""}`}
                </h6>
                <div className="h1 mb-20 text-white">{title || companyName}</div>
                {description && <p className="text-body-1 text-white mb-32">{description}</p>}
                <div className="d-flex flex-wrap gap-12">
                  <button
                    type="button"
                    className="tf-btn animate-btn"
                    onClick={onPrimaryCta}
                    style={{ backgroundColor: "var(--primary)", borderColor: "var(--primary)", color: "#fff" }}
                  >
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
    </div>
  );
};

export default AmerceHero;
