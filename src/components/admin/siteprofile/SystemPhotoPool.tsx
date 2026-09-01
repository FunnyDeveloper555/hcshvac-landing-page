import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Camera, ImagePlus, Loader2, Trash2, Images } from "lucide-react";
import { compressImage } from "@/lib/imageCompress";
import { beginUpload, endUpload } from "@/lib/photoUploadTracker";


export const POOL_SLOT = "pool";
export const POOL_CHANGED_EVENT = "sp-pool-changed";

interface PoolPhoto {
  id: string;
  storage_path: string;
  signedUrl?: string;
}

interface Props {
  profileId: string;
  systemId: string;
}

/** Per-system bulk photo container. Photos land here (component_slot='pool')
 *  and are later distributed into individual photo slots via PhotoPoolPicker. */
export default function SystemPhotoPool({ profileId, systemId }: Props) {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<PoolPhoto[]>([]);
  const [uploading, setUploading] = useState(0); // remaining uploads
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("site_profile_photos")
      .select("id, storage_path")
      .eq("profile_id", profileId)
      .eq("system_id", systemId)
      .eq("component_slot", POOL_SLOT)
      .order("created_at", { ascending: true });
    const list = (data as PoolPhoto[]) || [];
    await Promise.all(
      list.map(async (p) => {
        const { data: s } = await supabase.storage
          .from("site-profile-photos")
          .createSignedUrl(p.storage_path, 3600);
        p.signedUrl = s?.signedUrl;
      }),
    );
    setPhotos(list);
  }, [profileId, systemId]);

  useEffect(() => {
    load();
    const onChanged = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.systemId || detail.systemId === systemId) load();
    };
    window.addEventListener(POOL_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(POOL_CHANGED_EVENT, onChanged);
  }, [load, systemId]);

  const uploadFiles = async (files: File[]) => {
    if (!files.length) return;
    setUploading((n) => n + files.length);
    beginUpload(files.length);
    for (const original of files) {
      try {

        const file = await compressImage(original);
        const path = `${profileId}/${systemId}/${POOL_SLOT}/${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("site-profile-photos")
          .upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;
        const { error: insErr } = await supabase.from("site_profile_photos").insert({
          profile_id: profileId,
          system_id: systemId,
          component_slot: POOL_SLOT,
          storage_path: path,
          content_type: file.type,
          size_bytes: file.size,
        });
        if (insErr) throw insErr;
      } catch (e: any) {
        toast({
          title: "Upload failed",
          description: `${original.name}: ${e.message}`,
          variant: "destructive",
        });
      } finally {
        setUploading((n) => n - 1);
      }
    }
    await load();
  };

  const remove = async (p: PoolPhoto) => {
    if (!confirm("Delete this photo from the pool?")) return;
    await supabase.storage.from("site-profile-photos").remove([p.storage_path]);
    await supabase.from("site_profile_photos").delete().eq("id", p.id);
    await load();
  };

  return (
    <div
      className={`border-2 border-dashed rounded-md p-3 space-y-2 transition-colors ${
        dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/30 bg-card"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const files = Array.from(e.dataTransfer.files || []).filter((f) =>
          f.type.startsWith("image/"),
        );
        uploadFiles(files);
      }}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-xs font-medium">
          <Images className="h-4 w-4 text-primary" />
          Photo Container
          <span className="text-muted-foreground font-normal">
            ({photos.length} unassigned{uploading > 0 ? `, uploading ${uploading}…` : ""})
          </span>
          {uploading > 0 && <Loader2 className="h-3 w-3 animate-spin" />}
        </div>
        <div className="flex gap-1">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              uploadFiles(Array.from(e.target.files || []));
              e.target.value = "";
            }}
          />
          <input
            ref={camRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadFiles([f]);
              e.target.value = "";
            }}
          />
          <Button type="button" size="sm" variant="outline" className="h-7 px-2" onClick={() => camRef.current?.click()}>
            <Camera className="h-3 w-3 mr-1" /> Camera
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-7 px-2" onClick={() => fileRef.current?.click()}>
            <ImagePlus className="h-3 w-3 mr-1" /> Add Photos
          </Button>
        </div>
      </div>

      {photos.length === 0 ? (
        <p className="text-[11px] text-muted-foreground text-center py-2">
          Drag &amp; drop photos here, or use the buttons. Then assign them to photo boxes below.
        </p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {photos.map((p) => (
            <div key={p.id} className="relative group border rounded-md overflow-hidden bg-background">
              {p.signedUrl ? (
                <img src={p.signedUrl} alt="Pool photo" className="w-full h-28 object-contain bg-background" />
              ) : (
                <div className="w-full h-28 bg-muted animate-pulse" />
              )}

              <button
                type="button"
                onClick={() => remove(p)}
                className="absolute top-0.5 right-0.5 p-0.5 bg-destructive text-destructive-foreground rounded opacity-0 group-hover:opacity-100"
                title="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
