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
}: AmerceFooterProps) => {
  const year = new Date().getFullYear();
  const cityLine = [city, state, zip].filter(Boolean).join(", ");
  const fullAddress = [address, cityLine].filter(Boolean).join(", ");
  const areas = (serviceAreas || []).filter(Boolean);
  const midpoint = Math.ceil(navItems.length / 2);
  const colA = navItems.slice(0, midpoint);
  const colB = navItems.slice(midpoint);

  return (
    <footer className="tf-footer footer-s5 bg-dark">
      {/* Trust strip */}
      <div className="flat-spacing-4">
        <div className="container">
          <div className="row g-4">
            {TRUST_ITEMS.map((item) => (
              <div className="col-lg-3 col-sm-6" key={item.title}>
                <div className="box-icon_V01 style-3 d-flex align-items-start gap-3">
                  <span className="icon text-white">
                    <i className={item.icon} />
                  </span>
                  <div className="content">
                    <div className="h6 title text-white mb-1">{item.title}</div>
                    <p className="text cl-text-3 mb-0">{item.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="position-relative">
        <div className="br-line fake-class top-0 bg-white_10" />
        <div className="container">
          <div className="footer-inner flat-spacing">
            {/* Left: office / contact */}
            <div className="col-left">
              <div className="footer-col-block type-white footer-wrap-start d-flex flex-column">
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
                <p className="footer-heading text-white">OUR OFFICE</p>
                <p className="cl-text-3 mb-3">24/7 dispatch &amp; emergency service:</p>
                {phone && (
                  <a
                    href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
                    className="text-white link h4 fw-medium d-block mb-12"
                  >
                    {phone}
                  </a>
                )}
                {fullAddress && (
                  <a
                    href={`https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="cl-text-3 link d-block mb-3"
                  >
                    {fullAddress}
                  </a>
                )}
                {email && (
                  <a href={`mailto:${email}`} className="cl-text-3 link d-block">
                    {email}
                  </a>
                )}
              </div>
            </div>

            <div className="br-line type-vertical" />

            {/* Center: link columns */}
            <div className="col-center">
              <div className="footer-link-list">
                <div className="footer-col-block type-white footer-wrap-2">
                  <p className="footer-heading text-white">COMPANY</p>
                  <ul className="footer-menu-list list-unstyled mb-0">
                    {colA.map((item) => (
                      <li key={item.key} className="mb-2">
                        <button
                          type="button"
                          className="cl-text-3 link bg-transparent border-0 p-0 text-start"
                          onClick={() => onPageChange(item.key)}
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="footer-col-block type-white footer-wrap-3">
                  <p className="footer-heading text-white">SERVICES</p>
                  <ul className="footer-menu-list list-unstyled mb-0">
                    {colB.map((item) => (
                      <li key={item.key} className="mb-2">
                        <button
                          type="button"
                          className="cl-text-3 link bg-transparent border-0 p-0 text-start"
                          onClick={() => onPageChange(item.key)}
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {areas.length > 0 && (
                  <div className="footer-col-block type-white footer-wrap-4">
                    <p className="footer-heading text-white">SERVICE AREA</p>
                    <ul className="footer-menu-list list-unstyled mb-0">
                      {areas.slice(0, 6).map((area) => (
                        <li key={area} className="cl-text-3 mb-2">
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
              <div className="footer-col-block type-white footer-wrap-end">
                <p className="footer-heading text-white">HOURS &amp; SUPPORT</p>
                <p className="footer-desc cl-text-3 mb-16">
                  Monday – Friday: 8:00 AM – 6:00 PM
                  <br />
                  Saturday: 9:00 AM – 3:00 PM
                  <br />
                  Emergency service: available 24/7
                </p>
                {phone && (
                  <a
                    href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
                    className="tf-btn btn-white animate-btn animate-dark"
                  >
                    Call {companyName}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom border-top border-white_10">
        <div className="container">
          <div className="inner-bottom d-flex flex-wrap align-items-center justify-content-between gap-2 py-3">
            <p className="text-caption-01 cl-text-3 mb-0">
              &copy; {year} {companyName}. All rights reserved.
            </p>
            <p className="text-caption-01 cl-text-3 mb-0">Licensed &amp; Insured · EPA Certified</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AmerceFooter;
