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
  city?: string | null;
  state?: string | null;
  navItems: AmerceNavItem[];
  activePage?: string;
  onPageChange: (key: string) => void;
  onGoHome: () => void;
  /** Override top bar background (e.g. active campaign theme primary color). */
  barColor?: string | null;
}

const AmerceHeader = ({
  companyName,
  logoUrl,
  phone,
  email,
  city,
  state,
  navItems,
  activePage,
  onPageChange,
  onGoHome,
  barColor,
}: AmerceHeaderProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = [city, state].filter(Boolean).join(", ");

  const messages = [
    "24/7 Emergency Heating & Cooling Service — Same Day Appointments",
    phone ? `Call ${phone} for a free estimate` : "Free estimates on new system installations",
    location ? `Proudly serving ${location} and surrounding areas` : "Licensed, bonded & insured technicians",
  ];
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setMsgIndex((i) => (i + 1) % messages.length), 4000);
    return () => clearInterval(timer);
  }, [messages.length]);

  useEffect(() => {
    setMobileOpen(false);
  }, [activePage]);

  return (
    <>
      {/* Top bar — single row */}
      <div className="tf-topbar bg-dark" style={barColor ? { backgroundColor: barColor } : undefined}>
        <div className="container">
          <div className="topbar-inner d-flex align-items-center justify-content-between py-2 gap-16 flex-nowrap">
            <span
              className="text-caption-01 text-white mb-0 d-none d-lg-inline-flex align-items-center"
              style={{ whiteSpace: "nowrap" }}
            >
              <Clock size={14} style={{ display: "inline-block", marginRight: 6, flex: "0 0 auto" }} />
              24/7 Emergency Service
            </span>

            <span
              className="text-caption-01 text-white mb-0 text-truncate flex-grow-1 text-center"
              style={{ minWidth: 0 }}
            >
              {messages[msgIndex]}
            </span>

            <div className="d-flex align-items-center gap-24 flex-nowrap">
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="text-caption-01 cl-text-3 link d-none d-md-inline-flex align-items-center"
                  style={{ whiteSpace: "nowrap" }}
                >
                  <Mail size={14} style={{ display: "inline-block", marginRight: 6, flex: "0 0 auto" }} />
                  {email}
                </a>
              )}
              {phone && (
                <a
                  href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
                  className="text-caption-01 text-white link d-inline-flex align-items-center"
                  style={{ whiteSpace: "nowrap" }}
                >
                  <Phone size={14} style={{ display: "inline-block", marginRight: 6, flex: "0 0 auto" }} />
                  {phone}
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
                    <img src={logoUrl} alt={companyName} height={56} style={{ maxHeight: 56, width: "auto" }} />
                  ) : null}
                  <span className="fw-bold mb-0 text-start" style={{ fontSize: "1.125rem", lineHeight: 1.3 }}>
                    {companyName}
                  </span>
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
