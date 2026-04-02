import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import ProductImageLightbox from "@/components/ProductImageLightbox";
import ProductReviews from "@/components/ProductReviews";
import ProductDocuments from "@/components/ProductDocuments";
import ReviewSubmitForm from "@/components/ReviewSubmitForm";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CompanyProductDetailProps {
  productId: string;
  companyId?: string;
  onBack: () => void;
  onProductClick?: (productId: string) => void;
}

const CompanyProductDetail = ({ productId, companyId, onBack, onProductClick }: CompanyProductDetailProps) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [relatedStart, setRelatedStart] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ["company-product-detail", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, brands(name), companies(name)")
        .eq("id", productId)
        .in("status", ["active_showing", "discontinued_showing"] as any)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  // Fetch curated recommendations, fallback to random
  const { data: relatedProducts = [] } = useQuery({
    queryKey: ["related-products", productId, companyId],
    queryFn: async () => {
      const { data: recs, error: recError } = await supabase
        .from("product_recommendations")
        .select("recommended_product_id, display_order, products!product_recommendations_recommended_product_id_fkey(*, brands(name))")
        .eq("product_id", productId)
        .eq("is_active", true)
        .order("display_order");
      if (!recError && recs && recs.length > 0) {
        return recs.map((r: any) => r.products).filter(Boolean);
      }
      const query = supabase
        .from("products")
        .select("*, brands(name)")
        .in("status", ["active_showing", "discontinued_showing"] as any)
        .neq("id", productId)
        .limit(3);
      if (companyId) query.eq("company_id", companyId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  // Fetch product variants
  const { data: variants = [] } = useQuery({
    queryKey: ["product-variants-public", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productId)
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data || [];
    },
    enabled: !!productId,
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
    setSelectedVariant(null);
  }, [productId]);

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
    );
  }

  if (!product) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-foreground mb-4">Product Not Found</h2>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Products
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-6">
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
          {/* Status Banner */}
          {(product as any).installed_banner_text && product.status === "active_showing" && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 rounded-lg px-4 py-3">
              <p className="font-semibold">{(product as any).installed_banner_text}</p>
              {(product as any).installed_description && <p className="text-sm mt-1 opacity-90">{(product as any).installed_description}</p>}
            </div>
          )}
          {(product as any).discontinued_banner_text && product.status === "discontinued_showing" && (
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 rounded-lg px-4 py-3">
              <p className="font-semibold">{(product as any).discontinued_banner_text}</p>
              {(product as any).discontinued_description && <p className="text-sm mt-1 opacity-90">{(product as any).discontinued_description}</p>}
              {(product as any).alternative_product_statement && (
                <p className="text-sm mt-2">
                  {(product as any).alternative_product_statement}
                  {(product as any).alternative_product_url && (
                    <a href={(product as any).alternative_product_url} className="ml-1 underline font-medium hover:opacity-80" target="_blank" rel="noopener noreferrer">
                      View Alternative →
                    </a>
                  )}
                </p>
              )}
            </div>
          )}

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

          {/* Variants */}
          {variants.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">Available Options</h2>
              <div className="space-y-2">
                {variants.map((v: any) => {
                  const isSelected = selectedVariant === v.id;
                  const attrs = v.attributes as Record<string, any> | null;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(isSelected ? null : v.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-foreground">{v.variant_name}</span>
                          <span className="ml-2 text-xs font-mono text-muted-foreground">SKU: {v.sku}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {v.price != null && (
                            <span className="font-semibold text-foreground">${Number(v.price).toFixed(2)}</span>
                          )}
                          <Badge
                            variant={v.stock_status === "in_stock" ? "default" : v.stock_status === "out_of_stock" ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {v.stock_status === "in_stock" ? "In Stock" : v.stock_status === "low_stock" ? "Low Stock" : v.stock_status === "out_of_stock" ? "Out of Stock" : v.stock_status}
                          </Badge>
                        </div>
                      </div>
                      {isSelected && attrs && Object.keys(attrs).length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="h-8 text-xs font-semibold uppercase tracking-wider">Specification</TableHead>
                                <TableHead className="h-8 text-xs font-semibold uppercase tracking-wider">Value</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {Object.entries(attrs).map(([key, val]) => (
                                <TableRow key={key} className="border-border/50">
                                  <TableCell className="py-2 px-4 text-muted-foreground capitalize font-medium text-sm">{key.replace(/_/g, " ")}</TableCell>
                                  <TableCell className="py-2 px-4 text-foreground text-sm">{String(val)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <ProductDocuments productId={productId} />
        </div>
      </div>

      <ProductReviews productId={productId} />
      <ReviewSubmitForm productId={productId} />

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
                  onClick={() => onProductClick?.(rp.id)}
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
      {lightboxIndex !== null && (
        <ProductImageLightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          alt={product.product_name}
        />
      )}
    </div>
  );
};

export default CompanyProductDetail;
