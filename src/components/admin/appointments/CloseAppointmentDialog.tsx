import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Paperclip, X } from "lucide-react";
import { useAdminLog } from "@/hooks/useAdminLog";

interface AppointmentRef {
  id: string;
  customer_name: string;
}

interface CloseProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: AppointmentRef | null;
}

export function CloseAppointmentDialog({ open, onOpenChange, appointment }: CloseProps) {
  const [summary, setSummary] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const { logAction } = useAdminLog();

  const reset = () => {
    setSummary("");
    setFiles([]);
    setSaving(false);
  };

  const handleClose = async () => {
    if (!appointment) return;
    if (!summary.trim()) {
      toast.error("Enter the visit summary notes before closing.");
      return;
    }
    setSaving(true);
    try {
      const paths: string[] = [];
      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${appointment.id}/${Date.now()}-${safeName}`;
        const { error } = await supabase.storage.from("appointment-files").upload(path, file);
        if (error) throw error;
        paths.push(path);
      }
      const { error } = await supabase
        .from("appointments")
        .update({
          status: "closed",
          closed_at: new Date().toISOString(),
          visit_summary_notes: summary.trim(),
          closure_photos: paths,
        })
        .eq("id", appointment.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment closed with visit summary");
      logAction("status_change", "appointment", appointment.id, {
        new_status: "closed",
        customer_name: appointment.customer_name,
        visit_summary: summary.trim(),
        closure_files: paths.length,
      });
      onOpenChange(false);
      reset();
    } catch (e: any) {
      toast.error(e?.message || "Failed to close the appointment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Close appointment — {appointment?.customer_name}</DialogTitle>
          <DialogDescription>
            Add the visit summary notes and any photos or videos from the job. This closes the appointment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="visit-summary">Visit summary notes <span className="text-destructive">*</span></Label>
            <Textarea
              id="visit-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="What was done on this visit, findings, follow-ups…"
              rows={5}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="closure-files">Photos / videos</Label>
            <input
              id="closure-files"
              type="file"
              accept="image/*,video/*"
              multiple
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:text-foreground"
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />
            {files.length > 0 && (
              <ul className="text-xs space-y-1 pt-1">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Paperclip className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate flex-1">{f.name}</span>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setFiles(files.filter((_, j) => j !== i))}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Back
          </Button>
          <Button onClick={handleClose} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Close appointment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CancelAppointmentDialog({ open, onOpenChange, appointment }: CloseProps) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const { logAction } = useAdminLog();

  const reset = () => {
    setReason("");
    setSaving(false);
  };

  const handleCancel = async () => {
    if (!appointment) return;
    if (!reason.trim()) {
      toast.error("Enter the reason for cancellation.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled", cancellation_reason: reason.trim() })
        .eq("id", appointment.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment cancelled");
      logAction("status_change", "appointment", appointment.id, {
        new_status: "cancelled",
        customer_name: appointment.customer_name,
        cancellation_reason: reason.trim(),
      });
      onOpenChange(false);
      reset();
    } catch (e: any) {
      toast.error(e?.message || "Failed to cancel the appointment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Cancel appointment — {appointment?.customer_name}</DialogTitle>
          <DialogDescription>
            A reason is required to cancel this appointment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="cancel-reason">Reason for cancellation <span className="text-destructive">*</span></Label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Customer rescheduled, no answer, duplicate booking…"
            rows={4}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Back
          </Button>
          <Button variant="destructive" onClick={handleCancel} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Cancel appointment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
