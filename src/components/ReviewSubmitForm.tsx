import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReviewSubmitFormProps {
  productId: string;
}

const ReviewSubmitForm = ({ productId }: ReviewSubmitFormProps) => {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const [rating, setRating] = useState(0);
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerEmail, setReviewerEmail] = useState("");
  const [title, setTitle] = useState("");
  const [reviewText, setReviewText] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast({ title: "Please select a rating", variant: "destructive" });
      return;
    }
    if (!reviewerName.trim()) {
      toast({ title: "Please enter your name", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("product_reviews").insert({
        product_id: productId,
        rating,
        reviewer_name: reviewerName.trim(),
        reviewer_email: reviewerEmail.trim() || null,
        title: title.trim() || null,
        review_text: reviewText.trim() || null,
        is_approved: false,
      });

      if (error) throw error;
      setSubmitted(true);
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to submit review. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mt-10 p-6 bg-card rounded-xl border border-border text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-1">Thank You for Your Review!</h3>
        <p className="text-muted-foreground text-sm">
          Your review has been submitted and is pending approval. It will appear on this page once approved.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 p-6 bg-card rounded-xl border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-4">Write a Review</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star Rating */}
        <div className="space-y-2">
          <Label>Your Rating *</Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-7 h-7 transition-colors ${
                    star <= (hoverRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="reviewer-name">Your Name *</Label>
            <Input
              id="reviewer-name"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              placeholder="John Doe"
              maxLength={100}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reviewer-email">Email (optional)</Label>
            <Input
              id="reviewer-email"
              type="email"
              value={reviewerEmail}
              onChange={(e) => setReviewerEmail(e.target.value)}
              placeholder="john@example.com"
              maxLength={255}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="review-title">Review Title</Label>
          <Input
            id="review-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your experience"
            maxLength={200}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="review-text">Your Review</Label>
          <Textarea
            id="review-text"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Tell others about your experience with this product..."
            maxLength={2000}
            rows={4}
          />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Submit Review
        </Button>
      </form>
    </div>
  );
};

export default ReviewSubmitForm;
