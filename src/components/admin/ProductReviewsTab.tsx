import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2, CheckCircle, XCircle, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminLog } from "@/hooks/useAdminLog";

interface ProductReviewsTabProps {
  productId: string;
}

const ProductReviewsTab = ({ productId }: ProductReviewsTabProps) => {
  const { toast } = useToast();
  const { logAction } = useAdminLog();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["admin-product-reviews", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  const filteredReviews = statusFilter === "all"
    ? reviews
    : statusFilter === "approved"
    ? reviews.filter((r) => r.is_approved)
    : reviews.filter((r) => !r.is_approved);

  const handleApprove = async (id: string, approve: boolean) => {
    const { error } = await supabase
      .from("product_reviews")
      .update({ is_approved: approve })
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to update review", variant: "destructive" });
    } else {
      toast({ title: "Success", description: approve ? "Review approved" : "Review rejected" });
      logAction(approve ? "update" : "status_change", "customer", id, { action: approve ? "approved" : "rejected" });
      queryClient.invalidateQueries({ queryKey: ["admin-product-reviews", productId] });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("product_reviews").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete review", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Review deleted" });
      logAction("delete", "customer", id);
      queryClient.invalidateQueries({ queryKey: ["admin-product-reviews", productId] });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const pendingCount = reviews.filter((r) => !r.is_approved).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Customer Reviews</h3>
          {pendingCount > 0 && (
            <Badge variant="destructive">{pendingCount} pending</Badge>
          )}
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ({reviews.length})</SelectItem>
            <SelectItem value="pending">Pending ({pendingCount})</SelectItem>
            <SelectItem value="approved">Approved ({reviews.length - pendingCount})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredReviews.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {reviews.length === 0 ? "No reviews submitted yet." : "No reviews match this filter."}
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rating</TableHead>
                <TableHead>Reviewer</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Review</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">{review.reviewer_name}</span>
                      {review.is_verified_purchase && (
                        <Badge variant="outline" className="ml-1 text-[10px]">Verified</Badge>
                      )}
                    </div>
                    {review.reviewer_email && (
                      <span className="text-xs text-muted-foreground">{review.reviewer_email}</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate">{review.title || "—"}</TableCell>
                  <TableCell className="max-w-[250px] truncate">{review.review_text || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={review.is_approved ? "default" : "secondary"}>
                      {review.is_approved ? "Approved" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(review.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {!review.is_approved ? (
                        <Button size="sm" variant="outline" onClick={() => handleApprove(review.id, true)} title="Approve">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleApprove(review.id, false)} title="Reject">
                          <XCircle className="h-4 w-4 text-orange-500" />
                        </Button>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(review.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ProductReviewsTab;
