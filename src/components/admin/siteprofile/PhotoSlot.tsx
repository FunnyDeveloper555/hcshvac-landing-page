import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Trash2, Upload, Loader2, Save, ImageIcon, X, Maximize2, ChevronLeft, ChevronRight, Images } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PhotoPoolPicker from "./PhotoPoolPicker";
import { beginUpload, endUpload } from "@/lib/photoUploadTracker";




interface PhotoSlotProps {
  profileId: string;
  systemId?: string | null;
  slotKey: string;
  label: string;
  allowCustomTitle?: boolean;
  footer?: React.ReactNode;
  na?: boolean;
  onNaChange?: (v: boolean) => void;
}


interface PhotoRow {
  id: string;
  storage_path: string;
  slot_title?: string | null;
  slot_about?: string | null;
  slot_note?: string | null;
}


export default function PhotoSlot({ profileId, systemId, slotKey, label, allowCustomTitle, footer, na, onNaChange }: PhotoSlotProps) {
  const { toast } = useToast();
  const [rows, setRows] = useState<PhotoRow[]>([]);
  const [signed, setSigned] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [poolPickerOpen, setPoolPickerOpen] = useState(false);
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
    beginUpload();
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
      setTitle("");
      setAbout("");
      await load();
      toast({ title: "Photo added" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      endUpload();
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
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
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
          {systemId && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2"
              onClick={() => setPoolPickerOpen(true)}
              title="Pick from photo container"
            >
              <Images className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {systemId && (
        <PhotoPoolPicker
          open={poolPickerOpen}
          onOpenChange={setPoolPickerOpen}
          profileId={profileId}
          systemId={systemId}
          targetSlotKey={slotKey}
          targetLabel={label}
          onAssigned={load}
        />
      )}

      <PhotoSlider
        rows={rows}
        signed={signed}
        label={label}
        onRemove={remove}
        onReload={load}
        allowCustomTitle={allowCustomTitle}
      />

      {footer && <div className="space-y-2">{footer}</div>}

    </div>
  );
}

function PhotoSlider({
  rows,
  signed,
  label,
  onRemove,
  onReload,
  allowCustomTitle,
}: {
  rows: PhotoRow[];
  signed: Record<string, string>;
  label: string;
  onRemove: (r: PhotoRow) => void;
  onReload: () => void;
  allowCustomTitle?: boolean;
}) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (idx > rows.length - 1) setIdx(Math.max(0, rows.length - 1));
  }, [rows.length, idx]);

  if (rows.length === 0) {
    return (
      <div className="text-[10px] text-muted-foreground text-center py-3 border-dashed border rounded">
        <Upload className="h-3 w-3 inline mr-1" /> No photos yet
      </div>
    );
  }

  const current = rows[idx];
  const hasMany = rows.length > 1;

  return (
    <div className="space-y-1">
      <div className="relative">
        <PhotoItem
          key={current.id}
          row={current}
          url={signed[current.id]}
          label={label}
          onRemove={() => onRemove(current)}
          onReload={onReload}
          allowCustomTitle={allowCustomTitle}
        />

        {hasMany && (
          <>
            <button
              type="button"
              onClick={() => setIdx((i) => (i - 1 + rows.length) % rows.length)}
              className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1"
              title="Previous"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => setIdx((i) => (i + 1) % rows.length)}
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1"
              title="Next"
              aria-label="Next photo"
            >
              <ChevronRight className="h-3 w-3" />
            </button>
          </>
        )}
      </div>
      {hasMany && (
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{idx + 1} / {rows.length}</span>
          <div className="flex gap-1">
            {rows.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === idx ? "bg-primary w-3" : "bg-muted-foreground/40 hover:bg-muted-foreground/70"
                }`}
                aria-label={`Go to photo ${i + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PhotoItem({
  row,
  url,
  label,
  onRemove,
  onReload,
  allowCustomTitle,
}: {
  row: PhotoRow;
  url?: string;
  label: string;
  onRemove: () => void;
  onReload: () => void;
  allowCustomTitle?: boolean;
}) {
  const { toast } = useToast();
  const [aboutVal, setAboutVal] = useState<string>(row.slot_about || "");
  const [titleVal, setTitleVal] = useState<string>(row.slot_title || "");
  const [noteVal, setNoteVal] = useState<string>(row.slot_note || "");
  const [saving, setSaving] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    setAboutVal(row.slot_about || "");
    setTitleVal(row.slot_title || "");
    setNoteVal(row.slot_note || "");
  }, [row.slot_about, row.slot_title, row.slot_note, row.id]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setLightbox(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  const dirty =
    aboutVal !== (row.slot_about || "") ||
    (allowCustomTitle && titleVal !== (row.slot_title || "")) ||
    (allowCustomTitle && noteVal !== (row.slot_note || ""));

  const saveNote = async () => {
    setSaving(true);
    const patch: Record<string, string | null> = { slot_about: aboutVal || null };
    if (allowCustomTitle) {
      patch.slot_title = titleVal || null;
      patch.slot_note = noteVal || null;
    }
    const { error } = await supabase
      .from("site_profile_photos")
      .update(patch)
      .eq("id", row.id);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved" });
      onReload();
    }
  };


  return (
    <div className="relative group border rounded p-1 bg-background">
      {url ? (
        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="block w-full relative cursor-zoom-in"
          title="Click to expand"
        >
          <img src={url} className="w-full h-40 object-cover rounded" alt={label} />
          <span className="absolute bottom-1 right-1 bg-black/60 text-white rounded p-0.5 opacity-0 group-hover:opacity-100">
            <Maximize2 className="h-3 w-3" />
          </span>
        </button>
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
      {allowCustomTitle ? (
        <>
          <Input
            className="h-7 text-[11px] mt-1"
            placeholder="Title"
            value={titleVal}
            onChange={(e) => setTitleVal(e.target.value)}
          />
          <Input
            className="h-7 text-[11px] mt-1"
            placeholder="About"
            value={aboutVal}
            onChange={(e) => setAboutVal(e.target.value)}
          />
          <Textarea
            className="text-[11px] min-h-[44px] mt-1"
            placeholder="Note about this photo..."
            value={noteVal}
            onChange={(e) => setNoteVal(e.target.value)}
          />
        </>
      ) : (
        <>
          {row.slot_title && (
            <div className="text-[11px] font-medium mt-1 truncate" title={row.slot_title}>
              {row.slot_title}
            </div>
          )}
          <Textarea
            className="text-[11px] min-h-[44px] mt-1"
            placeholder="Note about this photo..."
            value={aboutVal}
            onChange={(e) => setAboutVal(e.target.value)}
          />
        </>
      )}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-6 px-2 mt-1 w-full text-[10px]"
        onClick={saveNote}
        disabled={saving || !dirty}
      >
        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Save className="h-3 w-3 mr-1" />Save</>}
      </Button>




      {lightbox && url && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex flex-col md:flex-row"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLightbox(false); }}
            className="absolute top-3 right-3 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full p-2"
            title="Close (Esc)"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Image area */}
          <div
            className="flex-1 flex items-center justify-center p-4 min-h-0"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={url}
              alt={label}
              className="max-w-full max-h-[90vh] object-contain rounded shadow-2xl"
            />
          </div>

          {/* Note side panel */}
          {(row.slot_title || aboutVal || noteVal) && (
            <aside
              className="w-full md:w-96 md:max-w-[35vw] bg-background text-foreground border-l border-border overflow-y-auto p-4 max-h-[40vh] md:max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              {row.slot_title && (
                <h3 className="text-sm font-semibold mb-2 pr-8">{row.slot_title}</h3>
              )}
              {aboutVal && (
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words mb-3">
                  {aboutVal}
                </p>
              )}
              {noteVal && (
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap break-words">
                  {noteVal}
                </p>
              )}
            </aside>
          )}

        </div>
      )}
    </div>
  );
}


