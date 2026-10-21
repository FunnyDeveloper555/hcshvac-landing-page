import { useNavigate } from "react-router-dom";
import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePendingSubmissions } from "@/hooks/usePendingSubmissions";
import { submissionPath } from "@/lib/submissionAlerts";

export default function SubmissionActionAlerts() {
  const { data = [], isError } = usePendingSubmissions();
  const navigate = useNavigate();
  if (isError) return <div role="alert" className="border-b border-destructive px-4 py-2 text-sm text-destructive">Customer submission alerts could not be loaded.</div>;
  if (!data.length) return null;
  return (
    <section aria-label="Submissions needing completion" className="border-b border-destructive/30 bg-background px-4 py-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-destructive"><ClipboardCheck className="h-4 w-4" />Needs completion ({data.length})</div>
      <div className="flex flex-wrap gap-2 pt-2">
        {data.slice(0, 3).map((s) => <Button key={`${s.kind}-${s.id}`} variant="outline" size="sm" className="h-auto max-w-full whitespace-normal text-left justify-start" onClick={() => navigate(submissionPath(s))}>
          {s.kind === "registration" ? "New Registration" : "Suggested Appointment"} — Incomplete · {s.customer_name}{s.company_name ? ` · ${s.company_name}` : ""}
        </Button>)}
      </div>
    </section>
  );
}