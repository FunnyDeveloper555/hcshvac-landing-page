import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";

interface ProductReviewsProps {
  productId: string;
}

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`w-4 h-4 ${
          star <= rating
            ? "fill-yellow-400 text-yellow-400"
            : "text-muted-foreground/30"
        }`}
      />
    ))}
  </div>
);

const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["product-reviews", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", productId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-48 bg-muted rounded" />
        <div className="h-24 bg-muted rounded" />
      </div>
    );
  }

  if (reviews.length === 0) return null;

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const ratingCounts = [5, 4, 3, 2, 1].map(
    (star) => reviews.filter((r) => r.rating === star).length
  );

  return (
    <div className="mt-16 border-t border-border pt-10">
      <h2 className="text-2xl font-bold text-foreground mb-6">Customer Reviews</h2>

      {/* Summary */}
      <div className="flex flex-col sm:flex-row gap-8 mb-8 p-6 bg-card rounded-xl border border-border">
        <div className="flex flex-col items-center justify-center gap-1">
          <span className="text-4xl font-bold text-foreground">{avgRating.toFixed(1)}</span>
          <StarRating rating={Math.round(avgRating)} />
          <span className="text-sm text-muted-foreground mt-1">
            {reviews.length} review{reviews.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map((star, i) => (
            <div key={star} className="flex items-center gap-2 text-sm">
              <span className="w-6 text-right text-muted-foreground">{star}</span>
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all"
                  style={{
                    width: `${reviews.length ? (ratingCounts[i] / reviews.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="w-8 text-muted-foreground text-right">{ratingCounts[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Individual Reviews */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="p-5 bg-card rounded-xl border border-border">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <StarRating rating={review.rating} />
                  {review.is_verified_purchase && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                      Verified Purchase
                    </span>
                  )}
                </div>
                {review.title && (
                  <h3 className="font-semibold text-foreground">{review.title}</h3>
                )}
              </div>
            </div>
            {review.review_text && (
              <p className="text-muted-foreground text-sm whitespace-pre-wrap mb-3">
                {review.review_text}
              </p>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium">{review.reviewer_name}</span>
              <span>·</span>
              <span>{new Date(review.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductReviews;
