import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CalendarClock, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface ScheduleSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emailListId: string;
}

export default function ScheduleSendDialog({ open, onOpenChange, emailListId }: ScheduleSendDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedEmailId, setSelectedEmailId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  const { data: emails = [] } = useQuery({
    queryKey: ["email-list-emails-for-schedule", emailListId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_list_emails")
        .select("id, subject, is_active")
        .eq("email_list_id", emailListId)
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const scheduleMutation = useMutation({
    mutationFn: async () => {
      if (!scheduledDate || !scheduledTime || !selectedEmailId) throw new Error("Fill all fields");
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      const { error } = await supabase.from("email_send_jobs").insert({
        email_list_id: emailListId,
        email_id: selectedEmailId,
        scheduled_at: scheduledAt,
        status: "scheduled",
        created_by: user?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-send-jobs", emailListId] });
      toast.success("Email scheduled successfully");
      onOpenChange(false);
      setSelectedEmailId("");
      setScheduledDate("");
      setScheduledTime("");
    },
    onError: (err) => toast.error(`Failed to schedule: ${(err as Error).message}`),
  });

  // Default date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" /> Schedule Email Send
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Email to Send *</Label>
            <Select value={selectedEmailId} onValueChange={setSelectedEmailId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an email" />
              </SelectTrigger>
              <SelectContent>
                {emails.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.subject || "(No subject)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={minDate}
              />
            </div>
            <div className="space-y-2">
              <Label>Time *</Label>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            The email will be sent to all active subscribers at the scheduled time.
          </p>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              onClick={() => scheduleMutation.mutate()}
              disabled={!selectedEmailId || !scheduledDate || !scheduledTime || scheduleMutation.isPending}
            >
              {scheduleMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Schedule
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
