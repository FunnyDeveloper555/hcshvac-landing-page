import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, Download, ExternalLink, Mail, MailOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Popup {
  id: string;
  title: string;
  message: string;
  popup_type: string;
  content_type: string;
  button_text: string | null;
  button_url: string | null;
  background_color: string | null;
  text_color: string | null;
  image_urls: string[] | null;
  display_order: number | null;
  publish_start_date: string | null;
  publish_end_date: string | null;
  file_url: string | null;
  redirect_url: string | null;
  destination_window: string;
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

function isWithinPublishRange(popup: Popup): boolean {
  const now = new Date();
  if (popup.publish_start_date && new Date(popup.publish_start_date) > now) return false;
  if (popup.publish_end_date && new Date(popup.publish_end_date) < now) return false;
  return true;
}

function openUrl(url: string, destination: string) {
  if (destination === "new") {
    window.open(url, "_blank", "noopener,noreferrer");
  } else {
    window.location.href = url;
  }
}

function PopupContent({ popup }: { popup: Popup }) {
  const images = Array.isArray(popup.image_urls) ? popup.image_urls : [];

  // For video type, prefer file_url as the video source, then fall back to image_urls
  const videoSources = popup.file_url
    ? [popup.file_url]
    : images;

  // For image type, use image_urls first, then fall back to file_url as a single image
  const imageSources = images.length > 0
    ? images
    : popup.file_url
      ? [popup.file_url]
      : [];

  const renderMessage = () => {
    switch (popup.content_type) {
      case "html":
        return <div className="prose prose-sm max-w-none mb-3" dangerouslySetInnerHTML={{ __html: popup.message }} />;
      case "image":
        return (
          <div className="flex flex-col gap-2 mb-3">
            {imageSources.length > 0 ? (
              imageSources.map((url, i) => (
                <img key={i} src={url} alt={`Popup image ${i + 1}`} className="w-full rounded-md object-cover max-h-48" />
              ))
            ) : (
              <p className="whitespace-pre-wrap mb-3">{popup.message}</p>
            )}
          </div>
        );
      case "video":
        return (
          <div className="mb-3">
            {videoSources.length > 0 ? (
              videoSources.map((url, i) => (
                <video key={i} src={url} controls playsInline className="w-full rounded-md max-h-64" />
              ))
            ) : (
              <p className="whitespace-pre-wrap">{popup.message}</p>
            )}
          </div>
        );
      default: // text
        return <p className="whitespace-pre-wrap mb-3">{popup.message}</p>;
    }
  };

  return (
    <>
      {renderMessage()}

      {/* Show images for non-image content types that still have images */}
      {popup.content_type !== "image" && popup.content_type !== "video" && images.length > 0 && (
        <div className="flex flex-col gap-2 mb-3">
          {images.map((url, i) => (
            <img key={i} src={url} alt={`Popup image ${i + 1}`} className="w-full rounded-md object-cover max-h-48" />
          ))}
        </div>
      )}

      {popup.file_url && (
        <Button
          size="sm"
          variant="outline"
          className="w-full mb-2"
          onClick={() => openUrl(popup.file_url!, "new")}
        >
          <Download className="mr-2 h-3 w-3" />
          Download Attachment
        </Button>
      )}

      {popup.redirect_url && (
        <Button
          size="sm"
          variant="outline"
          className="w-full mb-2"
          onClick={() => openUrl(popup.redirect_url!, popup.destination_window)}
        >
          <ExternalLink className="mr-2 h-3 w-3" />
          View More
        </Button>
      )}

      {popup.button_text && (
        <Button
          size="sm"
          className="w-full"
          onClick={() => {
            if (popup.button_url) {
              openUrl(popup.button_url, popup.destination_window);
            }
          }}
        >
          {popup.button_text}
        </Button>
      )}
    </>
  );
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
        .select("id, title, message, popup_type, content_type, button_text, button_url, background_color, text_color, image_urls, display_order, publish_start_date, publish_end_date, file_url, redirect_url, destination_window")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return ((data || []) as Popup[]).filter(isWithinPublishRange);
    },
    enabled: !!companyId,
  });

  useEffect(() => {
    if (popups.length > 0) {
      setVisible(true);
      setExpandedId((current) => {
        if (current && popups.some((p) => p.id === current)) return current;
        const firstUnread = popups.find((p) => !readIds.has(p.id));
        const target = firstUnread ?? popups[0];
        if (target && !readIds.has(target.id)) {
          setReadIds((prev) => {
            const next = new Set(prev);
            next.add(target.id);
            persistReadIds(companyId, next);
            return next;
          });
        }
        return target?.id ?? null;
      });
    }
  }, [popups, readIds, companyId]);

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
                    <PopupContent popup={popup} />
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
