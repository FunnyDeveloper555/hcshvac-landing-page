import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, X, CalendarIcon, Sparkles, Plus, Wand2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAdminLog } from "@/hooks/useAdminLog";
import { useAuth } from "@/hooks/useAuth";
import { format, addDays, addMonths, addYears } from "date-fns";
import { cn } from "@/lib/utils";

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
      if (data?.searchQuery) {
        const imageUrl = `https://source.unsplash.com/800x400/?${encodeURIComponent(data.searchQuery)}`;
        setSpotImageUrl(imageUrl);
        toast({ title: "Spot image suggested", description: `Search: "${data.searchQuery}"` });
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
      } as any;

      if (isEditing) {
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

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  {/* Menu Bar Row 1 - File/Edit actions */}
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

                  {/* Menu Bar Row 2 - Format Block */}
                  <div className="flex flex-wrap gap-0.5 p-1 border-b">
                    <select
                      className="h-7 text-xs border rounded px-1 bg-background"
                      onChange={(e) => execCmd("formatBlock", e.target.value)}
                      defaultValue=""
                    >
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
                    <select
                      className="h-7 text-xs border rounded px-1 bg-background"
                      onChange={(e) => execCmd("fontName", e.target.value)}
                      defaultValue=""
                    >
                      <option value="" disabled>Font Family</option>
                      <option value="Arial">Arial</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Verdana">Verdana</option>
                      <option value="Trebuchet MS">Trebuchet MS</option>
                    </select>
                    <select
                      className="h-7 text-xs border rounded px-1 bg-background"
                      onChange={(e) => execCmd("fontSize", e.target.value)}
                      defaultValue=""
                    >
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

                  {/* Menu Bar Row 3 - Formatting */}
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

                  {/* Menu Bar Row 4 - Alignment & Lists */}
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

                  {/* Menu Bar Row 5 - Insert */}
                  <div className="flex flex-wrap gap-0.5 p-1">
                    <EditorMenuButton onClick={insertLink} label="🔗 Link" />
                    <EditorMenuButton onClick={() => execCmd("unlink")} label="Unlink" />
                    <EditorMenuButton onClick={insertImage} label="🖼 Image" />
                    <EditorMenuButton onClick={insertTable} label="⊞ Table" />
                    <EditorMenuButton onClick={insertHR} label="— Line" />
                    <EditorMenuButton onClick={insertCodeBlock} label="</> Code" />
                    <EditorMenuButton onClick={() => execCmd("insertHTML", "&nbsp;&nbsp;&nbsp;&nbsp;")} label="Tab" />
                    <EditorMenuButton onClick={() => setIsFullscreen(!isFullscreen)} label={isFullscreen ? "✕ Exit Fullscreen" : "⛶ Fullscreen"} />
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

            {/* Spot Text & Spot Image */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
              <Label className="text-base font-semibold">Spot Content</Label>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Spot Text</Label>
                  <Input placeholder="Short spot text" value={spotText} onChange={(e) => setSpotText(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Spot Image URL</Label>
                  <Input placeholder="https://example.com/image.jpg" value={spotImageUrl} onChange={(e) => setSpotImageUrl(e.target.value)} />
                  {spotImageUrl && (
                    <img src={spotImageUrl} alt="Spot preview" className="h-20 w-auto rounded border object-cover mt-1" />
                  )}
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

            {/* Submit */}
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
