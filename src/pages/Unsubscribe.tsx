import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type State = "loading" | "valid" | "already" | "invalid" | "submitting" | "done" | "error";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState("");

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const anon = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

  useEffect(() => {
    if (!token) {
      setState("invalid");
      setMessage("No unsubscribe token provided.");
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: anon } }
        );
        const data = await res.json();
        if (!res.ok) {
          setState("invalid");
          setMessage(data.error || "Invalid or expired link.");
        } else if (data.valid === false && data.reason === "already_unsubscribed") {
          setState("already");
        } else if (data.valid) {
          setState("valid");
        } else {
          setState("invalid");
          setMessage("Invalid or expired link.");
        }
      } catch {
        setState("error");
        setMessage("Could not validate link. Please try again.");
      }
    })();
  }, [token, supabaseUrl, anon]);

  const handleConfirm = async () => {
    setState("submitting");
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      if ((data as any)?.success || (data as any)?.reason === "already_unsubscribed") {
        setState("done");
      } else {
        setState("error");
        setMessage((data as any)?.error || "Unable to process unsubscribe.");
      }
    } catch (e: any) {
      setState("error");
      setMessage(e.message || "Unable to process unsubscribe.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Email Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {state === "loading" && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Validating link…
            </div>
          )}
          {state === "valid" && (
            <>
              <p className="text-sm">Are you sure you want to unsubscribe from these emails?</p>
              <Button onClick={handleConfirm} className="w-full">Confirm Unsubscribe</Button>
            </>
          )}
          {state === "submitting" && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Processing…
            </div>
          )}
          {state === "done" && (
            <div className="flex items-start gap-2 text-foreground">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <p>You've been unsubscribed. You won't receive these emails anymore.</p>
            </div>
          )}
          {state === "already" && (
            <div className="flex items-start gap-2 text-foreground">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <p>You're already unsubscribed.</p>
            </div>
          )}
          {(state === "invalid" || state === "error") && (
            <div className="flex items-start gap-2 text-foreground">
              <XCircle className="h-5 w-5 text-destructive mt-0.5" />
              <p>{message}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
