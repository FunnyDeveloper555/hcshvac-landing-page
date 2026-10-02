import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface Quote {
  task_number: string;
  title: string;
  quote_total: number | null;
  quote_status: string | null;
  customer_name: string | null;
  company_name: string | null;
}

export default function QuoteApproval() {
  const { token } = useParams();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("get_task_quote" as never, { _token: token } as never);
      const row = Array.isArray(data) ? (data[0] as Quote) : null;
      if (error || !row) setError("This quote link is not valid.");
      else setQuote(row);
      setLoading(false);
    })();
  }, [token]);

  const respond = async (decision: "approved" | "declined") => {
    setBusy(true);
    const { data, error } = await supabase.rpc("respond_task_quote" as never, { _token: token, _decision: decision } as never);
    setBusy(false);
    if (error) return setError(error.message);
    setQuote((q) => (q ? { ...q, quote_status: data as unknown as string } : q));
  };

  const done = quote?.quote_status === "approved" || quote?.quote_status === "declined";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{quote?.company_name || "Your service quote"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
          ) : error ? (
            <p className="text-destructive">{error}</p>
          ) : quote ? (
            <>
              {quote.customer_name && <p>Hi {quote.customer_name},</p>}
              <p>We located the part for: <b>{quote.title}</b></p>
              <p className="text-3xl font-bold">${Number(quote.quote_total || 0).toFixed(2)}</p>
              {done ? (
                <p className="font-medium">
                  Thank you — you {quote.quote_status} this quote. We'll be in touch.
                </p>
              ) : (
                <div className="flex gap-2">
                  <Button className="flex-1" disabled={busy} onClick={() => respond("approved")}>Approve</Button>
                  <Button className="flex-1" variant="outline" disabled={busy} onClick={() => respond("declined")}>Decline</Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">Ref {quote.task_number}</p>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
