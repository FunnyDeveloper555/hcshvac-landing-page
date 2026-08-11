import type { AmerceNavItem } from "./AmerceHeader";

interface AmerceFooterProps {
  companyName: string;
  logoUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  serviceAreas?: string[] | null;
  navItems: AmerceNavItem[];
  onPageChange: (key: string) => void;
  /** "dark" matches footer-s5 (construction), "light" matches footer-s6 (organic). */
  variant?: "dark" | "light";
}

const TRUST_ITEMS = [
  { icon: "icon-Headset", title: "24/7 Emergency Service", text: "Someone answers, day or night." },
  { icon: "icon-SealCheck", title: "Licensed & Insured", text: "Certified, background-checked techs." },
  { icon: "icon-SealPercent", title: "Upfront Pricing", text: "Free estimates, no surprise fees." },
  { icon: "icon-ArrowUDownLeft", title: "Satisfaction Guaranteed", text: "Workmanship backed in writing." },
];

const AmerceFooter = ({
  companyName,
  logoUrl,
  phone,
  email,
  address,
  city,
  state,
  zip,
  serviceAreas,
  navItems,
  onPageChange,
  variant = "dark",
}: AmerceFooterProps) => {
  const isLight = variant === "light";
  const headingClass = isLight ? "footer-heading" : "footer-heading text-white";
  const textClass = isLight ? "cl-text-2" : "cl-text-3";
  const titleClass = isLight ? "h6 title mb-1" : "h6 title text-white mb-1";
  const year = new Date().getFullYear();
  const cityLine = [city, state, zip].filter(Boolean).join(", ");
  const fullAddress = [address, cityLine].filter(Boolean).join(", ");
  const areas = (serviceAreas || []).filter(Boolean);
  const midpoint = Math.ceil(navItems.length / 2);
  const colA = navItems.slice(0, midpoint);
  const colB = navItems.slice(midpoint);

  return (
    <footer className={isLight ? "tf-footer footer-s5 bg-white" : "tf-footer footer-s5 bg-dark"}>
      {/* Trust strip */}
      <div className="flat-spacing-4">
        <div className="container">
          <div className="row g-4">
            {TRUST_ITEMS.map((item) => (
              <div className="col-lg-3 col-sm-6" key={item.title}>
                <div className="box-icon_V01 style-3 d-flex align-items-start gap-3">
                  <span className={isLight ? "icon" : "icon text-white"}>
                    <i className={item.icon} />
                  </span>
                  <div className="content">
                    <div className={titleClass}>{item.title}</div>
                    <p className={`text ${textClass} mb-0`}>{item.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="position-relative">
        <div className={isLight ? "br-line fake-class top-0" : "br-line fake-class top-0 bg-white_10"} />
        <div className="container">
          <div className="footer-inner flat-spacing">
            {/* Left: office / contact */}
            <div className="col-left">
              <div className={`footer-col-block ${isLight ? "" : "type-white "}footer-wrap-start d-flex flex-column`}>
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={companyName}
                    style={{
                      height: 40,
                      maxHeight: 40,
                      width: "auto",
                      maxWidth: 200,
                      objectFit: "contain",
                    }}
                    className="mb-3 d-block"
                  />
                ) : null}
                <p className={headingClass}>OUR OFFICE</p>
                <p className={`${textClass} mb-3`}>24/7 dispatch &amp; emergency service:</p>
                {phone && (
                  <a
                    href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
                    className={isLight ? "link h4 fw-medium d-block mb-12" : "text-white link h4 fw-medium d-block mb-12"}
                  >
                    {phone}
                  </a>
                )}
                {fullAddress && (
                  <a
                    href={`https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`${textClass} link d-block mb-3`}
                  >
                    {fullAddress}
                  </a>
                )}
                {email && (
                  <a href={`mailto:${email}`} className={`${textClass} link d-block`}>
                    {email}
                  </a>
                )}
              </div>
            </div>

            <div className="br-line type-vertical" />

            {/* Center: link columns */}
            <div className="col-center">
              <div className="footer-link-list">
                <div className={`footer-col-block ${isLight ? "" : "type-white "}footer-wrap-2`}>
                  <p className={headingClass}>COMPANY</p>
                  <ul className="footer-menu-list list-unstyled mb-0">
                    {colA.map((item) => (
                      <li key={item.key} className="mb-2">
                        <button
                          type="button"
                          className={`${textClass} link bg-transparent border-0 p-0 text-start`}
                          onClick={() => onPageChange(item.key)}
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={`footer-col-block ${isLight ? "" : "type-white "}footer-wrap-3`}>
                  <p className={headingClass}>SERVICES</p>
                  <ul className="footer-menu-list list-unstyled mb-0">
                    {colB.map((item) => (
                      <li key={item.key} className="mb-2">
                        <button
                          type="button"
                          className={`${textClass} link bg-transparent border-0 p-0 text-start`}
                          onClick={() => onPageChange(item.key)}
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {areas.length > 0 && (
                  <div className={`footer-col-block ${isLight ? "" : "type-white "}footer-wrap-4`}>
                    <p className={headingClass}>SERVICE AREA</p>
                    <ul className="footer-menu-list list-unstyled mb-0">
                      {areas.slice(0, 6).map((area) => (
                        <li key={area} className={`${textClass} mb-2`}>
                          {area}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="br-line type-vertical" />

            {/* Right: hours + CTA */}
            <div className="col-right">
              <div className={`footer-col-block ${isLight ? "" : "type-white "}footer-wrap-end`}>
                <p className={headingClass}>HOURS &amp; SUPPORT</p>
                <p className={`footer-desc ${textClass} mb-16`}>
                  Monday – Friday: 8:00 AM – 6:00 PM
                  <br />
                  Saturday: 9:00 AM – 3:00 PM
                  <br />
                  Emergency service: available 24/7
                </p>
                {phone && (
                  <a
                    href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
                    className={isLight ? "tf-btn animate-btn" : "tf-btn btn-white animate-btn animate-dark"}
                    style={
                      isLight
                        ? {
                            backgroundColor: "var(--primary)",
                            borderColor: "var(--primary)",
                            color: "#fff",
                          }
                        : undefined
                    }
                  >
                    Call {companyName}
                  </a>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={isLight ? "footer-bottom border-top" : "footer-bottom border-top border-white_10"}>
        <div className="container">
          <div className="inner-bottom d-flex flex-wrap align-items-center justify-content-between gap-2 py-3">
            <p className={`text-caption-01 ${textClass} mb-0`}>
              &copy; {year} {companyName}. All rights reserved.
            </p>
            <p className={`text-caption-01 ${textClass} mb-0`}>Licensed &amp; Insured · EPA Certified</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AmerceFooter;
