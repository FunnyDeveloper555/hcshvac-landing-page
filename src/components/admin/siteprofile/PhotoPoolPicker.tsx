import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Check, Loader2 } from "lucide-react";
import { POOL_SLOT, POOL_CHANGED_EVENT } from "./SystemPhotoPool";

interface PoolPhoto {
  id: string;
  storage_path: string;
  signedUrl?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  systemId: string;
  targetSlotKey: string;
  targetLabel: string;
  onAssigned: () => void;
}

/** Dialog that lists the per-system photo pool and moves the selected
 *  photos into a given photo slot. */
export default function PhotoPoolPicker({
  open,
  onOpenChange,
  profileId,
  systemId,
  targetSlotKey,
  targetLabel,
  onAssigned,
}: Props) {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<PoolPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    (async () => {
      setLoading(true);
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
      setLoading(false);
    })();
  }, [open, profileId, systemId]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirm = async () => {
    if (selected.size === 0) return;
    setAssigning(true);
    const { error } = await supabase
      .from("site_profile_photos")
      .update({ component_slot: targetSlotKey })
      .in("id", Array.from(selected));
    setAssigning(false);
    if (error) {
      toast({ title: "Assign failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `${selected.size} photo(s) added to ${targetLabel}` });
    window.dispatchEvent(
      new CustomEvent(POOL_CHANGED_EVENT, { detail: { systemId } }),
    );
    onAssigned();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-5xl flex flex-col max-h-[90vh] p-4 sm:p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-base">Pick from Photo Container → {targetLabel}</DialogTitle>
          <DialogDescription className="text-xs">
            Select one or more photos from this system's container. They will be moved into the "{targetLabel}" box.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : photos.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            The photo container is empty. Upload photos to the container first.
          </p>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto p-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 auto-rows-min">

            {photos.map((p) => {
              const isSel = selected.has(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p.id)}
                  className={`relative border rounded-md overflow-hidden bg-muted transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isSel
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "hover:ring-2 hover:ring-primary/40"
                  }`}
                >
                  {p.signedUrl ? (
                    <img src={p.signedUrl} alt="Pool photo" className="w-full h-40 object-contain bg-background" />
                  ) : (
                    <div className="w-full h-40 bg-muted animate-pulse" />
                  )}
                  <span
                    className={`absolute top-2 right-2 rounded-full p-1 border ${
                      isSel
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background/80 text-muted-foreground border-border"
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <DialogFooter className="shrink-0 border-t pt-3 flex flex-row items-center justify-between gap-2 sm:justify-between">

          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              disabled={photos.length === 0}
              onClick={() => setSelected(new Set(photos.map((p) => p.id)))}
            >
              Select All
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              disabled={selected.size === 0}
              onClick={() => setSelected(new Set())}
            >
              Clear
            </Button>
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" size="sm" disabled={selected.size === 0 || assigning} onClick={confirm}>
              {assigning && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              Add {selected.size > 0 ? `(${selected.size})` : ""}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
