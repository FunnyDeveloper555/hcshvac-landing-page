import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AmerceOrganicPopularProductsProps {
  companyId: string;
  onProductClick: (productId: string) => void;
  onViewAll: () => void;
}

/** "Popular Product" section from the Amerce home-organic template. */
const AmerceOrganicPopularProducts = ({
  companyId,
  onProductClick,
  onViewAll,
}: AmerceOrganicPopularProductsProps) => {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["amerce-organic-popular-products", companyId],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, product_name, category, model_number, spot_images, brands(name), product_variants(price)")
        .eq("company_id", companyId)
        .in("status", ["active_showing", "discontinued_showing"] as any)
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading || products.length === 0) return null;

  return (
    <section className="themesFlat flat-spacing">
      <div className="container">
        <div className="sect-heading type-2 has-col-right">
          <div>
            <p className="s-desc cl-text-3 fw-semibold mb-8">Customer Favorites</p>
            <h2 className="s-title mb-0 letter-space-0">Popular Product</h2>
          </div>
          <div className="col-right">
            <button type="button" className="tf-btn-line-2 py-4 style-primary" onClick={onViewAll}>
              <span className="fw-semibold">View All Products</span>
            </button>
          </div>
        </div>

        <div className="row g-3 mt-3">
          {products.slice(0, 4).map((p: any) => {
            const image = (p.spot_images as string[] | null)?.[0];
            const price = p.product_variants?.[0]?.price;
            return (
              <div className="col-6 col-xl-3" key={p.id}>
                <div
                  className="card-product h-100"
                  onClick={() => onProductClick(p.id)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="card-product_wrapper img-style rounded-16 overflow-hidden">
                    <div
                      style={{
                        aspectRatio: "3 / 4",
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
                    <span className="name-product lh-24 fw-medium d-block link-underline-text">
                      {p.product_name}
                    </span>
                    <div className="star-wrap d-flex align-items-center">
                      <i className="icon icon-Star"></i>
                      <i className="icon icon-Star"></i>
                      <i className="icon icon-Star"></i>
                      <i className="icon icon-Star"></i>
                      <i className="icon icon-Star"></i>
                    </div>
                    <div className="price-wrap">
                      {price ? (
                        <span className="price-new text-primary fw-semibold">
                          ${Number(price).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-caption-01 cl-text-2">Call for pricing</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AmerceOrganicPopularProducts;
