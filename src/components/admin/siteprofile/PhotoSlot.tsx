import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Trash2, Upload, Loader2, Save, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


interface PhotoSlotProps {
  profileId: string;
  systemId?: string | null;
  slotKey: string;
  label: string;
  allowCustomTitle?: boolean;
}

interface PhotoRow {
  id: string;
  storage_path: string;
  slot_title?: string | null;
  slot_about?: string | null;
}

export default function PhotoSlot({ profileId, systemId, slotKey, label, allowCustomTitle }: PhotoSlotProps) {
  const { toast } = useToast();
  const [rows, setRows] = useState<PhotoRow[]>([]);
  const [signed, setSigned] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [about, setAbout] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    let q = supabase
      .from("site_profile_photos")
      .select("*")
      .eq("profile_id", profileId)
      .eq("component_slot", slotKey);
    if (systemId) q = q.eq("system_id", systemId);
    else q = q.is("system_id", null);
    const { data } = await q.order("created_at", { ascending: true });
    const list = (data as PhotoRow[]) || [];
    setRows(list);
    // signed urls
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
  }, [profileId, systemId, slotKey]);

  const upload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${profileId}/${systemId || "profile"}/${slotKey}/${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("site-profile-photos")
        .upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from("site_profile_photos").insert({
        profile_id: profileId,
        system_id: systemId || null,
        component_slot: slotKey,
        slot_title: allowCustomTitle ? title || null : null,
        slot_about: allowCustomTitle ? about || null : null,
        storage_path: path,
        content_type: file.type,
        size_bytes: file.size,
      });
      if (insErr) throw insErr;
      await load();
      toast({ title: "Photo added" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
    }
  };

  const remove = async (row: PhotoRow) => {
    if (!confirm("Remove this photo?")) return;
    await supabase.storage.from("site-profile-photos").remove([row.storage_path]);
    await supabase.from("site_profile_photos").delete().eq("id", row.id);
    await load();
  };

  return (
    <div className="border rounded-md p-2 bg-card space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-medium truncate">{label}</div>
        <div className="flex gap-1">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {allowCustomTitle && (
        <div className="space-y-1">
          <Input
            className="h-7 text-xs"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            className="h-7 text-xs"
            placeholder="About"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {rows.map((r) => (
          <PhotoItem key={r.id} row={r} url={signed[r.id]} label={label} onRemove={() => remove(r)} onReload={load} />
        ))}
        {rows.length === 0 && (
          <div className="col-span-2 text-[10px] text-muted-foreground text-center py-2 border-dashed border rounded">
            <Upload className="h-3 w-3 inline mr-1" /> No photos yet
          </div>
        )}
      </div>
    </div>
  );
}

function PhotoItem({
  row,
  url,
  label,
  onRemove,
  onReload,
}: {
  row: PhotoRow;
  url?: string;
  label: string;
  onRemove: () => void;
  onReload: () => void;
}) {
  const { toast } = useToast();
  const [note, setNote] = useState<string>(row.slot_about || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNote(row.slot_about || "");
  }, [row.slot_about]);

  const saveNote = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("site_profile_photos")
      .update({ slot_about: note || null })
      .eq("id", row.id);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Note saved" });
      onReload();
    }
  };

  return (
    <div className="relative group border rounded p-1 bg-background">
      {url ? (
        <img src={url} className="w-full h-20 object-cover rounded" alt={label} />
      ) : (
        <div className="w-full h-20 bg-muted animate-pulse rounded" />
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 p-0.5 bg-destructive text-destructive-foreground rounded opacity-0 group-hover:opacity-100"
        title="Remove"
      >
        <Trash2 className="h-3 w-3" />
      </button>
      {row.slot_title && (
        <div className="text-[10px] mt-1 truncate font-medium" title={row.slot_title}>
          {row.slot_title}
        </div>
      )}
      <Textarea
        className="text-[11px] min-h-[44px] mt-1"
        placeholder="Note about this photo..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-6 px-2 mt-1 w-full text-[10px]"
        onClick={saveNote}
        disabled={saving || note === (row.slot_about || "")}
      >
        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Save className="h-3 w-3 mr-1" />Save note</>}
      </Button>
    </div>
  );
}

