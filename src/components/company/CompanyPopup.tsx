import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Megaphone } from "lucide-react";

interface Popup {
  id: string;
  popup_type: string;
  title: string;
  message: string;
  button_text: string | null;
  button_url: string | null;
  bg_color: string | null;
  text_color: string | null;
  images: string[] | null;
}

export default function CompanyPopup({ companyId }: { companyId: string }) {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchPopups = async () => {
      const { data } = await supabase
        .from("company_popups")
        .select("id, popup_type, title, message, button_text, button_url, bg_color, text_color, images")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("display_order");
      if (data && data.length > 0) {
        const mapped: Popup[] = data.map((d) => ({
          ...d,
          images: Array.isArray(d.images) ? (d.images as string[]) : [],
        }));
        setPopups(mapped);
        setOpen(true);
      }
    };
    fetchPopups();
  }, [companyId]);

  const handleDismiss = () => {
    if (currentIndex < popups.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setOpen(false);
    }
  };

  if (popups.length === 0) return null;

  const popup = popups[currentIndex];
  const isEmergency = popup.popup_type === "emergency";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-w-md"
        style={{
          backgroundColor: popup.bg_color || undefined,
          color: popup.text_color || undefined,
        }}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            {isEmergency ? (
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            ) : (
              <Megaphone className="h-5 w-5 text-primary shrink-0" />
            )}
            <DialogTitle style={{ color: popup.text_color || undefined }}>
              {popup.title}
            </DialogTitle>
          </div>
          <DialogDescription
            className="whitespace-pre-wrap pt-2 text-base"
            style={{ color: popup.text_color ? `${popup.text_color}cc` : undefined }}
          >
            {popup.message}
          </DialogDescription>
          {Array.isArray(popup.images) && popup.images.length > 0 && (
            <div className="flex flex-col gap-2 pt-2">
              {popup.images.filter(Boolean).map((url, i) => (
                <img key={i} src={url} alt={`Popup image ${i + 1}`} className="w-full rounded-md object-cover max-h-48" />
              ))}
            </div>
          )}
        </DialogHeader>
        <DialogFooter>
          {popup.button_url ? (
            <Button asChild onClick={handleDismiss}>
              <a href={popup.button_url} target="_blank" rel="noopener noreferrer">
                {popup.button_text || "Learn More"}
              </a>
            </Button>
          ) : (
            <Button onClick={handleDismiss}>
              {popup.button_text || "Got it"}
            </Button>
          )}
          {popups.length > 1 && (
            <span className="text-xs text-muted-foreground self-center">
              {currentIndex + 1} of {popups.length}
            </span>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
