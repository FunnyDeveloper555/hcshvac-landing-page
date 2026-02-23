import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, BarChart3, Mail, Eye, MousePointer, AlertTriangle } from "lucide-react";

interface EmailAnalyticsDashboardProps {
  emailListId: string;
}

export default function EmailAnalyticsDashboard({ emailListId }: EmailAnalyticsDashboardProps) {
  // Fetch send jobs for this list
  const { data: sendJobs = [], isLoading } = useQuery({
    queryKey: ["email-send-jobs", emailListId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_send_jobs")
        .select("*, email_list_emails(subject)")
        .eq("email_list_id", emailListId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch recipient analytics for all jobs
  const jobIds = sendJobs.map((j) => j.id);
  const { data: recipients = [] } = useQuery({
    queryKey: ["email-send-recipients-analytics", jobIds],
    queryFn: async () => {
      if (jobIds.length === 0) return [];
      const { data, error } = await supabase
        .from("email_send_recipients")
        .select("*")
        .in("send_job_id", jobIds);
      if (error) throw error;
      return data;
    },
    enabled: jobIds.length > 0,
  });

  // Aggregate stats per job
  const jobStats = sendJobs.map((job) => {
    const jobRecipients = recipients.filter((r) => r.send_job_id === job.id);
    const total = jobRecipients.length;
    const sent = jobRecipients.filter((r) => r.status === "sent" || r.status === "delivered").length;
    const opened = jobRecipients.filter((r) => (r.open_count || 0) > 0).length;
    const clicked = jobRecipients.filter((r) => (r.click_count || 0) > 0).length;
    const bounced = jobRecipients.filter((r) => r.status === "bounced").length;
    return {
      ...job,
      total,
      sent,
      opened,
      clicked,
      bounced,
      openRate: total > 0 ? (opened / total) * 100 : 0,
      clickRate: total > 0 ? (clicked / total) * 100 : 0,
      bounceRate: total > 0 ? (bounced / total) * 100 : 0,
    };
  });

  // Overall totals
  const totalSent = jobStats.reduce((sum, j) => sum + j.sent, 0);
  const totalOpened = jobStats.reduce((sum, j) => sum + j.opened, 0);
  const totalClicked = jobStats.reduce((sum, j) => sum + j.clicked, 0);
  const totalBounced = jobStats.reduce((sum, j) => sum + j.bounced, 0);
  const overallOpenRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
  const overallClickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;

  const statusColor = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "sending": return "secondary";
      case "scheduled": return "outline";
      case "failed": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Mail className="h-4 w-4" /> Sent
            </div>
            <p className="text-2xl font-bold">{totalSent}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Eye className="h-4 w-4" /> Open Rate
            </div>
            <p className="text-2xl font-bold">{overallOpenRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <MousePointer className="h-4 w-4" /> Click Rate
            </div>
            <p className="text-2xl font-bold">{overallClickRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <AlertTriangle className="h-4 w-4" /> Bounced
            </div>
            <p className="text-2xl font-bold">{totalBounced}</p>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> Send History & Analytics
          </CardTitle>
          <CardDescription>Performance metrics for each email send</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : jobStats.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No emails have been sent yet. Analytics will appear here after sending.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Open Rate</TableHead>
                  <TableHead>Click Rate</TableHead>
                  <TableHead>Bounced</TableHead>
                  <TableHead>Sent At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobStats.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">
                      {(job.email_list_emails as any)?.subject || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColor(job.status) as any}>{job.status}</Badge>
                    </TableCell>
                    <TableCell>{job.total}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <Progress value={job.openRate} className="h-2 flex-1" />
                        <span className="text-sm text-muted-foreground w-12 text-right">{job.openRate.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <Progress value={job.clickRate} className="h-2 flex-1" />
                        <span className="text-sm text-muted-foreground w-12 text-right">{job.clickRate.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{job.bounced}</TableCell>
                    <TableCell>
                      {job.completed_at
                        ? new Date(job.completed_at).toLocaleString()
                        : job.scheduled_at
                        ? new Date(job.scheduled_at).toLocaleString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
