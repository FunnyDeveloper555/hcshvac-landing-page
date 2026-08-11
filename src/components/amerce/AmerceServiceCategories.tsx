import imgHero from "@/assets/amerce/hvac-hero.jpg";
import imgInstall from "@/assets/amerce/hvac-install.jpg";
import imgService from "@/assets/amerce/hvac-service.jpg";

interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface AmerceServiceCategoriesProps {
  services: ServiceItem[];
  onSelect?: () => void;
}

const CATE_IMAGES = [imgInstall, imgService, imgHero];


const FALLBACK: ServiceItem[] = [
  { id: "c1", title: "Furnace Repair", description: "", icon: "" },
  { id: "c2", title: "AC Installation", description: "", icon: "" },
  { id: "c3", title: "Heat Pumps", description: "", icon: "" },
  { id: "c4", title: "Ductwork", description: "", icon: "" },
  { id: "c5", title: "Air Quality", description: "", icon: "" },
];

/** Category tiles from the Amerce "home-construction" categories section. */
const AmerceServiceCategories = ({ services, onSelect }: AmerceServiceCategoriesProps) => {
  const items = (services.length > 0 ? services : FALLBACK).slice(0, 10);

  return (
    <section className="themesFlat flat-spacing">
      <div className="container">
        <div className="sect-heading type-2 text-center">
          <h3 className="s-title">What We Work On</h3>
          <p className="s-desc text-body-1 cl-text-2">
            Heating, cooling and air quality equipment installed, serviced and repaired by licensed technicians.
          </p>
        </div>

        <div className="tf-grid-layout xl-col-5 lg-col-4 md-col-3 sm-col-3 col-2 gap-15">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={onSelect}
              className="category-v04 hover-img bg-transparent border-0 p-0 text-start"
            >
              <div className="cate-image img-style">
                <img loading="lazy" width={240} height={180} src={CATE_IMAGES[i % CATE_IMAGES.length]} alt={item.title} />
              </div>
              <div className="cate-content text-center">
                <div className="h5 cate_name link-underline-text">{item.title}</div>
                <p className="cate_quantity text-caption-01 cl-text-2 mb-0">Request service</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AmerceServiceCategories;
