import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import ProductImageLightbox from "@/components/ProductImageLightbox";
import ProductReviews from "@/components/ProductReviews";
import ProductDocuments from "@/components/ProductDocuments";
import ReviewSubmitForm from "@/components/ReviewSubmitForm";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [relatedStart, setRelatedStart] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ["public-product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, brands(name), companies(name)")
        .eq("id", id!)
        .in("status", ["active_showing", "discontinued_showing"] as any)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch curated recommendations, fallback to random
  const { data: relatedProducts = [] } = useQuery({
    queryKey: ["related-products-public", id],
    queryFn: async () => {
      const { data: recs, error: recError } = await supabase
        .from("product_recommendations")
        .select("recommended_product_id, display_order, products!product_recommendations_recommended_product_id_fkey(*, brands(name))")
        .eq("product_id", id!)
        .eq("is_active", true)
        .order("display_order");
      if (!recError && recs && recs.length > 0) {
        return recs.map((r: any) => r.products).filter(Boolean);
      }
      const { data, error } = await supabase
        .from("products")
        .select("*, brands(name)")
        .eq("is_published", true)
        .neq("id", id!)
        .limit(3);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const images = (product?.spot_images as string[] | null) || [];

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setSelectedImage((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length]);

  useEffect(() => {
    setSelectedImage(0);
    setRelatedStart(0);
  }, [id]);

  const goToPrev = useCallback(() => {
    setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const goToNext = useCallback(() => {
    setSelectedImage((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const visibleCount = 3;
  const canSlideLeft = relatedStart > 0;
  const canSlideRight = relatedStart + visibleCount < relatedProducts.length;
  const visibleRelated = relatedProducts.slice(relatedStart, relatedStart + visibleCount);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-24 pb-16 container mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="grid md:grid-cols-2 gap-8">
              <div className="aspect-square bg-muted rounded-xl" />
              <div className="space-y-4">
                <div className="h-10 w-3/4 bg-muted rounded" />
                <div className="h-6 w-1/2 bg-muted rounded" />
                <div className="h-32 bg-muted rounded" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-24 pb-16 container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Product Not Found</h1>
          <Button variant="outline" onClick={() => navigate("/products")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Products
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/products")} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Products
          </Button>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Image Slider */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-muted border border-border group">
                {images.length > 0 ? (
                  <>
                    <img
                      src={images[selectedImage]}
                      alt={product.product_name}
                      className="w-full h-full object-cover transition-opacity duration-500 cursor-pointer"
                      onClick={() => setLightboxIndex(selectedImage)}
                    />
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={goToPrev}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-background"
                        >
                          <ChevronLeft className="w-5 h-5 text-foreground" />
                        </button>
                        <button
                          onClick={goToNext}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-background"
                        >
                          <ChevronRight className="w-5 h-5 text-foreground" />
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {images.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setSelectedImage(i)}
                              className={`w-2 h-2 rounded-full transition-all ${
                                selectedImage === i
                                  ? "bg-primary w-4"
                                  : "bg-background/70 hover:bg-background"
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No Image Available
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === i ? "border-primary" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{product.product_name}</h1>
                {product.category && (
                  <span className="inline-block mt-2 text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
                    {product.category}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {(product.brands as any)?.name && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-medium">Brand:</span>
                    <span className="text-foreground">{(product.brands as any).name}</span>
                  </div>
                )}
                {product.weight != null && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-medium">Weight:</span>
                    <span className="text-foreground">{product.weight} lbs</span>
                  </div>
                )}
                {product.stick_count != null && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-medium">Stick Count:</span>
                    <span className="text-foreground">{product.stick_count}</span>
                  </div>
                )}
              </div>

              {product.spot_text && (
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-2">Description</h2>
                  <p className="text-muted-foreground whitespace-pre-wrap">{product.spot_text}</p>
                </div>
              )}

              {/* Documents & Downloads */}
              <ProductDocuments productId={id!} />
            </div>
          </div>

          {/* Related Products with slider */}
          {relatedProducts.length > 0 && (
            <div className="mt-16 border-t border-border pt-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">You May Also Like</h2>
                {relatedProducts.length > visibleCount && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRelatedStart((s) => Math.max(0, s - 1))}
                      disabled={!canSlideLeft}
                      className="p-2 rounded-full border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setRelatedStart((s) => Math.min(relatedProducts.length - visibleCount, s + 1))}
                      disabled={!canSlideRight}
                      className="p-2 rounded-full border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {visibleRelated.map((rp: any) => {
                  const rpImages = rp.spot_images as string[] | null;
                  const thumb = rpImages?.[0];
                  return (
                    <div
                      key={rp.id}
                      onClick={() => navigate(`/products/${rp.id}`)}
                      className="group cursor-pointer rounded-xl border border-border bg-card overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300"
                    >
                      <div className="aspect-[4/3] bg-muted overflow-hidden">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={rp.product_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="p-4 space-y-2">
                        <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {rp.product_name}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          {rp.category && (
                            <span className="text-xs bg-accent text-accent-foreground px-2.5 py-0.5 rounded-full font-medium">
                              {rp.category}
                            </span>
                          )}
                          {(rp.brands as any)?.name && (
                            <span className="text-xs text-muted-foreground">{(rp.brands as any).name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Product Reviews */}
          <ProductReviews productId={id!} />
          <ReviewSubmitForm productId={id!} />
        </div>
      </main>
      {lightboxIndex !== null && (
        <ProductImageLightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          alt={product.product_name}
        />
      )}
      <Footer />
    </div>
  );
};

export default ProductDetail;
