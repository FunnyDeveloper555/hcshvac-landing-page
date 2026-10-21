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