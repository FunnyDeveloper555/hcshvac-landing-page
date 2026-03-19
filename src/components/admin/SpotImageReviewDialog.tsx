import { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Loader2, FolderOpen } from "lucide-react";
import { FileManagerPicker } from "@/components/admin/filemanager/FileManagerPicker";
import { supabase } from "@/integrations/supabase/client";

interface SpotImageReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Base64 data URL of the generated image */
  base64: string | null;
  /** Called with the final public URL after save */
  onSaved: (publicUrl: string) => void;
}

export function SpotImageReviewDialog({
  open,
  onOpenChange,
  base64,
  onSaved,
}: SpotImageReviewDialogProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [naturalW, setNaturalW] = useState(0);
  const [naturalH, setNaturalH] = useState(0);

  // Resize
  const [resizeW, setResizeW] = useState(0);
  const [resizeH, setResizeH] = useState(0);
  const [lockAspect, setLockAspect] = useState(true);
  const aspectRatio = useRef(1);

  // File destination
  const [fileName, setFileName] = useState("spot-image.png");
  const [destFolder, setDestFolder] = useState<string | null>(null);
  const [destFolderName, setDestFolderName] = useState("Root");
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);

  const [saving, setSaving] = useState(false);

  // Load image from base64
  useEffect(() => {
    if (!base64 || !open) return;
    setLoaded(false);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setNaturalW(img.naturalWidth);
      setNaturalH(img.naturalHeight);
      setResizeW(img.naturalWidth);
      setResizeH(img.naturalHeight);
      aspectRatio.current = img.naturalWidth / img.naturalHeight;
      setLoaded(true);
    };
    img.src = base64;
  }, [base64, open]);

  const handleResizeWChange = (val: string) => {
    const w = Math.max(1, parseInt(val) || 1);
    setResizeW(w);
    if (lockAspect) setResizeH(Math.round(w / aspectRatio.current));
  };

  const handleResizeHChange = (val: string) => {
    const h = Math.max(1, parseInt(val) || 1);
    setResizeH(h);
    if (lockAspect) setResizeW(Math.round(h * aspectRatio.current));
  };

  const handleResizeScale = (pct: number[]) => {
    const p = pct[0] / 100;
    setResizeW(Math.round(naturalW * p));
    setResizeH(Math.round(naturalH * p));
  };

  const handleFolderSelect = (_fileUrl: string, folderName: string) => {
    // FileManagerPicker returns file URL, but we use it to pick a folder context
    // We'll use a workaround: extract folder path from the selected file's URL
    setFolderPickerOpen(false);
  };

  const handleSave = useCallback(async () => {
    if (!imgRef.current || !loaded) return;
    setSaving(true);

    try {
      // Render resized image to canvas
      const canvas = document.createElement("canvas");
      canvas.width = resizeW;
      canvas.height = resizeH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      ctx.drawImage(imgRef.current, 0, 0, resizeW, resizeH);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png", 0.92)
      );
      if (!blob) throw new Error("Failed to create image blob");

      // Build storage path
      const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_") || "spot-image.png";
      const finalName = safeName.endsWith(".png") ? safeName : `${safeName}.png`;
      const storagePath = destFolder ? `${destFolder}/${finalName}` : finalName;

      // Upload to file-manager bucket
      const { error: uploadError } = await supabase.storage
        .from("file-manager")
        .upload(storagePath, blob, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("file-manager")
        .getPublicUrl(storagePath);

      onSaved(publicUrlData.publicUrl);
      onOpenChange(false);
    } catch (err: any) {
      console.error("Save error:", err);
      alert(err.message || "Failed to save image");
    } finally {
      setSaving(false);
    }
  }, [loaded, resizeW, resizeH, fileName, destFolder, onSaved, onOpenChange]);

  // Preview dimensions
  const MAX_PREVIEW = 360;
  const previewScale = loaded
    ? Math.min(1, MAX_PREVIEW / naturalW, MAX_PREVIEW / naturalH)
    : 1;

  if (!base64) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Review & Save AI Spot Image</DialogTitle>
          </DialogHeader>

          {!loaded ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto">
              {/* Preview */}
              <div className="flex justify-center rounded-lg border bg-muted/20 p-3">
                <img
                  src={base64}
                  alt="AI Generated"
                  className="rounded object-contain"
                  style={{
                    maxWidth: MAX_PREVIEW,
                    maxHeight: MAX_PREVIEW,
                    width: naturalW * previewScale,
                    height: naturalH * previewScale,
                  }}
                />
              </div>

              {/* Resize controls */}
              <div className="rounded-lg border p-3 space-y-3">
                <Label className="text-sm font-semibold">Resize</Label>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-xs">W</Label>
                    <Input
                      type="number"
                      className="h-8 w-20"
                      value={resizeW}
                      onChange={(e) => handleResizeWChange(e.target.value)}
                      min={1}
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Label className="text-xs">H</Label>
                    <Input
                      type="number"
                      className="h-8 w-20"
                      value={resizeH}
                      onChange={(e) => handleResizeHChange(e.target.value)}
                      min={1}
                    />
                  </div>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lockAspect}
                      onChange={(e) => setLockAspect(e.target.checked)}
                      className="rounded"
                    />
                    Lock ratio
                  </label>
                  <span className="text-xs text-muted-foreground">
                    Original: {naturalW} × {naturalH}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Label className="text-xs shrink-0">Scale</Label>
                  <Slider
                    min={10}
                    max={200}
                    step={1}
                    value={[Math.round((resizeW / naturalW) * 100)]}
                    onValueChange={handleResizeScale}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-10 text-right">
                    {Math.round((resizeW / naturalW) * 100)}%
                  </span>
                </div>
              </div>

              {/* Save destination */}
              <div className="rounded-lg border p-3 space-y-3">
                <Label className="text-sm font-semibold">Save To</Label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-xs">File Name</Label>
                    <Input
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      placeholder="spot-image.png"
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs shrink-0">Folder:</Label>
                  <span className="text-sm text-muted-foreground truncate flex-1">
                    {destFolderName || "Root"}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1"
                    onClick={() => setFolderPickerOpen(true)}
                  >
                    <FolderOpen className="h-3.5 w-3.5" /> Browse
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!loaded || saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" /> Saving…
                </>
              ) : (
                "Save Image"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Folder picker - reuses FileManagerPicker in folder-select mode */}
      <FolderPickerDialog
        open={folderPickerOpen}
        onOpenChange={setFolderPickerOpen}
        onSelect={(folderId, folderName) => {
          setDestFolder(folderId);
          setDestFolderName(folderName);
          setFolderPickerOpen(false);
        }}
      />
    </>
  );
}

