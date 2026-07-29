import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Camera, ImagePlus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

interface Photo {
  id: string;
  storage_path: string;
  note: string | null;
  signedUrl?: string;
}

interface Props {
  jobId: string | null;
  slot: "front" | "left" | "right" | "back" | "top" | "bottom";
  label: string;
}

export default function PickupPhotoSlot({ jobId, slot, label }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [idx, setIdx] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  async function load() {
    if (!jobId) { setPhotos([]); return; }
    const { data } = await supabase
      .from("installation_pickup_photos")
      .select("id, storage_path, note")
      .eq("job_id", jobId)
      .is("item_id", null)
      .eq("slot", slot)
      .order("created_at");
    const list = (data as Photo[]) || [];
    for (const p of list) {
      const { data: signed } = await supabase.storage
        .from("installation-photos")
        .createSignedUrl(p.storage_path, 3600);
      p.signedUrl = signed?.signedUrl;
    }
    setPhotos(list);
    setIdx(0);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [jobId, slot]);

  async function handleUpload(file: File) {
    if (!jobId) {
      toast({ title: "Save the job first before adding photos", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${jobId}/pickup/${slot}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("installation-photos")
      .upload(path, file, { upsert: false });
    if (upErr) {
      setUploading(false);
      toast({ title: "Upload failed", description: upErr.message, variant: "destructive" });
      return;
    }
    const { error: dbErr } = await supabase.from("installation_pickup_photos").insert({
      job_id: jobId, slot, storage_path: path, item_id: null,
    });
    setUploading(false);
    if (dbErr) return toast({ title: "Save failed", description: dbErr.message, variant: "destructive" });
    await load();
  }

  async function updateNote(p: Photo, note: string) {
    await supabase.from("installation_pickup_photos").update({ note }).eq("id", p.id);
    setPhotos((prev) => prev.map((x) => x.id === p.id ? { ...x, note } : x));
  }

  async function removePhoto(p: Photo) {
    if (!confirm("Delete this photo?")) return;
    await supabase.storage.from("installation-photos").remove([p.storage_path]);
    await supabase.from("installation_pickup_photos").delete().eq("id", p.id);
    await load();
  }

  const active = photos[idx];

  return (
    <div className="border rounded-md p-2 bg-card space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{label}</div>
        <div className="flex gap-1">
          <Button type="button" size="icon" variant="ghost" onClick={() => camRef.current?.click()} title="Camera">
            <Camera className="w-4 h-4" />
          </Button>
          <Button type="button" size="icon" variant="ghost" onClick={() => fileRef.current?.click()} title="Upload">
            <ImagePlus className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }} />
      <input ref={camRef} type="file" accept="image/*" capture="environment" hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }} />

      {uploading && <div className="text-xs text-muted-foreground">Uploading…</div>}

      {photos.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-4">No photos yet</div>
      ) : (
        <div className="space-y-2">
          <div className="relative bg-muted rounded overflow-hidden h-40">
            {active?.signedUrl && (
              <img src={active.signedUrl} alt={label} className="w-full h-full object-contain" />
            )}
            {photos.length > 1 && (
              <>
                <button type="button" onClick={() => setIdx((i) => (i - 1 + photos.length) % photos.length)}
                  className="absolute left-1 top-1/2 -translate-y-1/2 bg-background/80 rounded-full p-1">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => setIdx((i) => (i + 1) % photos.length)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 bg-background/80 rounded-full p-1">
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] bg-background/80 rounded px-1">
                  {idx + 1}/{photos.length}
                </div>
              </>
            )}
          </div>
          {active && (
            <>
              <Input
                placeholder="Note…"
                value={active.note || ""}
                onChange={(e) => setPhotos((prev) => prev.map((x) => x.id === active.id ? { ...x, note: e.target.value } : x))}
                onBlur={(e) => updateNote(active, e.target.value)}
              />
              <div className="flex justify-end">
                <Button type="button" size="sm" variant="ghost" onClick={() => removePhoto(active)}>
                  <Trash2 className="w-3 h-3 mr-1 text-destructive" /> Remove
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
