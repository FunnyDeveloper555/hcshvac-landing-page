import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, FileText, Download } from "lucide-react";

export default function AdminApplicantDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: account, isLoading } = useQuery({
    queryKey: ["admin-applicant", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applicant_accounts").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["admin-applicant-docs", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applicant_documents").select("*")
        .eq("applicant_account_id", id!).order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const { data: consents = [] } = useQuery({
    queryKey: ["admin-applicant-consents", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applicant_consents").select("*").eq("applicant_account_id", id!);
      if (error) throw error;
      return data;
    },
  });

  const { data: interviews = [] } = useQuery({
    queryKey: ["admin-applicant-interviews", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applicant_interviews").select("*")
        .eq("applicant_account_id", id!).order("scheduled_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: psychExam } = useQuery({
    queryKey: ["admin-applicant-exam", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applicant_psych_exams").select("*")
        .eq("applicant_account_id", id!).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [interviewForm, setInterviewForm] = useState({
    scheduled_at: "",
    duration_minutes: 45,
    location: "",
    meeting_url: "",
    interviewer_name: "",
    interviewer_email: "",
    position_title: "",
    applicant_notes: "",
    internal_notes: "",
    generate_meet: true,
  });

  const scheduleInterview = useMutation({
    mutationFn: async () => {
      if (!account || !interviewForm.scheduled_at) throw new Error("Date required");
      const { data, error } = await supabase.functions.invoke("schedule-interview-meeting", {
        body: {
          applicant_account_id: account.id,
          scheduled_at: new Date(interviewForm.scheduled_at).toISOString(),
          duration_minutes: Number(interviewForm.duration_minutes) || 45,
          location: interviewForm.location || null,
          meeting_url: interviewForm.generate_meet ? null : (interviewForm.meeting_url || null),
          interviewer_name: interviewForm.interviewer_name || null,
          interviewer_email: interviewForm.interviewer_email || null,
          position_title: interviewForm.position_title || null,
          applicant_notes: interviewForm.applicant_notes || null,
          internal_notes: interviewForm.internal_notes || null,
          generate_meet: interviewForm.generate_meet,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: () => {
      toast({ title: "Interview scheduled", description: "Meeting link generated and email sent." });
      qc.invalidateQueries({ queryKey: ["admin-applicant-interviews", id] });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const openDoc = async (path: string) => {
    const { data, error } = await supabase.storage
      .from("applicant-documents")
      .createSignedUrl(path, 300);
    if (error) {
      toast({ title: "Could not open file", description: error.message, variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  if (isLoading) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!account) return <div className="p-6 text-muted-foreground">Applicant not found.</div>;

  return (
    <div className="p-4 space-y-4 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle>{account.first_name} {account.last_name}</CardTitle>
          <CardDescription>
            {account.email} • {account.phone || "no phone"} • <Badge variant="secondary">{account.status}</Badge>
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="documents">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="consents">Consents ({consents.length})</TabsTrigger>
          <TabsTrigger value="interview">Interview</TabsTrigger>
          <TabsTrigger value="exam">Psych Exam</TabsTrigger>
        </TabsList>

        <TabsContent value="documents">
          <Card>
            <CardContent className="pt-6 space-y-2">
              {documents.length === 0 && <p className="text-sm text-muted-foreground">No documents uploaded.</p>}
              {documents.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between border rounded p-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{d.document_type}</div>
                      <div className="text-xs text-muted-foreground truncate">{d.file_name}</div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => openDoc(d.file_path)}>
                    <Download className="h-3 w-3 mr-1" /> View
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consents">
          <Card>
            <CardContent className="pt-6 space-y-2">
              {consents.length === 0 && <p className="text-sm text-muted-foreground">No consents signed.</p>}
              {consents.map((c: any) => (
                <div key={c.id} className="border rounded p-2 text-sm">
                  <div className="font-medium">{c.consent_type}</div>
                  <div className="text-xs text-muted-foreground">
                    Signed by {c.signature_name} on {c.signed_at && new Date(c.signed_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interview">
          <Card>
            <CardHeader><CardTitle>Schedule Interview</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Date / Time</Label>
                  <Input type="datetime-local" value={interviewForm.scheduled_at}
                    onChange={(e) => setInterviewForm({ ...interviewForm, scheduled_at: e.target.value })} />
                </div>
                <div>
                  <Label>Position Title</Label>
                  <Input value={interviewForm.position_title}
                    onChange={(e) => setInterviewForm({ ...interviewForm, position_title: e.target.value })} />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input value={interviewForm.location}
                    onChange={(e) => setInterviewForm({ ...interviewForm, location: e.target.value })} />
                </div>
                <div>
                  <Label>Meeting URL</Label>
                  <Input
                    value={interviewForm.generate_meet ? "Will auto-generate Google Meet link" : interviewForm.meeting_url}
                    disabled={interviewForm.generate_meet}
                    onChange={(e) => setInterviewForm({ ...interviewForm, meeting_url: e.target.value })}
                  />
                  <label className="flex items-center gap-2 text-xs mt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={interviewForm.generate_meet}
                      onChange={(e) => setInterviewForm({ ...interviewForm, generate_meet: e.target.checked })}
                    />
                    Auto-generate Google Meet link
                  </label>
                </div>
                <div>
                  <Label>Interviewer Name</Label>
                  <Input value={interviewForm.interviewer_name}
                    onChange={(e) => setInterviewForm({ ...interviewForm, interviewer_name: e.target.value })} />
                </div>
                <div>
                  <Label>Interviewer Email</Label>
                  <Input value={interviewForm.interviewer_email}
                    onChange={(e) => setInterviewForm({ ...interviewForm, interviewer_email: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Notes shown to applicant</Label>
                <Textarea rows={2} value={interviewForm.applicant_notes}
                  onChange={(e) => setInterviewForm({ ...interviewForm, applicant_notes: e.target.value })} />
              </div>
              <div>
                <Label>Internal notes</Label>
                <Textarea rows={2} value={interviewForm.internal_notes}
                  onChange={(e) => setInterviewForm({ ...interviewForm, internal_notes: e.target.value })} />
              </div>
              <Button onClick={() => scheduleInterview.mutate()} disabled={scheduleInterview.isPending}>
                {scheduleInterview.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Schedule
              </Button>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader><CardTitle>Scheduled Interviews</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {interviews.length === 0 && <p className="text-sm text-muted-foreground">None yet.</p>}
              {interviews.map((iv: any) => (
                <div key={iv.id} className="border rounded p-2 text-sm">
                  <div className="font-medium">{new Date(iv.scheduled_at).toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">
                    {iv.interviewer_name || "—"} • {iv.position_title || "—"} • <Badge variant="outline">{iv.status}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exam">
          <Card>
            <CardHeader>
              <CardTitle>Psychological Exam</CardTitle>
              <CardDescription>
                {psychExam?.submitted_at
                  ? `Submitted ${new Date(psychExam.submitted_at).toLocaleString()}`
                  : "Not yet submitted"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {psychExam?.responses ? (
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                  {JSON.stringify(psychExam.responses, null, 2)}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground">No responses yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
