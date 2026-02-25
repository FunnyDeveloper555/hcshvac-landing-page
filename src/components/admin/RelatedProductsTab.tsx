import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, Search, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface RelatedProductsTabProps {
  productId: string;
  companyId: string;
}

interface RecommendationRow {
  id: string;
  recommended_product_id: string;
  display_order: number;
  is_active: boolean;
  product: {
    id: string;
    product_name: string;
    category: string | null;
    spot_images: string[] | null;
  };
}

const SortableRecommendation = ({
  rec,
  onRemove,
}: {
  rec: RecommendationRow;
  onRemove: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: rec.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const thumb = (rec.product.spot_images as string[] | null)?.[0];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 border rounded-lg bg-card"
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      {thumb ? (
        <img src={thumb} alt="" className="w-12 h-12 object-cover rounded" />
      ) : (
        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
          N/A
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{rec.product.product_name}</p>
        {rec.product.category && (
          <p className="text-xs text-muted-foreground">{rec.product.category}</p>
        )}
      </div>
      <Button type="button" size="sm" variant="ghost" onClick={onRemove}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
};

const RelatedProductsTab = ({ productId, companyId }: RelatedProductsTabProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Fetch existing recommendations
  const { data: recommendations = [], isLoading: loadingRecs } = useQuery({
    queryKey: ["product-recommendations", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_recommendations")
        .select("id, recommended_product_id, display_order, is_active, products!product_recommendations_recommended_product_id_fkey(id, product_name, category, spot_images)")
        .eq("product_id", productId)
        .order("display_order");
      if (error) throw error;
      return (data || []).map((r: any) => ({
        ...r,
        product: r.products,
      })) as RecommendationRow[];
    },
    enabled: !!productId,
  });

  // Fetch available products (same company, exclude self and already recommended)
  const recommendedIds = new Set(recommendations.map((r) => r.recommended_product_id));

  const { data: availableProducts = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["available-products-for-rec", productId, companyId],
    queryFn: async () => {
      const query = supabase
        .from("products")
        .select("id, product_name, category, spot_images")
        .neq("id", productId)
        .order("product_name");
      if (companyId) query.eq("company_id", companyId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!productId,
  });

  const filtered = availableProducts
    .filter((p) => !recommendedIds.has(p.id))
    .filter((p) =>
      search ? p.product_name.toLowerCase().includes(search.toLowerCase()) : true
    );

  // Add recommendation
  const addMutation = useMutation({
    mutationFn: async (recProductId: string) => {
      const maxOrder = recommendations.length > 0
        ? Math.max(...recommendations.map((r) => r.display_order))
        : -1;
      const { error } = await supabase.from("product_recommendations").insert({
        product_id: productId,
        recommended_product_id: recProductId,
        display_order: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-recommendations", productId] });
      queryClient.invalidateQueries({ queryKey: ["available-products-for-rec"] });
      toast({ title: "Added", description: "Related product added." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // Remove recommendation
  const removeMutation = useMutation({
    mutationFn: async (recId: string) => {
      const { error } = await supabase.from("product_recommendations").delete().eq("id", recId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-recommendations", productId] });
      queryClient.invalidateQueries({ queryKey: ["available-products-for-rec"] });
      toast({ title: "Removed", description: "Related product removed." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // Reorder
  const reorderMutation = useMutation({
    mutationFn: async (reordered: RecommendationRow[]) => {
      const updates = reordered.map((r, i) =>
        supabase.from("product_recommendations").update({ display_order: i }).eq("id", r.id)
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-recommendations", productId] });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = recommendations.findIndex((r) => r.id === active.id);
      const newIndex = recommendations.findIndex((r) => r.id === over.id);
      const reordered = arrayMove(recommendations, oldIndex, newIndex);
      // Optimistic update via queryClient
      queryClient.setQueryData(["product-recommendations", productId], reordered);
      reorderMutation.mutate(reordered);
    }
  };

  if (loadingRecs) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current recommendations */}
      <div>
        <h3 className="text-lg font-semibold mb-3">
          Selected Related Products ({recommendations.length})
        </h3>
        {recommendations.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            No related products selected yet. Add products from the list below.
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={recommendations.map((r) => r.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {recommendations.map((rec) => (
                  <SortableRecommendation
                    key={rec.id}
                    rec={rec}
                    onRemove={() => removeMutation.mutate(rec.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Available products */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Available Products</h3>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {loadingProducts ? (
          <div className="flex justify-center p-4">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {search ? "No matching products found." : "No more products available to add."}
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto border rounded-lg divide-y">
            {filtered.map((p) => {
              const thumb = (p.spot_images as string[] | null)?.[0];
              return (
                <div key={p.id} className="flex items-center gap-3 p-3 hover:bg-muted/50">
                  {thumb ? (
                    <img src={thumb} alt="" className="w-10 h-10 object-cover rounded" />
                  ) : (
                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                      N/A
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.product_name}</p>
                    {p.category && (
                      <p className="text-xs text-muted-foreground">{p.category}</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => addMutation.mutate(p.id)}
                    disabled={addMutation.isPending}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RelatedProductsTab;
