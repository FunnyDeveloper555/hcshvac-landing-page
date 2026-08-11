import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AmerceTopProductsProps {
  companyId: string;
  onProductClick: (productId: string) => void;
  onViewAll: () => void;
}

const ALL_TAB = "All";

/** "Top Picks This Week" section from the Amerce theme, rebuilt as "Top Products". */
const AmerceTopProducts = ({ companyId, onProductClick, onViewAll }: AmerceTopProductsProps) => {
  const [activeTab, setActiveTab] = useState<string>(ALL_TAB);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["amerce-top-products", companyId],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, product_name, category, model_number, spot_images, brands(name), product_variants(price)")
        .eq("company_id", companyId)
        .in("status", ["active_showing", "discontinued_showing"] as any)
        .order("display_order", { ascending: true })
        .limit(40);
      if (error) throw error;
      return data ?? [];
    },
  });

  const tabs = useMemo(() => {
    const cats = Array.from(
      new Set(products.map((p: any) => p.category).filter(Boolean) as string[])
    ).slice(0, 4);
    return [ALL_TAB, ...cats];
  }, [products]);

  const visible = useMemo(() => {
    const list =
      activeTab === ALL_TAB
        ? products
        : products.filter((p: any) => p.category === activeTab);
    return list.slice(0, 8);
  }, [products, activeTab]);

  if (isLoading || products.length === 0) return null;

  return (
    <section className="themesFlat flat-spacing section-top-pick-v02">
      <div className="container">
        <div className="sect-heading type-2 has-col-right">
          <div>
            <h3 className="s-title">Top Products</h3>
            <p className="s-desc text-body-1 cl-text-2">
              Our most requested heating and cooling equipment, hand picked by our technicians.
            </p>
          </div>
          <div className="col-right overflow-auto">
            <ul className="tab-btn-wrap-v2 d-flex align-items-center gap-2 list-unstyled mb-0" role="tablist">
              {tabs.map((tab) => (
                <li className="nav-tab-item" role="presentation" key={tab}>
                  <button
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`tf-btn-tab ${activeTab === tab ? "active" : ""}`}
                  >
                    <span className="fw-semibold">{tab}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="row g-3 mt-3">
          {visible.map((p: any) => {
            const image = (p.spot_images as string[] | null)?.[0];
            const price = p.product_variants?.[0]?.price;
            return (
              <div className="col-6 col-md-4 col-xl-3" key={p.id}>
                <div
                  className="card-product product-style_stroke h-100"
                  onClick={() => onProductClick(p.id)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="card-product_wrapper square img-style rounded-16 overflow-hidden">
                    <div
                      style={{
                        aspectRatio: "1 / 1",
                        background: "var(--surface-2, #f5f5f5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {image ? (
                        <img
                          className="img-product"
                          loading="lazy"
                          src={image}
                          alt={p.product_name}
                          style={{ width: "100%", height: "100%", objectFit: "contain" }}
                        />
                      ) : (
                        <span className="text-caption-01 cl-text-2">No Image</span>
                      )}
                    </div>
                  </div>
                  <div className="card-product_info pt-3">
                    {p.brands?.name && (
                      <p className="text-caption-01 cl-text-2 mb-1">{p.brands.name}</p>
                    )}
                    <span className="name-product link fw-semibold d-block">{p.product_name}</span>
                    {p.model_number && (
                      <p className="text-caption-01 cl-text-2 mb-1">Model {p.model_number}</p>
                    )}
                    {price ? (
                      <span className="price-wrap fw-semibold">${Number(price).toLocaleString()}</span>
                    ) : (
                      <span className="text-caption-01 cl-text-2">Call for pricing</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-4">
          <button type="button" className="tf-btn" onClick={onViewAll}>
            View All Products
          </button>
        </div>
      </div>
    </section>
  );
};

export default AmerceTopProducts;
