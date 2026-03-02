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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crop, Maximize, RotateCcw, Loader2 } from "lucide-react";

type CropShape = "rectangle" | "square" | "circle";

interface CropArea {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface ImageEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** URL of existing file, or object URL for pre-upload editing */
  imageUrl: string | null;
  /** Original file name */
  imageName: string;
  /** Called with the edited File blob */
  onSave: (file: File) => void;
  isPending?: boolean;
}

export function ImageEditorDialog({
  open,
  onOpenChange,
  imageUrl,
  imageName,
  onSave,
  isPending,
}: ImageEditorDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [loaded, setLoaded] = useState(false);
  const [naturalW, setNaturalW] = useState(0);
  const [naturalH, setNaturalH] = useState(0);

  // Crop state
  const [cropShape, setCropShape] = useState<CropShape>("rectangle");
  const [crop, setCrop] = useState<CropArea>({ x: 0, y: 0, w: 0, h: 0 });
  const [dragging, setDragging] = useState<"move" | "resize" | null>(null);
  const dragStart = useRef({ mx: 0, my: 0, cx: 0, cy: 0, cw: 0, ch: 0 });

  // Resize state
  const [resizeW, setResizeW] = useState(0);
  const [resizeH, setResizeH] = useState(0);
  const [lockAspect, setLockAspect] = useState(true);
  const aspectRatio = useRef(1);

  const [activeTab, setActiveTab] = useState("crop");

  // Display scale: fit image into max canvas area
  const MAX_CANVAS = 500;
  const scale = loaded
    ? Math.min(1, MAX_CANVAS / naturalW, MAX_CANVAS / naturalH)
    : 1;
  const displayW = Math.round(naturalW * scale);
  const displayH = Math.round(naturalH * scale);

  // Load image when URL changes
  useEffect(() => {
    if (!imageUrl || !open) return;
    setLoaded(false);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setNaturalW(img.naturalWidth);
      setNaturalH(img.naturalHeight);
      setResizeW(img.naturalWidth);
      setResizeH(img.naturalHeight);
      aspectRatio.current = img.naturalWidth / img.naturalHeight;
      // Default crop = full image
      setCrop({ x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight });
      setCropShape("rectangle");
      setActiveTab("crop");
      setLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl, open]);

  // Draw main canvas
  useEffect(() => {
    if (!loaded || !imgRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    canvasRef.current.width = displayW;
    canvasRef.current.height = displayH;
    ctx.clearRect(0, 0, displayW, displayH);
    ctx.drawImage(imgRef.current, 0, 0, displayW, displayH);
  }, [loaded, displayW, displayH]);

  // Draw overlay (crop handles)
  const drawOverlay = useCallback(() => {
    if (!overlayRef.current || !loaded) return;
    const ctx = overlayRef.current.getContext("2d");
    if (!ctx) return;
    overlayRef.current.width = displayW;
    overlayRef.current.height = displayH;
    ctx.clearRect(0, 0, displayW, displayH);

    if (activeTab !== "crop") return;

    const sx = crop.x * scale;
    const sy = crop.y * scale;
    const sw = crop.w * scale;
    const sh = crop.h * scale;

    // Dim outside crop
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, displayW, displayH);

    // Clear inside crop
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    if (cropShape === "circle") {
      const rx = sw / 2;
      const ry = sh / 2;
      ctx.beginPath();
      ctx.ellipse(sx + rx, sy + ry, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(sx, sy, sw, sh);
    }
    ctx.restore();

    // Crop border
    ctx.strokeStyle = "hsl(var(--primary))";
    ctx.lineWidth = 2;
    if (cropShape === "circle") {
      const rx = sw / 2;
      const ry = sh / 2;
      ctx.beginPath();
      ctx.ellipse(sx + rx, sy + ry, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeRect(sx, sy, sw, sh);
    }

    // Resize handle (bottom-right corner)
    ctx.fillStyle = "hsl(var(--primary))";
    ctx.fillRect(sx + sw - 5, sy + sh - 5, 10, 10);
  }, [loaded, crop, scale, displayW, displayH, cropShape, activeTab]);

  useEffect(() => {
    drawOverlay();
  }, [drawOverlay]);

  // Enforce square/circle constraints
  const constrainCrop = useCallback(
    (c: CropArea): CropArea => {
      let { x, y, w, h } = c;
      if (cropShape === "square" || cropShape === "circle") {
        const side = Math.min(w, h);
        w = side;
        h = side;
      }
      // Clamp to bounds
      w = Math.max(20, Math.min(w, naturalW));
      h = Math.max(20, Math.min(h, naturalH));
      x = Math.max(0, Math.min(x, naturalW - w));
      y = Math.max(0, Math.min(y, naturalH - h));
      return { x, y, w, h };
    },
    [cropShape, naturalW, naturalH]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    if (activeTab !== "crop") return;
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const sx = crop.x * scale;
    const sy = crop.y * scale;
    const sw = crop.w * scale;
    const sh = crop.h * scale;

    // Check resize handle
    if (
      Math.abs(mx - (sx + sw)) < 12 &&
      Math.abs(my - (sy + sh)) < 12
    ) {
      setDragging("resize");
      dragStart.current = { mx, my, cx: crop.x, cy: crop.y, cw: crop.w, ch: crop.h };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    // Check inside crop area for move
    if (mx >= sx && mx <= sx + sw && my >= sy && my <= sy + sh) {
      setDragging("move");
      dragStart.current = { mx, my, cx: crop.x, cy: crop.y, cw: crop.w, ch: crop.h };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const dx = (mx - dragStart.current.mx) / scale;
    const dy = (my - dragStart.current.my) / scale;

    if (dragging === "move") {
      setCrop(
        constrainCrop({
          x: dragStart.current.cx + dx,
          y: dragStart.current.cy + dy,
          w: dragStart.current.cw,
          h: dragStart.current.ch,
        })
      );
    } else if (dragging === "resize") {
      let newW = dragStart.current.cw + dx;
      let newH = dragStart.current.ch + dy;
      if (cropShape === "square" || cropShape === "circle") {
        const side = Math.max(newW, newH);
        newW = side;
        newH = side;
      }
      setCrop(
        constrainCrop({
          x: dragStart.current.cx,
          y: dragStart.current.cy,
          w: newW,
          h: newH,
        })
      );
    }
  };

  const handlePointerUp = () => setDragging(null);

  const handleResetCrop = () => {
    setCrop({ x: 0, y: 0, w: naturalW, h: naturalH });
  };

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

  const handleSave = () => {
    if (!imgRef.current) return;

    // Apply crop first
    const cx = Math.round(crop.x);
    const cy = Math.round(crop.y);
    const cw = Math.round(crop.w);
    const ch = Math.round(crop.h);

    // Determine final output dimensions
    let outW = cw;
    let outH = ch;
    if (activeTab === "resize" || resizeW !== naturalW || resizeH !== naturalH) {
      // Scale crop proportionally to resize
      const scaleX = resizeW / naturalW;
      const scaleY = resizeH / naturalH;
      outW = Math.round(cw * scaleX);
      outH = Math.round(ch * scaleY);
    }

    const offscreen = document.createElement("canvas");
    offscreen.width = outW;
    offscreen.height = outH;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return;

    // For circle crop, clip
    if (cropShape === "circle") {
      ctx.beginPath();
      ctx.ellipse(outW / 2, outH / 2, outW / 2, outH / 2, 0, 0, Math.PI * 2);
      ctx.clip();
    }

    ctx.drawImage(imgRef.current, cx, cy, cw, ch, 0, 0, outW, outH);

    offscreen.toBlob(
      (blob) => {
        if (!blob) return;
        const ext = imageName.split(".").pop()?.toLowerCase() || "png";
        const mimeMap: Record<string, string> = {
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          webp: "image/webp",
          gif: "image/gif",
        };
        const file = new File([blob], imageName, {
          type: mimeMap[ext] || "image/png",
        });
        onSave(file);
      },
      imageName.endsWith(".jpg") || imageName.endsWith(".jpeg")
        ? "image/jpeg"
        : "image/png",
      0.92
    );
  };

  if (!imageUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="truncate">Edit Image — {imageName}</DialogTitle>
        </DialogHeader>

        {!loaded ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="crop" className="gap-1.5">
                <Crop className="h-4 w-4" /> Crop
              </TabsTrigger>
              <TabsTrigger value="resize" className="gap-1.5">
                <Maximize className="h-4 w-4" /> Resize
              </TabsTrigger>
            </TabsList>

            <TabsContent value="crop" className="space-y-3 mt-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Label className="text-xs shrink-0">Shape</Label>
                  <Select value={cropShape} onValueChange={(v) => setCropShape(v as CropShape)}>
                    <SelectTrigger className="h-8 w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rectangle">Rectangle</SelectItem>
                      <SelectItem value="square">Square</SelectItem>
                      <SelectItem value="circle">Circle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="ghost" size="sm" onClick={handleResetCrop} className="gap-1">
                  <RotateCcw className="h-3.5 w-3.5" /> Reset
                </Button>
                <span className="text-xs text-muted-foreground ml-auto">
                  {Math.round(crop.w)} × {Math.round(crop.h)} px
                </span>
              </div>
            </TabsContent>

            <TabsContent value="resize" className="space-y-3 mt-3">
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
            </TabsContent>

            {/* Canvas area */}
            <div className="relative mx-auto mt-3" style={{ width: displayW, height: displayH }}>
              <canvas
                ref={canvasRef}
                className="rounded border border-border"
                style={{ width: displayW, height: displayH }}
              />
              <canvas
                ref={overlayRef}
                className="absolute inset-0 cursor-crosshair rounded"
                style={{ width: displayW, height: displayH }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              />
            </div>
          </Tabs>
        )}

        <DialogFooter className="mt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!loaded || isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" /> Saving…
              </>
            ) : (
              "Apply & Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
