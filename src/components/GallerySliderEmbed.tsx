import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, Play, Image as ImageIcon } from "lucide-react";

interface GallerySliderEmbedProps {
  galleryId: string;
}

const GallerySliderEmbed = ({ galleryId }: GallerySliderEmbedProps) => {
  const [current, setCurrent] = useState(0);

  const { data: gallery } = useQuery({
    queryKey: ["gallery-embed", galleryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("galleries")
        .select("name")
        .eq("id", galleryId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: items = [] } = useQuery({
    queryKey: ["gallery-embed-items", galleryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_items")
        .select("*")
        .eq("gallery_id", galleryId)
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data || [];
    },
  });

  const goPrev = useCallback(() => {
    setCurrent((p) => (p - 1 + items.length) % items.length);
  }, [items.length]);

  const goNext = useCallback(() => {
    setCurrent((p) => (p + 1) % items.length);
  }, [items.length]);

  useEffect(() => {
    setCurrent(0);
  }, [galleryId]);

  if (items.length === 0) {
    return (
      <div className="my-6 rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 p-8 text-center">
        <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">Gallery is empty</p>
      </div>
    );
  }

  const item = items[current] as any;
  const isVideo = item?.item_type === "video";

  return (
    <div className="my-6 rounded-xl overflow-hidden border bg-background shadow-sm">
      {/* Gallery title bar */}
      {gallery?.name && (
        <div className="px-4 py-2 bg-muted/50 border-b flex items-center justify-between">
          <span className="text-sm font-medium text-foreground/80 flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4" />
            {gallery.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {current + 1} / {items.length}
          </span>
        </div>
      )}

      {/* Slider viewport */}
      <div className="relative aspect-video bg-black/5">
        {isVideo ? (
          item.file_url ? (
            <video
              key={item.id}
              src={item.file_url}
              controls
              className="w-full h-full object-contain"
              poster={item.thumbnail_url || undefined}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="w-12 h-12 text-muted-foreground/40" />
            </div>
          )
        ) : (
          <img
            key={item.id}
            src={item.file_url}
            alt={item.alt_text || item.title || ""}
            className="w-full h-full object-contain transition-opacity duration-300"
          />
        )}

        {/* Navigation arrows */}
        {items.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Caption */}
      {(item.title || item.description) && (
        <div className="px-4 py-2 border-t bg-muted/30">
          {item.title && <p className="text-sm font-medium">{item.title}</p>}
          {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
        </div>
      )}

      {/* Dot indicators */}
      {items.length > 1 && (
        <div className="flex justify-center gap-1.5 py-2 border-t bg-muted/20">
          {items.map((_: any, i: number) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all ${
                current === i
                  ? "w-5 h-2 bg-primary"
                  : "w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default GallerySliderEmbed;
