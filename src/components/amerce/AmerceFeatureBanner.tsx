import imgInstall from "@/assets/amerce/hvac-install.jpg";
import imgService from "@/assets/amerce/hvac-service.jpg";

interface AmerceFeatureBannerProps {
  companyName: string;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  onCta?: () => void;
}

/** Editorial banner block from the Amerce "home-construction" arrival section. */
const AmerceFeatureBanner = ({ companyName, city, state, phone, onCta }: AmerceFeatureBannerProps) => {
  const location = [city, state].filter(Boolean).join(", ");

  return (
    <section className="section-thumbs-arrival style-2 flat-spacing">
      <div className="container-full">
        <div className="tf-grid-layout xl-col-3 md-col-2 gap-15">
          <div className="content order-1 order-md-0">
            <div className="heading">
              <p className="h6">COMFORT DONE RIGHT</p>
              <h1>Built For Every Season</h1>
              <p className="text-body-1 cl-text-2">
                {companyName} installs and maintains high-efficiency heating and cooling systems
                {location ? ` across ${location}` : ""} — with upfront pricing, clean workmanship and
                same-day emergency response.
              </p>
            </div>
            <div className="d-flex flex-wrap gap-3 mt-4">
              <button type="button" className="tf-btn animate-btn" onClick={onCta}>
                Schedule Now
              </button>
              {phone && (
                <a href={`tel:${phone.replace(/[^0-9+]/g, "")}`} className="tf-btn btn-white animate-btn animate-dark">
                  {phone}
                </a>
              )}
            </div>
          </div>
          <div className="hover-img4">
            <div className="img-style4 w-100 h-100">
              <img
                className="img-cove"
                width={580}
                height={580}
                loading="lazy"
                decoding="async"
                src={imgInstall}
                alt="Technician at work"
              />
            </div>
          </div>
          <div className="hover-img4 d-none d-xl-block">
            <div className="img-style4 w-100 h-100">
              <img
                className="img-cove"
                width={580}
                height={580}
                loading="lazy"
                decoding="async"
                src={imgService}
                alt="Equipment install"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AmerceFeatureBanner;
