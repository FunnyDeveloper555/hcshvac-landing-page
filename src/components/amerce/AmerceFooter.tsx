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

  return (
    <footer className="tf-footer footer-s2 bg-dark">
      <div className="position-relative">
        <div className="container">
          <div className="footer-inner flat-spacing-2">
            <div className="row g-4">
              <div className="col-lg-4">
                <div className="footer-col-block type-white">
                  {logoUrl ? (
                    <img src={logoUrl} alt={companyName} height={40} style={{ maxHeight: 40, width: "auto" }} className="mb-3" />
                  ) : null}
                  <div className="h5 text-white mb-3">{companyName}</div>
                  <p className="footer-desc cl-text-3 mb-0">
                    Licensed and insured heating, ventilation and air conditioning specialists.
                    Available 24/7 for emergency service.
                  </p>
                </div>
              </div>

              <div className="col-lg-3 col-sm-6">
                <div className="footer-col-block type-white">
                  <div className="footer-heading text-white mb-3">COMPANY</div>
                  <ul className="footer-menu-list list-unstyled mb-0">
                    {navItems.map((item) => (
                      <li key={item.key} className="mb-2">
                        <button
                          type="button"
                          className="cl-text-3 link bg-transparent border-0 p-0"
                          onClick={() => onPageChange(item.key)}
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="col-lg-2 col-sm-6">
                <div className="footer-col-block type-white">
                  <div className="footer-heading text-white mb-3">SERVICE AREA</div>
                  <ul className="footer-menu-list list-unstyled mb-0">
                    {(serviceAreas || []).slice(0, 6).map((area) => (
                      <li key={area} className="cl-text-3 mb-2">
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="col-lg-3">
                <div className="footer-col-block type-white">
                  <div className="footer-heading text-white mb-3">CONTACT</div>
                  {phone && (
                    <a
                      href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
                      className="text-white link h5 fw-medium d-block mb-2"
                    >
                      {phone}
                    </a>
                  )}
                  {email && (
                    <a href={`mailto:${email}`} className="cl-text-3 link d-block mb-2">
                      {email}
                    </a>
                  )}
                  {(address || cityLine) && (
                    <p className="cl-text-3 mb-0">
                      {address}
                      {address && cityLine ? <br /> : null}
                      {cityLine}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="footer-bottom py-3 border-top border-white_10">
            <p className="text-caption-01 cl-text-3 mb-0 text-center">
              &copy; {year} {companyName}. All rights reserved. | Licensed &amp; Insured
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AmerceFooter;
