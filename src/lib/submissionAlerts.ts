export interface PendingSubmission {
  id: string;
  kind: string;
  customer_name: string;
  company_name: string | null;
  submitted_at: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
}

export const submissionPath = (submission: Pick<PendingSubmission, "id" | "kind">) =>
  `/admin/${submission.kind === "registration" ? "customers" : "appointments"}/add?id=${encodeURIComponent(submission.id)}`;

export const pendingSubmissionIds = (
  submissions: ReadonlyArray<Pick<PendingSubmission, "id" | "kind">>,
  kind: "registration" | "appointment",
) => new Set(submissions.filter((submission) => submission.kind === kind).map((submission) => submission.id));

export type SubmissionAgeStage = "new" | "yellow" | "red" | "double-red";

export function submissionAgeStage(submittedAt: string, now = Date.now()): SubmissionAgeStage {
  const hours = (now - Date.parse(submittedAt)) / 3600000;
  if (hours >= 48) return "double-red";
  if (hours >= 24) return "red";
  if (hours >= 12) return "yellow";
  return "new";
}

export function oldestPendingSubmission(
  submissions: ReadonlyArray<Pick<PendingSubmission, "kind" | "submitted_at">>,
  kind: "registration" | "appointment",
) {
  return submissions.filter((submission) => submission.kind === kind)
    .reduce<string | undefined>((oldest, submission) =>
      !oldest || Date.parse(submission.submitted_at) < Date.parse(oldest) ? submission.submitted_at : oldest, undefined);
}