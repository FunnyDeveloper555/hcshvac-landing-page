import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles, ImageIcon, Video, Download } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface AIGenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFolderId: string | null;
}

export function AIGenerateDialog({ open, onOpenChange, currentFolderId }: AIGenerateDialogProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"image" | "video">("image");
  const [prompt, setPrompt] = useState("");
  const [fileName, setFileName] = useState("");
  const [imageSize, setImageSize] = useState("1024x1024");
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);

  const reset = () => {
    setPrompt("");
    setFileName("");
    setPreviewUrl(null);
    setGeneratedBlob(null);
    setGenerating(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    setGenerating(true);
    setPreviewUrl(null);
    setGeneratedBlob(null);

    try {
      if (activeTab === "image") {
        const { data, error } = await supabase.functions.invoke("generate-content", {
          body: { type: "spot_image", title: prompt, content: prompt },
        });
        if (error) throw error;
        if (!data?.base64) throw new Error("No image was generated");

        setPreviewUrl(data.base64);

        // Convert base64 to blob for saving
        const res = await fetch(data.base64);
        const blob = await res.blob();
        setGeneratedBlob(blob);

        if (!fileName) {
          const slug = prompt.slice(0, 40).replace(/[^a-zA-Z0-9]+/g, "-").replace(/-+$/, "").toLowerCase();
          setFileName(`ai-${slug}`);
        }
      } else {
        // Video generation via videogen tool - use edge function
        const { data, error } = await supabase.functions.invoke("generate-ai-video", {
          body: { prompt: prompt.trim() },
        });
        if (error) throw error;
        if (!data?.video_url) throw new Error("No video was generated");

        setPreviewUrl(data.video_url);

        const res = await fetch(data.video_url);
        const blob = await res.blob();
        setGeneratedBlob(blob);

        if (!fileName) {
          const slug = prompt.slice(0, 40).replace(/[^a-zA-Z0-9]+/g, "-").replace(/-+$/, "").toLowerCase();
          setFileName(`ai-video-${slug}`);
        }
      }

      toast.success(`${activeTab === "image" ? "Image" : "Video"} generated successfully!`);
    } catch (err: any) {
      console.error("AI generation error:", err);
      toast.error(err.message || "Failed to generate media");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedBlob) return;
    setGenerating(true);

    try {
      const ext = activeTab === "image" ? "png" : "mp4";
      const safeName = (fileName || `ai-generated-${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, "-");
      const fullName = `${safeName}.${ext}`;
      const storagePath = `${crypto.randomUUID()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("file-manager")
        .upload(storagePath, generatedBlob, {
          contentType: activeTab === "image" ? "image/png" : "video/mp4",
        });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("file-manager")
        .getPublicUrl(storagePath);

      const { error: dbErr } = await supabase.from("file_items").insert({
        name: fullName,
        folder_id: currentFolderId,
        storage_path: storagePath,
        file_url: urlData.publicUrl,
        file_size: generatedBlob.size,
        mime_type: activeTab === "image" ? "image/png" : "video/mp4",
        created_by: (await supabase.auth.getUser()).data.user?.id || "",
      });
      if (dbErr) throw dbErr;

      queryClient.invalidateQueries({ queryKey: ["file-manager-files"] });
      toast.success(`${fullName} saved to file manager`);
      handleClose(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save file");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Media Generator
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as "image" | "video"); setPreviewUrl(null); setGeneratedBlob(null); }}>
          <TabsList className="w-full">
            <TabsTrigger value="image" className="flex-1 gap-1.5">
              <ImageIcon className="h-4 w-4" /> Generate Image
            </TabsTrigger>
            <TabsTrigger value="video" className="flex-1 gap-1.5">
              <Video className="h-4 w-4" /> Generate Video
            </TabsTrigger>
          </TabsList>

          <TabsContent value="image" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Describe the image you want to create</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. A professional photo of a modern HVAC system installed in a residential home, bright natural lighting, clean and organized"
                rows={3}
                disabled={generating}
              />
            </div>
            <div className="space-y-2">
              <Label>File Name (optional)</Label>
              <Input
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Auto-generated from prompt"
                disabled={generating}
              />
            </div>
          </TabsContent>

          <TabsContent value="video" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Describe the video you want to create</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. A timelapse of a plumbing repair being done in a modern kitchen, professional lighting"
                rows={3}
                disabled={generating}
              />
            </div>
            <div className="space-y-2">
              <Label>File Name (optional)</Label>
              <Input
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Auto-generated from prompt"
                disabled={generating}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Preview */}
        {previewUrl && (
          <div className="border rounded-lg overflow-hidden bg-muted/30">
            <div className="p-2 border-b bg-muted/50">
              <span className="text-xs font-medium text-muted-foreground">Preview</span>
            </div>
            <div className="p-3 flex justify-center">
              {activeTab === "image" ? (
                <img
                  src={previewUrl}
                  alt="AI generated preview"
                  className="max-h-64 rounded object-contain"
                />
              ) : (
                <video
                  src={previewUrl}
                  controls
                  className="max-h-64 rounded w-full"
                />
              )}
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {!previewUrl ? (
            <Button onClick={handleGenerate} disabled={generating || !prompt.trim()} className="w-full sm:w-auto">
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate {activeTab === "image" ? "Image" : "Video"}
                </>
              )}
            </Button>
          ) : (
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => { setPreviewUrl(null); setGeneratedBlob(null); }} disabled={generating}>
                Regenerate
              </Button>
              <Button onClick={handleSave} disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Save to File Manager
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
