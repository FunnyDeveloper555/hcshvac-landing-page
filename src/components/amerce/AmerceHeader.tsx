import { useEffect, useState } from "react";
import { ChevronDown, Clock, Mail, Phone } from "lucide-react";

export interface AmerceNavItem {
  key: string;
  label: string;
  children?: AmerceNavItem[];
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
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<Record<string, boolean>>({});
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
                  {navItems.map((item) => {
                    const hasChildren = item.children && item.children.length > 0;
                    const isActive = activePage === item.key || item.children?.some((c) => c.key === activePage);
                    return (
                      <li
                        key={item.key}
                        className={`menu-item ${isActive ? "active" : ""} position-relative`}
                        onMouseEnter={() => hasChildren && setOpenDropdown(item.key)}
                        onMouseLeave={() => setOpenDropdown(null)}
                      >
                        <button
                          type="button"
                          className="item-link bg-transparent border-0 p-0 fw-medium d-inline-flex align-items-center gap-6"
                          onClick={() => {
                            if (hasChildren) {
                              setOpenDropdown(openDropdown === item.key ? null : item.key);
                            } else {
                              onPageChange(item.key);
                            }
                          }}
                        >
                          {item.label}
                          {hasChildren && <ChevronDown size={14} />}
                        </button>

                        {hasChildren && openDropdown === item.key && (
                          <ul
                            className="list-group position-absolute bg-white rounded-2 shadow overflow-hidden"
                            style={{ top: "calc(100% + 8px)", left: 0, minWidth: 220, zIndex: 1000 }}
                          >
                            {item.children.map((child) => (
                              <li key={child.key} className="list-group-item p-0 border-0">
                                <button
                                  type="button"
                                  className={`dropdown-item d-block w-100 text-start px-4 py-2 bg-transparent border-0 ${activePage === child.key ? "active" : ""}`}
                                  onClick={() => {
                                    onPageChange(child.key);
                                    setOpenDropdown(null);
                                  }}
                                >
                                  {child.label}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
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
                {navItems.map((item) => {
                  const hasChildren = item.children && item.children.length > 0;
                  const expanded = mobileExpanded[item.key] || false;
                  const isActive = activePage === item.key || item.children?.some((c) => c.key === activePage);
                  return (
                    <li key={item.key} className={`menu-item py-2 ${isActive ? "active" : ""}`}>
                      <div className="d-flex align-items-center justify-content-between">
                        <button
                          type="button"
                          className="item-link bg-transparent border-0 p-0 fw-medium"
                          onClick={() => {
                            if (!hasChildren) onPageChange(item.key);
                          }}
                        >
                          {item.label}
                        </button>
                        {hasChildren && (
                          <button
                            type="button"
                            className="bg-transparent border-0 p-0"
                            aria-label={expanded ? "Collapse" : "Expand"}
                            onClick={() =>
                              setMobileExpanded((prev) => ({ ...prev, [item.key]: !expanded }))
                            }
                          >
                            <ChevronDown
                              size={16}
                              style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                            />
                          </button>
                        )}
                      </div>

                      {hasChildren && expanded && (
                        <ul className="ps-4 mt-2 mb-0">
                          {item.children.map((child) => (
                            <li key={child.key} className={`menu-item py-2 ${activePage === child.key ? "active" : ""}`}>
                              <button
                                type="button"
                                className="item-link bg-transparent border-0 p-0 fw-medium"
                                onClick={() => onPageChange(child.key)}
                              >
                                {child.label}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}

      </header>
    </>
  );
};

export default AmerceHeader;
