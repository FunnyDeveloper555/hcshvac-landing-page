import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, ImageIcon, Loader2, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Row {
  id: string;
  storage_path: string;
}

const SLOT_KEY = "location";

export default function LocationPhotoCard({ profileId }: { profileId: string }) {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [signed, setSigned] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await supabase
      .from("site_profile_photos")
      .select("id, storage_path")
      .eq("profile_id", profileId)
      .is("system_id", null)
      .eq("component_slot", SLOT_KEY)
      .order("created_at", { ascending: true });
    const list = (data as Row[]) || [];
    setRows(list);
    const map: Record<string, string> = {};
    await Promise.all(
      list.map(async (r) => {
        const { data: s } = await supabase.storage
          .from("site-profile-photos")
          .createSignedUrl(r.storage_path, 3600);
        if (s?.signedUrl) map[r.id] = s.signedUrl;
      })
    );
    setSigned(map);
  };

  useEffect(() => {
    if (profileId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${profileId}/profile/${SLOT_KEY}/${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("site-profile-photos")
          .upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;
        const { error: insErr } = await supabase.from("site_profile_photos").insert({
          profile_id: profileId,
          system_id: null,
          component_slot: SLOT_KEY,
          storage_path: path,
          content_type: file.type,
          size_bytes: file.size,
        });
        if (insErr) throw insErr;
      }
      await load();
      toast({ title: "Location photo added" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
    }
  };

  const remove = async (row: Row) => {
    if (!confirm("Remove this photo?")) return;
    await supabase.storage.from("site-profile-photos").remove([row.storage_path]);
    await supabase.from("site_profile_photos").delete().eq("id", row.id);
    await load();
  };

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="text-sm">Location Photo</CardTitle>
          <p className="text-xs text-muted-foreground">General photo of the outside of the building.</p>
        </div>
        <div className="flex gap-1">
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => upload(e.target.files)}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => upload(e.target.files)}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2"
            disabled={uploading}
            onClick={() => cameraRef.current?.click()}
            title="Take photo"
          >
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            title="Choose from gallery"
          >
            <ImageIcon className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="text-[11px] text-muted-foreground text-center py-3 border border-dashed rounded">
            No location photos yet
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {rows.map((r) => (
              <div key={r.id} className="relative group">
                {signed[r.id] ? (
                  <button
                    type="button"
                    onClick={() => setPreview(signed[r.id])}
                    className="block cursor-zoom-in"
                    title="Click to expand"
                  >
                    <img
                      src={signed[r.id]}
                      alt="Building location"
                      className="h-20 w-28 object-cover rounded border"
                    />
                  </button>
                ) : (
                  <div className="h-20 w-28 bg-muted animate-pulse rounded" />
                )}
                <button
                  type="button"
                  onClick={() => remove(r)}
                  className="absolute top-1 right-1 p-0.5 bg-destructive text-destructive-foreground rounded opacity-0 group-hover:opacity-100"
                  title="Remove"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {preview && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 text-white rounded-full p-2"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <img src={preview} alt="Building location" className="max-w-full max-h-[90vh] object-contain rounded" />
        </div>
      )}
    </Card>
  );
}
