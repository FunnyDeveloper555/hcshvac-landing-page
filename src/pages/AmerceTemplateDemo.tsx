import { useState } from "react";
import AmerceShell from "@/components/amerce/AmerceShell";
import AmerceHeader from "@/components/amerce/AmerceHeader";
import AmerceHero from "@/components/amerce/AmerceHero";
import AmerceServices from "@/components/amerce/AmerceServices";
import AmerceFooter from "@/components/amerce/AmerceFooter";

/**
 * Public showcase of the Amerce theme, served on template.hcshvac.com.
 * Uses demo content only — no company record required.
 */
const NAV_ITEMS = [
  { key: "about-us", label: "About Us" },
  { key: "services", label: "Services" },
  { key: "residential", label: "Residential" },
  { key: "commercial", label: "Commercial" },
  { key: "air-quality", label: "Air Quality" },
  { key: "financing", label: "Financing" },
];

const DEMO_SERVICES = [
  { id: "d1", title: "Heating Installation", description: "High-efficiency furnaces, boilers and heat pumps installed by certified technicians.", icon: "" },
  { id: "d2", title: "Air Conditioning", description: "Central air, ductless mini-splits and full system replacements.", icon: "" },
  { id: "d3", title: "Indoor Air Quality", description: "Filtration, UV purification, humidifiers and duct cleaning.", icon: "" },
  { id: "d4", title: "Preventive Maintenance", description: "Seasonal tune-ups and service agreements that keep systems running.", icon: "" },
  { id: "d5", title: "Emergency Repair", description: "24/7 diagnostics and same-day repair for heating and cooling failures.", icon: "" },
  { id: "d6", title: "Plumbing Services", description: "Water heaters, sump pumps, drain lines and fixture replacements.", icon: "" },
];

const PAGE_COPY: Record<string, { title: string; body: string }> = {
  "about-us": { title: "About Us", body: "This is a demonstration of the Amerce theme layout used for company websites. Real content is pulled from each company profile." },
  services: { title: "Services", body: "Every service card, accordion and contact block on a live company site is driven by that company's data." },
  residential: { title: "Residential", body: "Residential service page layout — heating, cooling, water heaters and indoor air quality for the home." },
  commercial: { title: "Commercial", body: "Commercial layout for rooftop units, light commercial HVAC and scheduled maintenance contracts." },
  "air-quality": { title: "Air Quality", body: "Filtration, purification and ventilation content block." },
  financing: { title: "Financing", body: "Financing and promotions page layout with approved-credit messaging." },
};

const AmerceTemplateDemo = () => {
  const [activePage, setActivePage] = useState<string | null>(null);

  const goHome = () => {
    setActivePage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const changePage = (key: string) => {
    setActivePage(key);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToContact = () => {
    setActivePage(null);
    setTimeout(() => {
      document.getElementById("template-contact")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  const page = activePage ? PAGE_COPY[activePage] : null;

  return (
    <AmerceShell brandColor="#DC4646">
      <div className="min-h-screen d-flex flex-column">
        <AmerceHeader
          companyName="Amerce Template"
          logoUrl={null}
          phone="(555) 010-2030"
          email="info@template.hcshvac.com"
          navItems={NAV_ITEMS}
          activePage={activePage || undefined}
          onPageChange={changePage}
          onGoHome={goHome}
        />

        <main className="flex-1">
          {page ? (
            <section className="flat-spacing" style={{ paddingTop: 120 }}>
              <div className="container">
                <button className="tf-btn btn-outline mb-4" onClick={goHome}>
                  ← Back to Home
                </button>
                <h2 className="mb-3">{page.title}</h2>
                <p className="text-body-1 cl-text-2">{page.body}</p>
              </div>
            </section>
          ) : (
            <>
              <AmerceHero
                companyName="Amerce Template"
                title="Heating & Cooling Done Right"
                tagline="Theme preview site"
                description="This site demonstrates the Amerce theme applied to a company website — hero, services, contact and footer sections all styled the same way as live company sites."
                heroImageUrl={null}
                phone="(555) 010-2030"
                city="Joliet"
                state="IL"
                onPrimaryCta={scrollToContact}
              />

              <AmerceServices services={DEMO_SERVICES} companyName="Amerce Template" onCta={scrollToContact} />

              <section id="template-contact" className="flat-spacing bg-surface">
                <div className="container">
                  <div className="sect-heading type-2 text-center">
                    <h3 className="s-title">Get In Touch</h3>
                    <p className="s-desc text-body-1 cl-text-2">
                      Contact blocks on live sites use each company's real phone, email and address.
                    </p>
                  </div>
                  <div className="row g-4">
                    {[
                      { label: "Phone", value: "(555) 010-2030" },
                      { label: "Email", value: "info@template.hcshvac.com" },
                      { label: "Hours", value: "Mon – Sat, 7am – 7pm" },
                    ].map((item) => (
                      <div className="col-lg-4" key={item.label}>
                        <div className="p-4 rounded-20 bg-white h-100 text-center">
                          <h6 className="mb-2">{item.label}</h6>
                          <p className="cl-text-2 mb-0">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </>
          )}
        </main>

        <AmerceFooter
          companyName="Amerce Template"
          logoUrl={null}
          phone="(555) 010-2030"
          email="info@template.hcshvac.com"
          address="123 Demo Street"
          city="Joliet"
          state="IL"
          zip="60431"
          serviceAreas={["Joliet", "Naperville", "Plainfield", "Aurora"]}
          navItems={NAV_ITEMS}
          onPageChange={changePage}
        />
      </div>
    </AmerceShell>
  );
};

export default AmerceTemplateDemo;
