import { Wrench } from "lucide-react";

interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface AmerceServicesProps {
  services: ServiceItem[];
  companyName: string;
  onCta?: () => void;
}

const FALLBACK_SERVICES: ServiceItem[] = [
  { id: "f1", title: "Heating", description: "Furnace and heat pump installation, repair and tune-ups.", icon: "" },
  { id: "f2", title: "Cooling", description: "Air conditioning installation, repair and seasonal maintenance.", icon: "" },
  { id: "f3", title: "Air Quality", description: "Filtration, humidifiers and duct cleaning for healthier air.", icon: "" },
];

const AmerceServices = ({ services, companyName, onCta }: AmerceServicesProps) => {
  const items = services.length > 0 ? services : FALLBACK_SERVICES;

  return (
    <section className="themesFlat flat-spacing">
      <div className="container">
        <div className="sect-heading type-2 text-center">
          <h3 className="s-title">Our Services</h3>
          <p className="s-desc text-body-1 cl-text-2">
            Professional heating, cooling and air quality service from {companyName}.
          </p>
        </div>

        <div className="row g-4">
          {items.map((service) => (
            <div className="col-lg-4 col-sm-6" key={service.id}>
              <div className="tf-icon-box h-100 p-4 rounded-20 bg-surface">
                <div className="icon mb-3">
                  <Wrench size={24} style={{ color: "var(--primary)" }} />
                </div>
                <div className="h5 mb-2">{service.title}</div>
                <p className="text-body-2 cl-text-2 mb-0">{service.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-5">
          <button type="button" className="tf-btn animate-btn" onClick={onCta}>
            Request Service
          </button>
        </div>
      </div>
    </section>
  );
};

export default AmerceServices;
