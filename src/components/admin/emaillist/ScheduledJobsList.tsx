import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface ScheduledJobsListProps {
  emailListId: string;
}

export default function ScheduledJobsList({ emailListId }: ScheduledJobsListProps) {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["email-send-jobs", emailListId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_send_jobs")
        .select("*, email_list_emails(subject)")
        .eq("email_list_id", emailListId)
        .order("scheduled_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_send_jobs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-send-jobs", emailListId] });
      toast.success("Scheduled send cancelled");
      setDeleteTarget(null);
    },
    onError: () => toast.error("Failed to cancel scheduled send"),
  });

  const statusColor = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "sending": return "secondary";
      case "scheduled": return "outline";
      case "failed": return "destructive";
      default: return "secondary";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return <p className="text-center text-muted-foreground py-4">No scheduled sends yet</p>;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Scheduled For</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Recipients</TableHead>
            <TableHead>Sent / Failed</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell className="font-medium">
                {(job.email_list_emails as any)?.subject || "—"}
              </TableCell>
              <TableCell>{new Date(job.scheduled_at).toLocaleString()}</TableCell>
              <TableCell>
                <Badge variant={statusColor(job.status) as any}>{job.status}</Badge>
              </TableCell>
              <TableCell>{job.total_recipients}</TableCell>
              <TableCell>{job.sent_count} / {job.failed_count}</TableCell>
              <TableCell className="text-right">
                {job.status === "scheduled" && (
                  <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(job.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Scheduled Send</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this scheduled send? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
            >
              Cancel Send
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
