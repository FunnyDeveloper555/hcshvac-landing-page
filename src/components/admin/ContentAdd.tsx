import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, X, CalendarIcon, Sparkles, Plus, Wand2, RotateCcw, Eye, GalleryHorizontalEnd, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import ContentPreview from "@/components/admin/ContentPreview";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAdminLog } from "@/hooks/useAdminLog";
import { useAuth } from "@/hooks/useAuth";
import { format, addDays, addMonths, addYears } from "date-fns";
import { cn } from "@/lib/utils";
import { SpotImageReviewDialog } from "@/components/admin/SpotImageReviewDialog";
import ContentMetaDataTab from "@/components/admin/ContentMetaDataTab";

const PUBLISH_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const DATE_PRESETS = [
  { label: "Short (7 days)", days: 7 },
  { label: "Medium (30 days)", days: 30 },
  { label: "Long (90 days)", days: 90 },
  { label: "6 Months", days: 180 },
  { label: "1 Year", days: 365 },
];

function GalleryPreviewStrip({ galleryId }: { galleryId: string }) {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["gallery-preview-strip", galleryId],
    queryFn: async () => {
      const { data } = await supabase
        .from("gallery_items")
        .select("id, file_url, thumbnail_url, title, item_type")
        .eq("gallery_id", galleryId)
        .eq("is_active", true)
        .order("display_order")
        .limit(6);
      return data || [];
    },
    enabled: !!galleryId,
  });
  if (isLoading) return <div className="flex gap-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="w-14 h-14 rounded bg-muted animate-pulse" />)}</div>;
  if (items.length === 0) return <p className="text-sm text-muted-foreground">This gallery has no items yet.</p>;
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">Preview</Label>
      <div className="flex gap-2 flex-wrap">
        {items.map((item: any) => {
          const isVideo = item.item_type === "video";
          const src = item.thumbnail_url || item.file_url;
          return (
            <div key={item.id} className="w-14 h-14 rounded overflow-hidden border bg-muted relative">
              {isVideo && !item.thumbnail_url ? (
                <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-lg">▶</div>
              ) : (
                <img src={src} alt={item.title || ""} className="w-full h-full object-cover" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
const ContentAdd = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const isEditing = !!editId;
  const { logAction } = useAdminLog();
  const { user } = useAuth();
  const editorRef = useRef<HTMLIFrameElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatingTags, setGeneratingTags] = useState(false);
  const [generatingSpotText, setGeneratingSpotText] = useState(false);
  const [generatingSpotImage, setGeneratingSpotImage] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGeneratedContent, setAiGeneratedContent] = useState("");
  const [generatingContent, setGeneratingContent] = useState(false);
  const [spotImageBase64, setSpotImageBase64] = useState<string | null>(null);
  const [spotImageReviewOpen, setSpotImageReviewOpen] = useState(false);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [selectedGalleryId, setSelectedGalleryId] = useState<string>("");
  const [galleryEditMode, setGalleryEditMode] = useState<"insert" | "edit">("insert");
  const [editingGalleryElement, setEditingGalleryElement] = useState<HTMLElement | null>(null);
  // Form state
  const [author, setAuthor] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [publishStatus, setPublishStatus] = useState("draft");
  const [publishStartDate, setPublishStartDate] = useState<Date | undefined>();
  const [publishEndDate, setPublishEndDate] = useState<Date | undefined>();
  const [htmlContent, setHtmlContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [spotText, setSpotText] = useState("");
  const [spotImageUrl, setSpotImageUrl] = useState("");
  const [allowComments, setAllowComments] = useState(false);
  const [showAuthorName, setShowAuthorName] = useState(true);
  const [editorReady, setEditorReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Auto-generate slug from title
  useEffect(() => {
    if (!isEditing || !slug) {
      const generated = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setSlug(generated);
    }
  }, [title]);

  // Load existing content for editing
  useEffect(() => {
    if (editId) fetchContent();
  }, [editId]);

  // When htmlContent changes and editor is ready, sync it
  useEffect(() => {
    if (editorReady && htmlContent) {
      setEditorContent(htmlContent);
    }
  }, [editorReady, htmlContent]);

  const fetchContent = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contents")
      .select("*")
      .eq("id", editId)
      .single();
    if (error) {
      toast({ title: "Error", description: "Failed to load content", variant: "destructive" });
      navigate("/admin/contents/list");
    } else if (data) {
      setAuthor(data.author_id || "");
      setTitle(data.title);
      setSlug(data.slug || "");
      setShortDescription(data.short_description || "");
      setPublishStatus(data.publish_status);
      setPublishStartDate(data.publish_start_date ? new Date(data.publish_start_date) : undefined);
      setPublishEndDate(data.publish_end_date ? new Date(data.publish_end_date) : undefined);
      setHtmlContent(data.html_content || "");
      setTags((data.tags as string[]) || []);
      setDisplayOrder(data.display_order || 0);
      setSpotText((data as any).spot_text || "");
      setSpotImageUrl((data as any).spot_image_url || "");
      setAllowComments((data as any).allow_comments ?? false);
      setShowAuthorName((data as any).show_author_name ?? true);
    }
    setLoading(false);
  };

  const getEditorContent = (): string => {
    try {
      const iframe = editorRef.current;
      if (iframe?.contentDocument) {
        return iframe.contentDocument.body.innerHTML || "";
      }
    } catch {}
    return htmlContent;
  };

  const setEditorContent = (html: string) => {
    try {
      const iframe = editorRef.current;
      if (iframe?.contentDocument) {
        iframe.contentDocument.body.innerHTML = html;
      }
    } catch {}
  };

  const handleEditorLoad = () => {
    const iframe = editorRef.current;
    if (!iframe?.contentDocument) return;

    const doc = iframe.contentDocument;
    doc.designMode = "on";

    // Add base styles
    const style = doc.createElement("style");
    style.textContent = `
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.6;
        padding: 12px;
        margin: 0;
        color: #1a1a1a;
        min-height: 100%;
      }
      body:focus { outline: none; }
      h1 { font-size: 2em; margin: 0.67em 0; }
      h2 { font-size: 1.5em; margin: 0.75em 0; }
      h3 { font-size: 1.17em; margin: 0.83em 0; }
      p { margin: 0.5em 0; }
      ul, ol { padding-left: 2em; }
      table { border-collapse: collapse; width: 100%; }
      table td, table th { border: 1px solid #ccc; padding: 6px 10px; }
      blockquote { border-left: 3px solid #ccc; padding-left: 12px; margin-left: 0; color: #555; }
      img { max-width: 100%; }
      a { color: #2563eb; }
      pre { background: #f3f4f6; padding: 12px; border-radius: 6px; overflow-x: auto; }
      code { background: #f3f4f6; padding: 2px 4px; border-radius: 3px; font-size: 0.9em; }
      hr { border: none; border-top: 1px solid #ccc; margin: 1em 0; }
    `;
    doc.head.appendChild(style);

    // Add hover/click styles for gallery blocks
    const galleryStyle = doc.createElement("style");
    galleryStyle.textContent = `
      div[data-gallery-id] {
        cursor: pointer;
        transition: border-color 0.15s, box-shadow 0.15s;
      }
      div[data-gallery-id]:hover {
        border-color: #3b82f6 !important;
        box-shadow: 0 0 0 2px rgba(59,130,246,0.2);
      }
    `;
    doc.head.appendChild(galleryStyle);

    // Intercept Tab key to insert tab spaces instead of moving focus
    doc.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();
        doc.execCommand("insertHTML", false, "&nbsp;&nbsp;&nbsp;&nbsp;");
      }
      // Allow Escape to exit fullscreen
      if (e.key === "Escape") {
        setIsFullscreen(false);
      }
    });

    // Click handler for gallery embed blocks
    doc.addEventListener("click", (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const galleryBlock = target.closest("div[data-gallery-id]") as HTMLElement | null;
      if (galleryBlock) {
        e.preventDefault();
        e.stopPropagation();
        const gId = galleryBlock.getAttribute("data-gallery-id") || "";
        setEditingGalleryElement(galleryBlock);
        setSelectedGalleryId(gId);
        setGalleryEditMode("edit");
        setGalleryModalOpen(true);
      }
    });

    // Set content if editing
    if (htmlContent) {
      doc.body.innerHTML = htmlContent;
    }

    setEditorReady(true);
  };

  const execCmd = (cmd: string, value?: string) => {
    const iframe = editorRef.current;
    if (!iframe?.contentDocument) return;
    iframe.contentDocument.execCommand(cmd, false, value);
    iframe.contentWindow?.focus();
  };

  const insertTable = () => {
    const rows = prompt("Number of rows:", "3");
    const cols = prompt("Number of columns:", "3");
    if (!rows || !cols) return;
    const r = parseInt(rows), c = parseInt(cols);
    let html = '<table><thead><tr>';
    for (let j = 0; j < c; j++) html += '<th>Header</th>';
    html += '</tr></thead><tbody>';
    for (let i = 0; i < r - 1; i++) {
      html += '<tr>';
      for (let j = 0; j < c; j++) html += '<td>&nbsp;</td>';
      html += '</tr>';
    }
    html += '</tbody></table>';
    execCmd("insertHTML", html);
  };

  const insertLink = () => {
    const url = prompt("Enter URL:", "https://");
    if (url) execCmd("createLink", url);
  };

  const insertImage = () => {
    const url = prompt("Enter image URL:");
    if (url) execCmd("insertImage", url);
  };

  const insertHR = () => execCmd("insertHTML", "<hr>");

  const insertCodeBlock = () => {
    execCmd("insertHTML", "<pre><code>// Your code here</code></pre>");
  };

  // Quick date preset
  const applyDatePreset = (days: number) => {
    const start = new Date();
    const end = addDays(start, days);
    setPublishStartDate(start);
    setPublishEndDate(end);
  };

  // Tag management
  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  // AI tag generation
  const generateTags = async () => {
    const content = getEditorContent();
    if (!content && !title) {
      toast({ title: "No content", description: "Add some content or a title first to generate tags.", variant: "destructive" });
      return;
    }

    setGeneratingTags(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-tags", {
        body: { content, title },
      });

      if (error) throw error;
      if (data?.tags && Array.isArray(data.tags)) {
        const newTags = data.tags.filter((t: string) => !tags.includes(t.toLowerCase()));
        setTags([...tags, ...newTags.map((t: string) => t.toLowerCase())]);
        toast({ title: "Tags generated", description: `Added ${newTags.length} new tags.` });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to generate tags", variant: "destructive" });
    } finally {
      setGeneratingTags(false);
    }
  };

  // AI spot text generation
  const generateSpotText = async () => {
    const content = getEditorContent();
    if (!content && !title) {
      toast({ title: "No content", description: "Add content or title first.", variant: "destructive" });
      return;
    }
    setGeneratingSpotText(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: { type: "spot_text", content, title },
      });
      if (error) throw error;
      if (data?.result) {
        setSpotText(data.result.trim());
        toast({ title: "Spot text generated" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to generate spot text", variant: "destructive" });
    } finally {
      setGeneratingSpotText(false);
    }
  };

  // AI spot image suggestion
  const generateSpotImage = async () => {
    const content = getEditorContent();
    if (!content && !title) {
      toast({ title: "No content", description: "Add content or title first.", variant: "destructive" });
      return;
    }
    setGeneratingSpotImage(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: { type: "spot_image", content, title },
      });
      if (error) throw error;
      if (data?.base64) {
        setSpotImageBase64(data.base64);
        setSpotImageReviewOpen(true);
        toast({ title: "Image generated", description: "Review and save the image." });
      } else {
        throw new Error("No image was returned");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to generate spot image", variant: "destructive" });
    } finally {
      setGeneratingSpotImage(false);
    }
  };

  // AI content generation from prompt
  const generateEditorContent = async () => {
    if (!aiPrompt.trim()) {
      toast({ title: "Error", description: "Please enter a prompt.", variant: "destructive" });
      return;
    }
    setGeneratingContent(true);
    setAiGeneratedContent("");
    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: { type: "editor_content", prompt: aiPrompt },
      });
      if (error) throw error;
      if (data?.result) {
        setAiGeneratedContent(data.result);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to generate content", variant: "destructive" });
    } finally {
      setGeneratingContent(false);
    }
  };

  const insertAiContent = (mode: "replace" | "append") => {
    if (!aiGeneratedContent) return;
    if (mode === "replace") {
      setEditorContent(aiGeneratedContent);
    } else {
      const current = getEditorContent();
      setEditorContent(current + aiGeneratedContent);
    }
    setAiModalOpen(false);
    setAiPrompt("");
    setAiGeneratedContent("");
    toast({ title: "Content inserted" });
  };

  const [gallerySearch, setGallerySearch] = useState("");

  // Gallery query for insert dialog
  const { data: galleries = [], isLoading: galleriesLoading } = useQuery({
    queryKey: ["galleries-for-editor"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("galleries")
        .select("id, name, description, activity_date, gallery_items(id, file_url, thumbnail_url, item_type)")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: galleryModalOpen,
  });

  const filteredGalleries = useMemo(() => {
    if (!gallerySearch.trim()) return galleries;
    const q = gallerySearch.toLowerCase();
    return galleries.filter((g: any) => g.name?.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q));
  }, [galleries, gallerySearch]);

  const insertGallery = async () => {
    if (!selectedGalleryId) {
      toast({ title: "Error", description: "Please select a gallery.", variant: "destructive" });
      return;
    }
    const { data: items, error } = await supabase
      .from("gallery_items")
      .select("*")
      .eq("gallery_id", selectedGalleryId)
      .eq("is_active", true)
      .order("display_order");
    if (error || !items?.length) {
      toast({ title: "Error", description: "No items found in this gallery.", variant: "destructive" });
      return;
    }
    const gallery = galleries.find(g => g.id === selectedGalleryId);
    const galleryName = gallery?.name || "Gallery";
    const totalItems = items.length;
    const previewItems = items.slice(0, 4);

    // Build a styled placeholder embed block with thumbnail strip
    let thumbnailsHtml = previewItems.map((item: any) => {
      const isVideo = item.item_type === "video";
      const src = item.thumbnail_url || item.file_url;
      if (isVideo && !item.thumbnail_url) {
        return `<span style="display:inline-flex;align-items:center;justify-content:center;width:60px;height:60px;border-radius:4px;background:#e5e7eb;color:#374151;font-size:20px;">▶</span>`;
      }
      return `<img src="${src}" alt="${item.alt_text || item.title || ''}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;border:1px solid #ccc;" />`;
    }).join("");
    if (totalItems > 4) {
      thumbnailsHtml += `<span style="display:inline-flex;align-items:center;justify-content:center;width:60px;height:60px;border-radius:4px;background:#e5e7eb;color:#374151;font-size:13px;font-weight:600;">+${totalItems - 4}</span>`;
    }

    const html = `<div data-gallery-id="${selectedGalleryId}" contenteditable="false" style="margin:1em 0;padding:16px;border:2px dashed #94a3b8;border-radius:10px;background:#f8fafc;text-align:left;">` +
      `<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">` +
        `<span style="font-size:18px;">🖼️</span>` +
        `<strong style="font-size:15px;color:#1e293b;">${galleryName}</strong>` +
        `<span style="font-size:12px;color:#64748b;margin-left:auto;">${totalItems} item${totalItems !== 1 ? 's' : ''}</span>` +
      `</div>` +
      `<div style="display:flex;gap:6px;flex-wrap:wrap;">${thumbnailsHtml}</div>` +
    `</div><p><br/></p>`;

    execCmd("insertHTML", html);
    setGalleryModalOpen(false);
    setSelectedGalleryId("");
    toast({ title: "Gallery inserted", description: `"${galleryName}" embedded with ${totalItems} items.` });
  };

  const removeGallery = () => {
    if (editingGalleryElement) {
      editingGalleryElement.remove();
      toast({ title: "Gallery removed" });
    }
    setGalleryModalOpen(false);
    setSelectedGalleryId("");
    setEditingGalleryElement(null);
    setGalleryEditMode("insert");
  };

  const replaceGallery = async () => {
    if (!selectedGalleryId || !editingGalleryElement) return;
    const { data: items } = await supabase
      .from("gallery_items")
      .select("*")
      .eq("gallery_id", selectedGalleryId)
      .eq("is_active", true)
      .order("display_order");
    if (!items?.length) {
      toast({ title: "Error", description: "No items found in this gallery.", variant: "destructive" });
      return;
    }
    const gallery = galleries.find((g: any) => g.id === selectedGalleryId);
    const galleryName = gallery?.name || "Gallery";
    const totalItems = items.length;
    const previewItems = items.slice(0, 4);

    let thumbnailsHtml = previewItems.map((item: any) => {
      const isVideo = item.item_type === "video";
      const src = item.thumbnail_url || item.file_url;
      if (isVideo && !item.thumbnail_url) {
        return `<span style="display:inline-flex;align-items:center;justify-content:center;width:60px;height:60px;border-radius:4px;background:#e5e7eb;color:#374151;font-size:20px;">▶</span>`;
      }
      return `<img src="${src}" alt="${item.alt_text || item.title || ''}" style="width:60px;height:60px;object-fit:cover;border-radius:4px;border:1px solid #ccc;" />`;
    }).join("");
    if (totalItems > 4) {
      thumbnailsHtml += `<span style="display:inline-flex;align-items:center;justify-content:center;width:60px;height:60px;border-radius:4px;background:#e5e7eb;color:#374151;font-size:13px;font-weight:600;">+${totalItems - 4}</span>`;
    }

    const newHtml = `<div data-gallery-id="${selectedGalleryId}" contenteditable="false" style="margin:1em 0;padding:16px;border:2px dashed #94a3b8;border-radius:10px;background:#f8fafc;text-align:left;">` +
      `<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">` +
        `<span style="font-size:18px;">🖼️</span>` +
        `<strong style="font-size:15px;color:#1e293b;">${galleryName}</strong>` +
        `<span style="font-size:12px;color:#64748b;margin-left:auto;">${totalItems} item${totalItems !== 1 ? 's' : ''}</span>` +
      `</div>` +
      `<div style="display:flex;gap:6px;flex-wrap:wrap;">${thumbnailsHtml}</div>` +
    `</div>`;

    editingGalleryElement.outerHTML = newHtml;
    setGalleryModalOpen(false);
    setSelectedGalleryId("");
    setEditingGalleryElement(null);
    setGalleryEditMode("insert");
    toast({ title: "Gallery replaced", description: `Replaced with "${galleryName}" (${totalItems} items).` });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const content = getEditorContent();

    try {
      const payload = {
        author_id: user?.id || author,
        title,
        slug: slug || null,
        short_description: shortDescription || null,
        html_content: content,
        publish_status: publishStatus,
        publish_start_date: publishStartDate?.toISOString() || null,
        publish_end_date: publishEndDate?.toISOString() || null,
        tags,
        display_order: displayOrder,
        spot_text: spotText || null,
        spot_image_url: spotImageUrl || null,
        allow_comments: allowComments,
        show_author_name: showAuthorName,
      } as any;

      if (isEditing) {
        // Save current version to history before updating
        const { data: current } = await supabase.from("contents").select("*").eq("id", editId).single();
        if (current) {
          const { data: lastVersion } = await supabase
            .from("content_history")
            .select("version_number")
            .eq("content_id", editId)
            .order("version_number", { ascending: false })
            .limit(1)
            .single();
          const nextVersion = (lastVersion?.version_number || 0) + 1;
          await supabase.from("content_history").insert({
            content_id: editId,
            version_number: nextVersion,
            title: current.title,
            slug: current.slug,
            short_description: current.short_description,
            html_content: current.html_content,
            spot_text: (current as any).spot_text,
            spot_image_url: (current as any).spot_image_url,
            tags: (current.tags as string[]) || [],
            publish_status: current.publish_status,
            allow_comments: (current as any).allow_comments ?? false,
            show_author_name: (current as any).show_author_name ?? true,
            changed_by: user?.id || "",
            change_summary: `Updated content`,
          });
        }

        const { error } = await supabase.from("contents").update(payload).eq("id", editId);
        if (error) throw error;
        toast({ title: "Success!", description: "Content updated successfully." });
        logAction("update", "content", editId!, { title });
      } else {
        const { data, error } = await supabase.from("contents").insert(payload).select().single();
        if (error) throw error;
        toast({ title: "Success!", description: "Content created successfully." });
        logAction("create", "content", data.id, { title });
      }
      navigate("/admin/contents/list");
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "An error occurred.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">{isEditing ? "Edit Content" : "Add New Content"}</h2>

      <Tabs defaultValue="form">
        <TabsList>
          <TabsTrigger value="form">Content Form</TabsTrigger>
          <TabsTrigger value="preview"><Eye className="h-3.5 w-3.5 mr-1" />Preview</TabsTrigger>
          {isEditing && <TabsTrigger value="history">Content History</TabsTrigger>}
        </TabsList>

        {/* ===== CONTENT FORM TAB ===== */}
        <TabsContent value="form">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs defaultValue="basic">
                  <TabsList className="mb-4">
                    <TabsTrigger value="basic">Basic Information</TabsTrigger>
                    <TabsTrigger value="additional">Additional Fields</TabsTrigger>
                    {isEditing && <TabsTrigger value="metadata">Meta Data</TabsTrigger>}
                  </TabsList>

                  {/* --- Basic Information Sub-Tab --- */}
                  <TabsContent value="basic" className="space-y-6">
                    {/* Author & Title */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Author</Label>
                        <Input
                          placeholder="Author name or ID"
                          value={author || user?.email || ""}
                          onChange={(e) => setAuthor(e.target.value)}
                          disabled
                        />
                        <p className="text-xs text-muted-foreground">Auto-assigned to current user</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Title *</Label>
                        <Input placeholder="Content title" value={title} onChange={(e) => setTitle(e.target.value)} />
                      </div>
                    </div>

                    {/* Slug & Short Description */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Slug</Label>
                        <Input placeholder="url-friendly-slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Short Description</Label>
                        <Input placeholder="Brief summary" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} />
                      </div>
                    </div>

                    {/* Publish Date Range & Status */}
                    <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Label className="text-base font-semibold">Publishing</Label>
                        <span className="text-xs text-muted-foreground">Quick presets:</span>
                        {DATE_PRESETS.map((preset) => (
                          <Button
                            key={preset.days}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => applyDatePreset(preset.days)}
                          >
                            {preset.label}
                          </Button>
                        ))}
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Start Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !publishStartDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {publishStartDate ? format(publishStartDate, "PPP") : "Pick a date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={publishStartDate} onSelect={setPublishStartDate} initialFocus />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-2">
                          <Label>End Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !publishEndDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {publishEndDate ? format(publishEndDate, "PPP") : "Pick a date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={publishEndDate} onSelect={setPublishEndDate} initialFocus />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-2">
                          <Label>Publish Status</Label>
                          <Select value={publishStatus} onValueChange={setPublishStatus}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {PUBLISH_STATUSES.map((s) => (
                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Rich Text Editor */}
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Content Editor</Label>
                      <div
                        ref={editorContainerRef}
                        className={cn(
                          "rounded-lg border overflow-hidden flex flex-col",
                          isFullscreen && "fixed inset-0 z-[9999] bg-background rounded-none"
                        )}
                      >
                        <div className="border-b bg-muted/40">
                          {/* Menu Bar Row 1 */}
                          <div className="flex flex-wrap gap-0.5 p-1 border-b">
                            <EditorMenuButton onClick={() => execCmd("undo")} label="Undo" />
                            <EditorMenuButton onClick={() => execCmd("redo")} label="Redo" />
                            <span className="w-px bg-border mx-1" />
                            <EditorMenuButton onClick={() => execCmd("cut")} label="Cut" />
                            <EditorMenuButton onClick={() => execCmd("copy")} label="Copy" />
                            <EditorMenuButton onClick={() => execCmd("paste")} label="Paste" />
                            <EditorMenuButton onClick={() => execCmd("selectAll")} label="Select All" />
                            <span className="w-px bg-border mx-1" />
                            <EditorMenuButton onClick={() => execCmd("removeFormat")} label="Clear Format" />
                            <EditorMenuButton onClick={() => {
                              const html = getEditorContent();
                              const blob = new Blob([html], { type: "text/html" });
                              const a = document.createElement("a");
                              a.href = URL.createObjectURL(blob);
                              a.download = `${slug || "content"}.html`;
                              a.click();
                            }} label="Export HTML" />
                          </div>

                          {/* Menu Bar Row 2 */}
                          <div className="flex flex-wrap gap-0.5 p-1 border-b">
                            <select className="h-7 text-xs border rounded px-1 bg-background" onChange={(e) => execCmd("formatBlock", e.target.value)} defaultValue="">
                              <option value="" disabled>Block Format</option>
                              <option value="p">Paragraph</option>
                              <option value="h1">Heading 1</option>
                              <option value="h2">Heading 2</option>
                              <option value="h3">Heading 3</option>
                              <option value="h4">Heading 4</option>
                              <option value="h5">Heading 5</option>
                              <option value="h6">Heading 6</option>
                              <option value="pre">Preformatted</option>
                              <option value="blockquote">Blockquote</option>
                            </select>
                            <select className="h-7 text-xs border rounded px-1 bg-background" onChange={(e) => execCmd("fontName", e.target.value)} defaultValue="">
                              <option value="" disabled>Font Family</option>
                              <option value="Arial">Arial</option>
                              <option value="Georgia">Georgia</option>
                              <option value="Times New Roman">Times New Roman</option>
                              <option value="Courier New">Courier New</option>
                              <option value="Verdana">Verdana</option>
                              <option value="Trebuchet MS">Trebuchet MS</option>
                            </select>
                            <select className="h-7 text-xs border rounded px-1 bg-background" onChange={(e) => execCmd("fontSize", e.target.value)} defaultValue="">
                              <option value="" disabled>Size</option>
                              <option value="1">Very Small</option>
                              <option value="2">Small</option>
                              <option value="3">Normal</option>
                              <option value="4">Medium</option>
                              <option value="5">Large</option>
                              <option value="6">Very Large</option>
                              <option value="7">Huge</option>
                            </select>
                          </div>

                          {/* Menu Bar Row 3 */}
                          <div className="flex flex-wrap gap-0.5 p-1 border-b">
                            <EditorMenuButton onClick={() => execCmd("bold")} label="B" className="font-bold" />
                            <EditorMenuButton onClick={() => execCmd("italic")} label="I" className="italic" />
                            <EditorMenuButton onClick={() => execCmd("underline")} label="U" className="underline" />
                            <EditorMenuButton onClick={() => execCmd("strikeThrough")} label="S" className="line-through" />
                            <EditorMenuButton onClick={() => execCmd("subscript")} label="X₂" />
                            <EditorMenuButton onClick={() => execCmd("superscript")} label="X²" />
                            <span className="w-px bg-border mx-1" />
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">Text:</span>
                              <input type="color" className="h-6 w-6 cursor-pointer border rounded" onChange={(e) => execCmd("foreColor", e.target.value)} title="Text Color" />
                              <span className="text-xs text-muted-foreground">Bg:</span>
                              <input type="color" className="h-6 w-6 cursor-pointer border rounded" defaultValue="#ffff00" onChange={(e) => execCmd("hiliteColor", e.target.value)} title="Highlight Color" />
                            </div>
                          </div>

                          {/* Menu Bar Row 4 */}
                          <div className="flex flex-wrap gap-0.5 p-1 border-b">
                            <EditorMenuButton onClick={() => execCmd("justifyLeft")} label="Left" />
                            <EditorMenuButton onClick={() => execCmd("justifyCenter")} label="Center" />
                            <EditorMenuButton onClick={() => execCmd("justifyRight")} label="Right" />
                            <EditorMenuButton onClick={() => execCmd("justifyFull")} label="Justify" />
                            <span className="w-px bg-border mx-1" />
                            <EditorMenuButton onClick={() => execCmd("insertUnorderedList")} label="• List" />
                            <EditorMenuButton onClick={() => execCmd("insertOrderedList")} label="1. List" />
                            <EditorMenuButton onClick={() => execCmd("indent")} label="Indent →" />
                            <EditorMenuButton onClick={() => execCmd("outdent")} label="← Outdent" />
                          </div>

                          {/* Menu Bar Row 5 */}
                          <div className="flex flex-wrap gap-0.5 p-1">
                            <EditorMenuButton onClick={insertLink} label="🔗 Link" />
                            <EditorMenuButton onClick={() => execCmd("unlink")} label="Unlink" />
                            <EditorMenuButton onClick={insertImage} label="🖼 Image" />
                            <EditorMenuButton onClick={insertTable} label="⊞ Table" />
                            <EditorMenuButton onClick={insertHR} label="— Line" />
                            <EditorMenuButton onClick={insertCodeBlock} label="</> Code" />
                            <EditorMenuButton onClick={() => execCmd("insertHTML", "&nbsp;&nbsp;&nbsp;&nbsp;")} label="Tab" />
                            <button
                              type="button"
                              onClick={() => setGalleryModalOpen(true)}
                              className="h-7 px-2 text-xs rounded hover:bg-accent hover:text-accent-foreground transition-colors whitespace-nowrap flex items-center gap-1"
                            >
                              <GalleryHorizontalEnd className="h-3.5 w-3.5" />
                              Gallery
                            </button>
                            <EditorMenuButton onClick={() => setIsFullscreen(!isFullscreen)} label={isFullscreen ? "✕ Exit Fullscreen" : "⛶ Fullscreen"} />
                            <span className="w-px bg-border mx-1" />
                            <button
                              type="button"
                              onClick={() => setAiModalOpen(true)}
                              className="h-7 px-3 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap flex items-center gap-1 font-medium"
                            >
                              <Wand2 className="h-3.5 w-3.5" />
                              AI Generate
                            </button>
                          </div>
                        </div>

                        <iframe
                          ref={editorRef}
                          srcDoc="<!DOCTYPE html><html><head></head><body></body></html>"
                          onLoad={handleEditorLoad}
                          className={cn("w-full border-0", isFullscreen && "flex-1")}
                          style={isFullscreen ? { minHeight: 0 } : { minHeight: "400px", height: "400px" }}
                          title="Content Editor"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* --- Additional Fields Sub-Tab --- */}
                  <TabsContent value="additional" className="space-y-6">
                    {/* Spot Text & Spot Image */}
                    <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                      <Label className="text-base font-semibold">Spot Content</Label>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Spot Text</Label>
                            <Button type="button" variant="outline" size="sm" onClick={generateSpotText} disabled={generatingSpotText} className="h-7">
                              {generatingSpotText ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                              AI Generate
                            </Button>
                          </div>
                          <Input placeholder="Short spot text" value={spotText} onChange={(e) => setSpotText(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Spot Image URL</Label>
                            <Button type="button" variant="outline" size="sm" onClick={generateSpotImage} disabled={generatingSpotImage} className="h-7">
                              {generatingSpotImage ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                              AI Suggest
                            </Button>
                          </div>
                          <Input placeholder="https://example.com/image.jpg" value={spotImageUrl} onChange={(e) => setSpotImageUrl(e.target.value)} />
                          {spotImageUrl && (
                            <img src={spotImageUrl} alt="Spot preview" className="h-20 w-auto rounded border object-cover mt-1" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Content Settings */}
                    <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                      <Label className="text-base font-semibold">Content Settings</Label>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="allowComments"
                            checked={allowComments}
                            onCheckedChange={(checked) => setAllowComments(checked === true)}
                          />
                          <Label htmlFor="allowComments" className="cursor-pointer">Allow Comments</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="showAuthorName"
                            checked={showAuthorName}
                            onCheckedChange={(checked) => setShowAuthorName(checked === true)}
                          />
                          <Label htmlFor="showAuthorName" className="cursor-pointer">Show Author Name</Label>
                        </div>
                      </div>
                    </div>

                    {/* Display Order */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Display Order</Label>
                        <Input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)} />
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">Tags</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={generateTags}
                          disabled={generatingTags}
                        >
                          {generatingTags ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
                          Generate with AI
                        </Button>
                      </div>

                      <div className="flex gap-2">
                        <Input
                          placeholder="Type a tag and press Enter"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleTagKeyDown}
                          className="flex-1"
                        />
                        <Button type="button" variant="outline" size="sm" onClick={addTag}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="gap-1">
                              {tag}
                              <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* --- Meta Data Sub-Tab --- */}
                  {isEditing && editId && (
                    <TabsContent value="metadata" className="space-y-6">
                      <ContentMetaDataTab contentId={editId} />
                    </TabsContent>
                  )}
                </Tabs>

                {/* Submit - always visible */}
                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {isEditing ? "Update Content" : "Create Content"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate("/admin/contents/list")}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== CONTENT PREVIEW TAB ===== */}
        <TabsContent value="preview">
          <ContentPreview
            content={{
              id: editId || "",
              title: title || "Untitled",
              slug,
              short_description: shortDescription,
              html_content: getEditorContent() || htmlContent,
              publish_status: publishStatus,
              publish_start_date: publishStartDate?.toISOString() || null,
              publish_end_date: publishEndDate?.toISOString() || null,
              tags,
              spot_text: spotText,
              spot_image_url: spotImageUrl,
              allow_comments: allowComments,
              show_author_name: showAuthorName,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              author_id: user?.id || author,
            }}
            inline
          />
        </TabsContent>

        {/* ===== CONTENT HISTORY TAB ===== */}
        {isEditing && (
          <TabsContent value="history">
            <Card>
              <CardContent className="pt-6">
                <ContentHistoryPanel
                  editId={editId!}
                  onRestore={(v) => {
                    setTitle(v.title);
                    setSlug(v.slug || "");
                    setShortDescription(v.short_description || "");
                    setEditorContent(v.html_content || "");
                    setHtmlContent(v.html_content || "");
                    setSpotText(v.spot_text || "");
                    setSpotImageUrl(v.spot_image_url || "");
                    setTags(v.tags || []);
                    setPublishStatus(v.publish_status || "draft");
                    setAllowComments(v.allow_comments ?? false);
                    setShowAuthorName(v.show_author_name ?? true);
                    toast({ title: "Version restored", description: `Restored to v${v.version_number}. Switch to Content Form and save to apply.` });
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* AI Content Generation Modal */}
      <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              AI Content Generator
            </DialogTitle>
            <DialogDescription>Enter a prompt to generate HTML content. Review and edit before inserting.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="space-y-2">
              <Label>Prompt</Label>
              <Textarea
                placeholder="e.g. Write an article about HVAC maintenance tips for homeowners..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={3}
              />
              <Button type="button" onClick={generateEditorContent} disabled={generatingContent} size="sm">
                {generatingContent ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
                Generate
              </Button>
            </div>

            {aiGeneratedContent && (
              <div className="space-y-2 flex-1 overflow-hidden flex flex-col">
                <Label>Generated Content (preview & edit)</Label>
                <Textarea
                  value={aiGeneratedContent}
                  onChange={(e) => setAiGeneratedContent(e.target.value)}
                  className="flex-1 min-h-[200px] font-mono text-xs"
                />
              </div>
            )}
          </div>

          {aiGeneratedContent && (
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => insertAiContent("append")}>
                Append to Editor
              </Button>
              <Button type="button" onClick={() => insertAiContent("replace")}>
                Replace Editor Content
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Spot Image Review Dialog */}
      <SpotImageReviewDialog
        open={spotImageReviewOpen}
        onOpenChange={setSpotImageReviewOpen}
        base64={spotImageBase64}
        onSaved={(publicUrl) => {
          setSpotImageUrl(publicUrl);
          setSpotImageBase64(null);
          toast({ title: "Spot image saved", description: "Image has been resized and saved to File Manager." });
        }}
      />

      {/* Gallery Insert Dialog */}
      <Dialog open={galleryModalOpen} onOpenChange={(open) => { setGalleryModalOpen(open); if (!open) { setGallerySearch(""); setSelectedGalleryId(""); } }}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-5 pt-5 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <GalleryHorizontalEnd className="h-5 w-5" />
              Insert Gallery
            </DialogTitle>
            <DialogDescription>Search and select a gallery to embed.</DialogDescription>
          </DialogHeader>
          <div className="px-5 pt-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={gallerySearch}
                onChange={(e) => setGallerySearch(e.target.value)}
                placeholder="Search galleries…"
                className="pl-8 h-9 text-sm"
              />
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-2 space-y-1.5">
            {galleriesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredGalleries.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                {galleries.length === 0 ? "No active galleries found. Create one in the Gallery module first." : "No galleries match your search."}
              </div>
            ) : (
              filteredGalleries.map((g: any) => {
                const allItems = g.gallery_items || [];
                const itemCount = allItems.length;
                const thumbItems = allItems.slice(0, 4);
                const isSelected = selectedGalleryId === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGalleryId(g.id)}
                    className={cn(
                      "w-full text-left rounded-lg border p-3 transition-colors",
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Thumbnail strip */}
                      <div className="shrink-0 flex gap-0.5">
                        {thumbItems.length > 0 ? thumbItems.map((it: any, i: number) => {
                          const isVideo = it.item_type === "video";
                          const src = it.thumbnail_url || it.file_url;
                          return (
                            <div key={i} className="w-10 h-10 rounded overflow-hidden bg-muted border relative">
                              {isVideo && !it.thumbnail_url ? (
                                <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs">▶</div>
                              ) : (
                                <img src={src} alt="" className="w-full h-full object-cover" />
                              )}
                            </div>
                          );
                        }) : (
                          <div className="w-10 h-10 rounded bg-muted border flex items-center justify-center">
                            <GalleryHorizontalEnd className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{g.name}</span>
                          <Badge variant="secondary" className="shrink-0 text-xs">{itemCount} items</Badge>
                        </div>
                        {g.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{g.description}</p>
                        )}
                        {g.activity_date && (
                          <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(g.activity_date), "MMM d, yyyy")}</p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
          {selectedGalleryId && (
            <div className="px-5 pb-2">
              <GalleryPreviewStrip galleryId={selectedGalleryId} />
            </div>
          )}
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t">
            <Button type="button" variant="outline" size="sm" onClick={() => setGalleryModalOpen(false)}>Cancel</Button>
            <Button type="button" size="sm" onClick={insertGallery} disabled={!selectedGalleryId}>Insert Gallery</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Content History as a standalone panel for the tab
const ContentHistoryPanel = ({ editId, onRestore }: { editId: string; onRestore: (v: any) => void }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("content_history")
        .select("*")
        .eq("content_id", editId)
        .order("version_number", { ascending: false });
      setHistory(data || []);
      setLoading(false);
    };
    load();
  }, [editId]);

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (history.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No version history yet. History is saved each time you update content.</p>;
  }

  return (
    <div className="space-y-3">
      {history.map((v) => (
        <div key={v.id} className="rounded-lg border p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">v{v.version_number}</Badge>
              <span className="font-medium text-sm">{v.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {format(new Date(v.created_at), "MMM d, yyyy h:mm a")}
              </span>
              <Button type="button" variant="outline" size="sm" onClick={() => onRestore(v)}>
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Restore
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs">{v.publish_status}</Badge>
            {v.tags?.slice(0, 3).map((t: string) => (
              <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Small helper button for editor toolbar
const EditorMenuButton = ({
  onClick,
  label,
  className = "",
}: {
  onClick: () => void;
  label: string;
  className?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "h-7 px-2 text-xs rounded hover:bg-accent hover:text-accent-foreground transition-colors whitespace-nowrap",
      className
    )}
  >
    {label}
  </button>
);

export default ContentAdd;
