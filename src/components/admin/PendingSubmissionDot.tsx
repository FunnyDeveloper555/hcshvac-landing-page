import { submissionAgeStage } from "@/lib/submissionAlerts";

export function PendingSubmissionDot({ submittedAt }: { submittedAt: string }) {
  const stage = submissionAgeStage(submittedAt);
  const label = stage === "double-red" ? "Needs completion — 48+ hours"
    : stage === "red" ? "Needs completion — 24+ hours"
    : stage === "yellow" ? "Needs completion — 12+ hours" : "Needs completion — new";
  const color = stage === "new" ? "bg-submission-new" : stage === "yellow" ? "bg-submission-warning" : "bg-destructive";
  return (
    <span className="inline-flex h-2 w-5 shrink-0 items-center gap-1" role="img" aria-label={label} title={label}>
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {stage === "double-red" && <span className="h-2 w-2 rounded-full bg-destructive" />}
    </span>
  );
}