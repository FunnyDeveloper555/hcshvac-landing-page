import imgInstall from "@/assets/amerce/hvac-install.jpg";

interface AmerceOrganicPromoProps {
  companyName: string;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  onCta?: () => void;
}

const POINTS = [
  "Licensed, insured & background-checked technicians",
  "Upfront flat-rate pricing with free estimates",
  "Same-day repairs on most heating & cooling systems",
  "Financing options on new installations",
];

/** "banner-product-single style-3" promo band from the Amerce home-organic page. */
const AmerceOrganicPromo = ({ companyName, city, state, phone, onCta }: AmerceOrganicPromoProps) => {
  const location = [city, state].filter(Boolean).join(", ");

  return (
    <section className="flat-spacing bg-main">
      <div className="container">
        <div className="row align-items-center g-4">
          <div className="col-lg-6">
            <div className="img-style rounded-20 overflow-hidden">
              <img
                loading="lazy"
                src={imgInstall}
                alt={`${companyName} technicians at work`}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
          </div>
          <div className="col-lg-6">
            <div className="ps-lg-4">
              <p className="s-desc cl-text-3 fw-semibold mb-8 text-uppercase">Why homeowners choose us</p>
              <h3 className="s-title mb-3">
                {companyName}
                {location ? ` — serving ${location}` : ""}
              </h3>
              <p className="text-body-1 cl-text-2 mb-4">
                From emergency no-heat calls to full system replacements, our team keeps your home comfortable
                year-round with honest workmanship and clear pricing.
              </p>
              <ul className="list-unstyled mb-4">
                {POINTS.map((point) => (
                  <li key={point} className="d-flex align-items-start gap-2 mb-2">
                    <i className="icon-CheckCircle fs-20" style={{ color: "var(--primary)" }} />
                    <span className="cl-text-2">{point}</span>
                  </li>
                ))}
              </ul>
              <div className="d-flex flex-wrap gap-3">
                <button type="button" className="tf-btn animate-btn" onClick={onCta}>
                  Schedule Service
                </button>
                {phone && (
                  <a
                    href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
                    className="tf-btn btn-outline animate-btn"
                  >
                    Call {phone}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AmerceOrganicPromo;
