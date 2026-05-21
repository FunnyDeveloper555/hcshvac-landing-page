import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

/**
 * Landing page after the applicant clicks the recovery link from email.
 * Supabase puts the recovery session into the URL hash; the SDK auto-consumes it.
 * We then let the user pick a permanent password.
 */
export default function ApplicantSetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Wait briefly for SDK to consume hash
      await new Promise((r) => setTimeout(r, 100));
      const { data } = await supabase.auth.getSession();
      setHasSession(!!data.session);
      setLoading(false);
    };
    init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "Password too short", description: "Must be at least 8 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast({ title: "Could not update password", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }
    // Mark the applicant account as active
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("applicant_accounts")
        .update({ status: "active", activated_at: new Date().toISOString() })
        .eq("user_id", user.id);
    }
    toast({ title: "Password set", description: "Welcome to your applicant portal." });
    navigate("/applicant", { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader><CardTitle>Link Expired</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This password setup link is no longer valid. Please contact the company to receive a new one.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Set Your Password</CardTitle>
          <CardDescription>
            Choose a password for your applicant portal. We recommend changing it again later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pw">New Password</Label>
              <Input id="pw" type="password" value={password} required minLength={8}
                onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pw2">Confirm Password</Label>
              <Input id="pw2" type="password" value={confirm} required minLength={8}
                onChange={(e) => setConfirm(e.target.value)} />
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Set Password & Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
