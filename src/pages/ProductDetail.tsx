import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ["public-product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, brands(name), companies(name)")
        .eq("id", id!)
        .eq("is_published", true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

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

  const images = (product.spot_images as string[] | null) || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/products")} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Products
          </Button>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Images */}
            <div className="space-y-4">
              <div className="aspect-square rounded-xl overflow-hidden bg-muted border border-border">
                {images.length > 0 ? (
                  <img
                    src={images[selectedImage]}
                    alt={product.product_name}
                    className="w-full h-full object-cover"
                  />
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
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
