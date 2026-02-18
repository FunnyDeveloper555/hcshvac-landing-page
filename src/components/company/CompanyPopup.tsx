import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, Mail, MailOpen, X } from "lucide-react";
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

const STORAGE_KEY_PREFIX = "popup-read-";

function getReadIds(companyId: string): Set<string> {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${companyId}`);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}

function persistReadIds(companyId: string, ids: Set<string>) {
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${companyId}`, JSON.stringify([...ids]));
}

export default function CompanyPopup({ companyId }: { companyId: string }) {
  const [visible, setVisible] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(() => getReadIds(companyId));

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
    if (popups.length > 0) setVisible(true);
  }, [popups]);

  const markRead = useCallback(
    (id: string) => {
      setReadIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        persistReadIds(companyId, next);
        return next;
      });
    },
    [companyId],
  );

  const toggleItem = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      markRead(id);
    }
  };

  if (!visible || popups.length === 0) return null;

  const unreadCount = popups.filter((p) => !readIds.has(p.id)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 rounded-xl border bg-card text-card-foreground shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/40">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">
              Alerts{unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5">
                  {unreadCount}
                </span>
              )}
            </span>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="rounded-md p-1 hover:bg-muted transition-colors"
            aria-label="Close alerts"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Accordion list */}
        <div className="max-h-[60vh] overflow-y-auto divide-y">
          {popups.map((popup) => {
            const isRead = readIds.has(popup.id);
            const isOpen = expandedId === popup.id;
            const images = Array.isArray(popup.image_urls) ? popup.image_urls : [];

            return (
              <div key={popup.id}>
                {/* Trigger */}
                <button
                  onClick={() => toggleItem(popup.id)}
                  className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-muted/50 ${
                    !isRead ? "bg-primary/5 font-semibold" : ""
                  }`}
                >
                  {isRead ? (
                    <MailOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <Mail className="h-4 w-4 shrink-0 text-primary" />
                  )}
                  <span className="flex-1 text-sm truncate">{popup.title}</span>
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground mr-2">
                    {popup.popup_type}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Content */}
                {isOpen && (
                  <div
                    className="px-5 pb-4 pt-1 text-sm animate-in fade-in slide-in-from-top-1 duration-200"
                    style={{
                      backgroundColor: popup.background_color || undefined,
                      color: popup.text_color || undefined,
                    }}
                  >
                    <p className="whitespace-pre-wrap mb-3">{popup.message}</p>

                    {images.length > 0 && (
                      <div className="flex flex-col gap-2 mb-3">
                        {images.map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt={`Popup image ${i + 1}`}
                            className="w-full rounded-md object-cover max-h-48"
                          />
                        ))}
                      </div>
                    )}

                    {popup.button_text && (
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          if (popup.button_url) {
                            window.open(popup.button_url, "_blank", "noopener,noreferrer");
                          }
                        }}
                      >
                        {popup.button_text}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
