import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, CheckCircle2, AlertCircle, LogOut, FileText } from "lucide-react";

const DOCUMENT_TYPES: { value: string; label: string; required?: boolean }[] = [
  { value: "personal_photo", label: "Personal Photo", required: true },
  { value: "drivers_license", label: "Driver's License", required: true },
  { value: "birth_certificate", label: "Birth Certificate", required: true },
  { value: "social_security_card", label: "Social Security Card", required: true },
  { value: "irs_1099", label: "1099 IRS Form", required: true },
  { value: "irs_w4", label: "W-4 IRS Form", required: true },
  { value: "work_authorization", label: "Proof of Legal Right to Work / Citizenship" },
  { value: "address_proof_1", label: "Address / Residency Proof #1", required: true },
  { value: "address_proof_2", label: "Address / Residency Proof #2", required: true },
  { value: "other", label: "Other Supporting Document" },
];

const CONSENTS: { type: string; title: string; body: string }[] = [
  {
    type: "criminal_background_check",
    title: "Consent to Criminal Background Check",
    body: "I authorize the company and its agents to obtain a criminal background report about me for employment purposes.",
  },
  {
    type: "drug_testing",
    title: "Consent to Drug Testing",
    body: "I consent to undergo pre-employment and ongoing drug testing in accordance with company policy and applicable law.",
  },
  {
    type: "driving_history",
    title: "Consent to Driver's History Report",
    body: "I authorize the company to request my motor vehicle / driving history record from state agencies.",
  },
  {
    type: "citizenship_affidavit",
    title: "Citizenship / Legal Right to Work Affidavit",
    body: "I affirm under penalty of perjury that I am a U.S. citizen or otherwise legally authorized to work in the United States.",
  },
  {
    type: "general_terms",
    title: "General Application Terms",
    body: "I certify that the information I provide is true and complete. False statements may result in disqualification or termination.",
  },
];

