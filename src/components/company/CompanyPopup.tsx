import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Popup {
  id: string;
  title: string;
  message: string;
  popup_type: string;
  button_text: string | null;
  button_url: string | null;
  background_color: string | null;
  text_color: string | null;
  image_urls: string[] | null;
  display_order: number | null;
}

export default function CompanyPopup({ companyId }: { companyId: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [open, setOpen] = useState(false);

  const { data: popups = [] } = useQuery({
    queryKey: ["company-popups-live", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_popups")
        .select("id, title, message, popup_type, button_text, button_url, background_color, text_color, image_urls, display_order")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return (data || []) as Popup[];
    },
    enabled: !!companyId,
  });

  useEffect(() => {
    if (popups.length > 0) {
      setCurrentIndex(0);
      setOpen(true);
    }
  }, [popups]);

  const handleDismiss = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < popups.length) {
      setCurrentIndex(nextIndex);
    } else {
      setOpen(false);
    }
  };

  const handleButtonClick = (url: string | null) => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    handleDismiss();
  };

  if (popups.length === 0 || !open) return null;

  const popup = popups[currentIndex];
  const images = Array.isArray(popup.image_urls) ? popup.image_urls : [];

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleDismiss(); }}>
      <DialogContent
        className="sm:max-w-md"
        style={{
          backgroundColor: popup.background_color || undefined,
          color: popup.text_color || undefined,
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: popup.text_color || undefined }}>
            {popup.title}
          </DialogTitle>
          <DialogDescription
            className="whitespace-pre-wrap"
            style={{ color: popup.text_color ? `${popup.text_color}cc` : undefined }}
          >
            {popup.message}
          </DialogDescription>
        </DialogHeader>

        {images.length > 0 && (
          <div className="flex flex-col gap-2 my-2">
            {images.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Popup image ${i + 1}`}
                className="w-full rounded-md object-cover max-h-60"
              />
            ))}
          </div>
        )}

        <DialogFooter>
          <Button
            onClick={() => handleButtonClick(popup.button_url)}
            className="w-full"
          >
            {popup.button_text || "Got it"}
          </Button>
          {popups.length > 1 && (
            <p className="text-xs text-center w-full mt-1 opacity-60">
              {currentIndex + 1} of {popups.length}
            </p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