/** Lightweight folder picker that lists file-manager folders */
function FolderPickerDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (folderId: string | null, folderName: string) => void;
}) {
  const [folders, setFolders] = useState<{ id: string; name: string; parent_id: string | null }[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase
      .from("file_manager_folders")
      .select("id, name, parent_id")
      .order("name")
      .then(({ data }) => {
        setFolders(data || []);
        setLoading(false);
      });
  }, [open]);

  const getPath = (id: string | null): string => {
    if (!id) return "Root";
    const folder = folders.find((f) => f.id === id);
    if (!folder) return "Root";
    const parentPath = getPath(folder.parent_id);
    return parentPath === "Root" ? folder.name : `${parentPath} / ${folder.name}`;
  };

  const rootFolders = folders.filter((f) => !f.parent_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Destination Folder</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="max-h-60 overflow-y-auto space-y-0.5">
            <button
              type="button"
              className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                selectedId === null ? "bg-accent text-accent-foreground font-medium" : "hover:bg-muted"
              }`}
              onClick={() => setSelectedId(null)}
            >
              📁 Root (top-level)
            </button>
            {renderFolderTree(rootFolders, folders, selectedId, setSelectedId, 1)}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => onSelect(selectedId, getPath(selectedId))}
          >
            Select
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function renderFolderTree(
  items: { id: string; name: string; parent_id: string | null }[],
  all: { id: string; name: string; parent_id: string | null }[],
  selectedId: string | null,
  setSelectedId: (id: string | null) => void,
  depth: number
): React.ReactNode {
  return items.map((folder) => {
    const children = all.filter((f) => f.parent_id === folder.id);
    return (
      <div key={folder.id}>
        <button
          type="button"
          className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${
            selectedId === folder.id ? "bg-accent text-accent-foreground font-medium" : "hover:bg-muted"
          }`}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
          onClick={() => setSelectedId(folder.id)}
        >
          📁 {folder.name}
        </button>
        {children.length > 0 && renderFolderTree(children, all, selectedId, setSelectedId, depth + 1)}
      </div>
    );
  });
}
