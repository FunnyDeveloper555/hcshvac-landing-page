import { useEffect, useState } from "react";
import { Clock, Mail, Phone } from "lucide-react";

export interface AmerceNavItem {
  key: string;
  label: string;
}

interface AmerceHeaderProps {
  companyName: string;
  logoUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  navItems: AmerceNavItem[];
  activePage?: string;
  onPageChange: (key: string) => void;
  onGoHome: () => void;
}

const AmerceHeader = ({
  companyName,
  logoUrl,
  phone,
  email,
  navItems,
  activePage,
  onPageChange,
  onGoHome,
}: AmerceHeaderProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [activePage]);

  return (
    <>
      {/* Top bar */}
      <div className="tf-topbar bg-dark">
        <div className="container">
          <div className="topbar-inner d-flex align-items-center justify-content-between py-2 gap-16">
            <p className="text-caption-01 text-white mb-0">
              <Clock size={14} className="me-1" /> 24/7 Emergency Service
            </p>
            <div className="d-flex align-items-center gap-24">
              {email && (
                <a href={`mailto:${email}`} className="text-caption-01 cl-text-3 link d-none d-md-inline">
                  <Mail size={14} className="me-1" /> {email}
                </a>
              )}
              {phone && (
                <a href={`tel:${phone.replace(/[^0-9+]/g, "")}`} className="text-caption-01 text-white link">
                  <Phone size={14} className="me-1" /> {phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <header className="tf-header header-s3 header-fixed">
        <div className="header-inner_wrap">
          <div className="container">
            <div className="header-inner d-flex align-items-center justify-content-between gap-16">
              <div className="box-open-menu-mobile d-xl-none">
                <button
                  type="button"
                  aria-label="Open menu"
                  className="btn-open-menu bg-transparent border-0 p-0"
                  onClick={() => setMobileOpen((v) => !v)}
                >
                  <i className="icon icon-List fs-24" />
                </button>
              </div>

              <div className="header-left">
                <button
                  type="button"
                  onClick={onGoHome}
                  className="logo-site bg-transparent border-0 p-0 d-flex align-items-center gap-12"
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt={companyName} height={40} style={{ maxHeight: 40, width: "auto" }} />
                  ) : null}
                  <span className="h5 fw-bold mb-0 text-start">{companyName}</span>
                </button>
              </div>

              <nav className="box-navigation d-none d-xl-block">
                <ul className="box-nav-menu d-flex align-items-center gap-32 mb-0">
                  <li className={`menu-item ${!activePage ? "active" : ""}`}>
                    <button
                      type="button"
                      className="item-link bg-transparent border-0 p-0 fw-medium"
                      onClick={onGoHome}
                    >
                      Home
                    </button>
                  </li>
                  {navItems.map((item) => (
                    <li key={item.key} className={`menu-item ${activePage === item.key ? "active" : ""}`}>
                      <button
                        type="button"
                        className="item-link bg-transparent border-0 p-0 fw-medium"
                        onClick={() => onPageChange(item.key)}
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="header-right d-flex align-items-center gap-16">
                {phone && (
                  <a
                    href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
                    className="tf-btn animate-btn d-none d-sm-inline-flex"
                  >
                    <Phone size={16} className="me-1" /> Call Now
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="header-bottom_wrap d-xl-none border-top">
            <div className="container">
              <ul className="box-nav-menu py-3 mb-0">
                <li className="menu-item py-2">
                  <button type="button" className="item-link bg-transparent border-0 p-0 fw-medium" onClick={onGoHome}>
                    Home
                  </button>
                </li>
                {navItems.map((item) => (
                  <li key={item.key} className="menu-item py-2">
                    <button
                      type="button"
                      className="item-link bg-transparent border-0 p-0 fw-medium"
                      onClick={() => onPageChange(item.key)}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default AmerceHeader;
