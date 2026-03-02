import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText, Image, FileVideo, FileAudio, File as FileIcon } from "lucide-react";
import type { FileItem } from "@/hooks/useFileManager";

interface FileDetailPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileItem | null;
}

interface UsedInReference {
  table: string;
  label: string;
  name: string;
  id: string;
}

function formatSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString();
}

function getFileTypeIcon(mimeType: string | null) {
  if (!mimeType) return FileIcon;
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.startsWith("video/")) return FileVideo;
  if (mimeType.startsWith("audio/")) return FileAudio;
  return FileText;
}

function getFileExtension(name: string) {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop()?.toUpperCase() : "—";
}

export function FileDetailPanel({ open, onOpenChange, file }: FileDetailPanelProps) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [loadingDimensions, setLoadingDimensions] = useState(false);
  const [usedIn, setUsedIn] = useState<UsedInReference[]>([]);
  const [loadingUsedIn, setLoadingUsedIn] = useState(false);

  useEffect(() => {
    if (!file || !open) {
      setDimensions(null);
      setUsedIn([]);
      return;
    }

    // Load image dimensions
    if (file.mime_type?.startsWith("image/")) {
      setLoadingDimensions(true);
      const img = new window.Image();
      img.onload = () => {
        setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        setLoadingDimensions(false);
      };
      img.onerror = () => {
        setDimensions(null);
        setLoadingDimensions(false);
      };
      img.src = file.file_url;
    } else {
      setDimensions(null);
    }

    // Load "Used in" references
    setLoadingUsedIn(true);
    findUsages(file.file_url).then((refs) => {
      setUsedIn(refs);
      setLoadingUsedIn(false);
    });
  }, [file, open]);

  if (!file) return null;

  const Icon = getFileTypeIcon(file.mime_type);
  const isImage = file.mime_type?.startsWith("image/");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[380px] sm:w-[420px] p-0">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle className="text-base truncate">{file.name}</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="px-6 pb-6 space-y-5">
            {/* Preview thumbnail */}
            {isImage ? (
              <div className="rounded-lg border bg-muted/30 flex items-center justify-center overflow-hidden">
                <img
                  src={file.file_url}
                  alt={file.name}
                  className="max-h-48 max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="rounded-lg border bg-muted/30 flex items-center justify-center h-32">
                <Icon className="h-16 w-16 text-muted-foreground" />
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">File Information</h4>
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <span className="text-muted-foreground">Type</span>
                <span className="truncate">
                  <Badge variant="outline" className="text-xs">
                    {getFileExtension(file.name)}
                  </Badge>
                  <span className="ml-2 text-muted-foreground text-xs">{file.mime_type || "Unknown"}</span>
                </span>

                <span className="text-muted-foreground">Size</span>
                <span>{formatSize(file.file_size)}</span>

                {isImage && (
                  <>
                    <span className="text-muted-foreground">Dimensions</span>
                    <span>
                      {loadingDimensions ? (
                        <Loader2 className="h-3 w-3 animate-spin inline" />
                      ) : dimensions ? (
                        `${dimensions.width} × ${dimensions.height} px`
                      ) : (
                        "—"
                      )}
                    </span>
                  </>
                )}

                <span className="text-muted-foreground">Uploaded</span>
                <span>{formatDate(file.created_at)}</span>

                <span className="text-muted-foreground">Modified</span>
                <span>{formatDate(file.updated_at)}</span>
              </div>
            </div>

            <Separator />

            {/* Storage Path */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Storage Path</h4>
              <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
                {file.storage_path}
              </code>
            </div>

            {/* File URL */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Public URL</h4>
              <code className="text-xs bg-muted px-2 py-1 rounded block break-all select-all cursor-pointer">
                {file.file_url}
              </code>
            </div>

            <Separator />

            {/* Used In */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Used In</h4>
              {loadingUsedIn ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Checking references…
                </div>
              ) : usedIn.length === 0 ? (
                <p className="text-sm text-muted-foreground">Not currently used anywhere.</p>
              ) : (
                <div className="space-y-1.5">
                  {usedIn.map((ref, i) => (
                    <div
                      key={`${ref.table}-${ref.id}-${i}`}
                      className="flex items-center gap-2 text-sm bg-muted/50 rounded px-2 py-1.5"
                    >
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {ref.label}
                      </Badge>
                      <span className="truncate">{ref.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

async function findUsages(fileUrl: string): Promise<UsedInReference[]> {
  const refs: UsedInReference[] = [];

  try {
    // Check company images
    const { data: companyImages } = await supabase
      .from("company_images")
      .select("id, alt_text, image_url")
      .eq("image_url", fileUrl)
      .limit(10);
    companyImages?.forEach((r) =>
      refs.push({ table: "company_images", label: "Company Image", name: r.alt_text || "Image", id: r.id })
    );

    // Check hero images
    const { data: heroImages } = await supabase
      .from("hero_images")
      .select("id, alt_text, image_url")
      .eq("image_url", fileUrl)
      .limit(10);
    heroImages?.forEach((r) =>
      refs.push({ table: "hero_images", label: "Hero Image", name: r.alt_text || "Image", id: r.id })
    );

    // Check CTA icons
    const { data: ctaIcons } = await supabase
      .from("cta_icons")
      .select("id, custom_name, image_url")
      .eq("image_url", fileUrl)
      .limit(10);
    ctaIcons?.forEach((r) =>
      refs.push({ table: "cta_icons", label: "CTA Icon", name: r.custom_name || "Icon", id: r.id })
    );

    // Check company logos
    const { data: companies } = await supabase
      .from("companies")
      .select("id, name, logo_url, hero_image_url")
      .or(`logo_url.eq.${fileUrl},hero_image_url.eq.${fileUrl}`)
      .limit(10);
    companies?.forEach((r) => {
      if (r.logo_url === fileUrl)
        refs.push({ table: "companies", label: "Company Logo", name: r.name, id: r.id });
      if (r.hero_image_url === fileUrl)
        refs.push({ table: "companies", label: "Company Hero", name: r.name, id: r.id });
    });

    // Check product documents
    const { data: prodDocs } = await supabase
      .from("product_documents")
      .select("id, document_name, file_url")
      .eq("file_url", fileUrl)
      .limit(10);
    prodDocs?.forEach((r) =>
      refs.push({ table: "product_documents", label: "Product Doc", name: r.document_name, id: r.id })
    );

    // Check company banners
    const { data: banners } = await supabase
      .from("company_banners")
      .select("id, title, image_url")
      .eq("image_url", fileUrl)
      .limit(10);
    banners?.forEach((r) =>
      refs.push({ table: "company_banners", label: "Banner", name: r.title || "Banner", id: r.id })
    );

    // Check company popups
    const { data: popups } = await supabase
      .from("company_popups")
      .select("id, title, file_url")
      .eq("file_url", fileUrl)
      .limit(10);
    popups?.forEach((r) =>
      refs.push({ table: "company_popups", label: "Popup", name: r.title || "Popup", id: r.id })
    );
  } catch {
    // silently fail – partial results are fine
  }

  return refs;
}
