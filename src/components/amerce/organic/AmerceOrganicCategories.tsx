import imgHero from "@/assets/amerce/hvac-hero.jpg";
import imgInstall from "@/assets/amerce/hvac-install.jpg";
import imgService from "@/assets/amerce/hvac-service.jpg";

interface ServiceItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface AmerceOrganicCategoriesProps {
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

/** Circular category tiles from the Amerce "home-organic" categories section. */
const AmerceOrganicCategories = ({ services, onSelect }: AmerceOrganicCategoriesProps) => {
  const items = (services.length > 0 ? services : FALLBACK).slice(0, 10);

  return (
    <section className="flat-spacing">
      <div className="container">
        <div className="row g-4 justify-content-center">
          {items.map((item, i) => (
            <div className="col-4 col-md-3 col-xl-2" key={item.id}>
              <button
                type="button"
                onClick={onSelect}
                className="category-v02 hover-img w-100 bg-transparent border-0 p-0"
                style={{ display: "block" }}
              >
                <div
                  className="cate-image img-style rounded-circle overflow-hidden mx-auto"
                  style={{ width: "100%", maxWidth: 180, aspectRatio: "1 / 1" }}
                >
                  <img
                    loading="lazy"
                    src={CATE_IMAGES[i % CATE_IMAGES.length]}
                    alt={item.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </div>
                <div className="cate-content text-center mt-3">
                  <h6 className="cate_name link mb-1">{item.title}</h6>
                  <p className="cate_quantity cl-text-2 mb-0">Request service</p>
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AmerceOrganicCategories;