export default function ApplicantPortal() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [consents, setConsents] = useState<any[]>([]);
  const [interview, setInterview] = useState<any>(null);
  const [psychExam, setPsychExam] = useState<any>(null);
  const [handbookAcked, setHandbookAcked] = useState(false);
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth?redirect=/applicant", { replace: true });
      return;
    }
    const { data: acct } = await supabase
      .from("applicant_accounts")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!acct) {
      setLoading(false);
      return;
    }
    setAccount(acct);

    const [docsRes, consentRes, intRes, examRes, ackRes] = await Promise.all([
      supabase.from("applicant_documents").select("*").eq("applicant_account_id", acct.id).order("created_at"),
      supabase.from("applicant_consents").select("*").eq("applicant_account_id", acct.id),
      supabase.from("applicant_interviews").select("*").eq("applicant_account_id", acct.id)
        .order("scheduled_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("applicant_psych_exams").select("*").eq("applicant_account_id", acct.id)
        .order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("applicant_handbook_acks").select("*").eq("applicant_account_id", acct.id).limit(1).maybeSingle(),
    ]);
    setDocuments(docsRes.data || []);
    setConsents(consentRes.data || []);
    setInterview(intRes.data);
    setPsychExam(examRes.data);
    setHandbookAcked(!!ackRes.data?.acknowledged);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleFileUpload = async (docType: string, file: File) => {
    if (!account) return;
    setUploadingType(docType);
    try {
      const path = `${account.user_id}/${docType}-${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage
        .from("applicant-documents")
        .upload(path, file, { upsert: false });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("applicant_documents").insert({
        applicant_account_id: account.id,
        user_id: account.user_id,
        document_type: docType as any,
        file_path: path,
        file_name: file.name,
        mime_type: file.type,
        file_size: file.size,
      });
      if (insErr) throw insErr;

      toast({ title: "Uploaded", description: file.name });
      await load();
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploadingType(null);
    }
  };

  const handleConsentSubmit = async (type: string, agreed: boolean, signature: string) => {
    if (!account) return;
    if (!agreed || !signature.trim()) {
      toast({ title: "Please agree and type your full name", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("applicant_consents").upsert({
      applicant_account_id: account.id,
      user_id: account.user_id,
      consent_type: type as any,
      agreed: true,
      signature_name: signature.trim(),
      signed_at: new Date().toISOString(),
      user_agent: navigator.userAgent.slice(0, 500),
    }, { onConflict: "applicant_account_id,consent_type" });
    if (error) {
      toast({ title: "Could not save consent", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Consent recorded" });
    await load();
  };

  const ackHandbook = async () => {
    if (!account) return;
    const { error } = await supabase.from("applicant_handbook_acks").insert({
      applicant_account_id: account.id,
      user_id: account.user_id,
      handbook_version: "v1",
      acknowledged: true,
      acknowledged_at: new Date().toISOString(),
      user_agent: navigator.userAgent.slice(0, 500),
    });
    if (error) {
      toast({ title: "Could not record acknowledgment", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Handbook acknowledged" });
    await load();
  };

  const submitPsychExam = async (responses: Record<string, string>) => {
    if (!account) return;
    const payload = {
      applicant_account_id: account.id,
      user_id: account.user_id,
      exam_version: "v1",
      responses,
      submitted_at: new Date().toISOString(),
    };
    let error;
    if (psychExam?.id) {
      ({ error } = await supabase.from("applicant_psych_exams")
        .update(payload).eq("id", psychExam.id));
    } else {
      ({ error } = await supabase.from("applicant_psych_exams").insert(payload));
    }
    if (error) {
      toast({ title: "Submit failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Psychological exam submitted" });
    await load();
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>;
  }

  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader><CardTitle>No Applicant Account</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              We couldn't find an applicant profile for this account. If you applied recently, your portal access may not be set up yet.
            </p>
            <Button variant="outline" onClick={signOut}>Sign out</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Applicant Portal</h1>
            <p className="text-sm text-muted-foreground">
              Welcome {account.first_name || account.email}. Complete every section below.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>

        <Tabs defaultValue="documents">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="documents">Step 1: Documents</TabsTrigger>
            <TabsTrigger value="consents">Step 1: Consents</TabsTrigger>
            <TabsTrigger value="interview">Step 2: Interview</TabsTrigger>
            <TabsTrigger value="handbook">Step 2: Handbook</TabsTrigger>
            <TabsTrigger value="exam">Step 3: Psych Exam</TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-3">
            {DOCUMENT_TYPES.map((dt) => {
              const uploaded = documents.filter((d) => d.document_type === dt.value);
              return (
                <Card key={dt.value}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      {dt.label}
                      {dt.required && <Badge variant="secondary" className="text-xs">Required</Badge>}
                      {uploaded.length > 0 && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {uploaded.length > 0 && (
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {uploaded.map((u) => (
                          <li key={u.id} className="flex items-center gap-2">
                            <FileText className="h-3 w-3" />
                            <span className="truncate">{u.file_name}</span>
                            <Badge variant="outline" className="text-[10px]">{u.status}</Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                    <Label className="cursor-pointer inline-flex items-center gap-2 text-sm border rounded-md px-3 py-2 hover:bg-accent">
                      <Upload className="h-4 w-4" />
                      {uploadingType === dt.value ? "Uploading..." : "Upload file"}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,application/pdf"
                        disabled={uploadingType === dt.value}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUpload(dt.value, f);
                          e.target.value = "";
                        }}
                      />
                    </Label>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="consents" className="space-y-3">
            {CONSENTS.map((c) => {
              const existing = consents.find((x) => x.consent_type === c.type);
              return <ConsentCard key={c.type} consent={c} existing={existing} onSubmit={handleConsentSubmit} />;
            })}
          </TabsContent>

          <TabsContent value="interview">
            <Card>
              <CardHeader>
                <CardTitle>Interview</CardTitle>
                <CardDescription>Your scheduled interview will appear here.</CardDescription>
              </CardHeader>
              <CardContent>
                {interview ? (
                  <div className="space-y-2 text-sm">
                    <div><strong>When:</strong> {new Date(interview.scheduled_at).toLocaleString()}</div>
                    {interview.location && <div><strong>Location:</strong> {interview.location}</div>}
                    {interview.meeting_url && <div><strong>Meeting link:</strong> <a className="text-primary underline" href={interview.meeting_url} target="_blank" rel="noreferrer">Join</a></div>}
                    {interview.interviewer_name && <div><strong>Interviewer:</strong> {interview.interviewer_name}</div>}
                    {interview.position_title && <div><strong>Position:</strong> {interview.position_title}</div>}
                    {interview.applicant_notes && <div className="pt-2 border-t mt-2"><strong>Notes:</strong> {interview.applicant_notes}</div>}
                    <Badge>{interview.status}</Badge>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    No interview scheduled yet. We'll email you when it's set.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="handbook">
            <Card>
              <CardHeader>
                <CardTitle>Corporate Handbook</CardTitle>
                <CardDescription>Please review and acknowledge the handbook.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" asChild>
                  <a href="/handbook.pdf" target="_blank" rel="noreferrer">
                    <FileText className="h-4 w-4 mr-2" /> View Handbook (PDF)
                  </a>
                </Button>
                {handbookAcked ? (
                  <div className="flex items-center gap-2 text-green-700 text-sm">
                    <CheckCircle2 className="h-4 w-4" /> Acknowledged
                  </div>
                ) : (
                  <Button onClick={ackHandbook}>I have read the handbook</Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exam">
            <PsychExam existing={psychExam} onSubmit={submitPsychExam} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ConsentCard({ consent, existing, onSubmit }: {
  consent: { type: string; title: string; body: string };
  existing: any;
  onSubmit: (type: string, agreed: boolean, sig: string) => void;
}) {
  const [agreed, setAgreed] = useState(false);
  const [sig, setSig] = useState("");

  if (existing?.agreed) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {consent.title}
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Signed by <strong>{existing.signature_name}</strong> on {new Date(existing.signed_at).toLocaleString()}.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{consent.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{consent.body}</p>
        <div className="flex items-center gap-2">
          <Checkbox id={`agree-${consent.type}`} checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} />
          <Label htmlFor={`agree-${consent.type}`} className="text-sm">I agree</Label>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Type your full legal name as signature</Label>
          <Input value={sig} onChange={(e) => setSig(e.target.value)} placeholder="Full name" />
        </div>
        <Button size="sm" onClick={() => onSubmit(consent.type, agreed, sig)}>Submit Consent</Button>
      </CardContent>
    </Card>
  );
}

const PSYCH_QUESTIONS = [
  { id: "q1", q: "I work well as part of a team." },
  { id: "q2", q: "I handle stressful situations calmly." },
  { id: "q3", q: "I follow instructions and safety procedures carefully." },
  { id: "q4", q: "I treat customers with respect even when they are difficult." },
  { id: "q5", q: "I am dependable and arrive on time." },
  { id: "q6", q: "I am honest in reporting my work." },
];
const SCALE = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];

function PsychExam({ existing, onSubmit }: { existing: any; onSubmit: (r: Record<string, string>) => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>(existing?.responses || {});
  const [comments, setComments] = useState<string>(existing?.responses?.comments || "");

  const submitted = !!existing?.submitted_at;

  if (submitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Psychological Exam <CheckCircle2 className="h-5 w-5 text-green-600" />
          </CardTitle>
          <CardDescription>Submitted on {new Date(existing.submitted_at).toLocaleString()}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Thank you. Our team will review your responses.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Psychological Exam</CardTitle>
        <CardDescription>Answer honestly. There are no right or wrong answers.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {PSYCH_QUESTIONS.map((q) => (
          <div key={q.id} className="space-y-2">
            <Label className="text-sm">{q.q}</Label>
            <div className="flex flex-wrap gap-2">
              {SCALE.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setAnswers({ ...answers, [q.id]: s })}
                  className={`text-xs border rounded-full px-3 py-1 transition-colors ${
                    answers[q.id] === s ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="space-y-1">
          <Label className="text-sm">Additional comments (optional)</Label>
          <Textarea rows={3} value={comments} onChange={(e) => setComments(e.target.value)} />
        </div>
        <Button onClick={() => {
          const missing = PSYCH_QUESTIONS.filter((q) => !answers[q.id]);
          if (missing.length > 0) {
            alert("Please answer all questions before submitting.");
            return;
          }
          onSubmit({ ...answers, comments });
        }}>Submit Exam</Button>
      </CardContent>
    </Card>
  );
}
