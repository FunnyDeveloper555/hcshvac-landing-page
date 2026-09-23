import { supabase } from "@/integrations/supabase/client";

export type WorkItemKind = "ticket" | "task";
export type WorkItemStatus = "open" | "in_progress" | "completed" | "cancelled";

export interface TeamMember {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

export interface EmployeeOption {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  email_address: string | null;
}

export const WORK_ITEM_STATUSES: { value: WorkItemStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export const statusDotClass: Record<WorkItemStatus, string> = {
  open: "bg-green-500",
  in_progress: "bg-amber-500",
  completed: "bg-gray-400",
  cancelled: "bg-red-500",
};

export const statusLabel = (s: string): string =>
  WORK_ITEM_STATUSES.find((x) => x.value === s)?.label || s;

export const TICKET_REASONS = [
  "Customer Complaint",
  "Callback / Follow Up",
  "Missed Item",
  "Warranty Question",
  "Billing Question",
  "Parts Needed",
  "Paperwork",
  "Other",
];

export const TICKET_PRIORITIES = ["low", "normal", "high", "urgent"];

export const TASK_TYPES = [
  "Meeting",
  "Pick Up",
  "Drop Off",
  "Delivery",
  "Callback",
  "Errand",
  "Training",
  "Other",
];

export const formatHour = (h: number): string => {
  const hour24 = ((h % 24) + 24) % 24;
  if (hour24 === 0) return "12 Midnight";
  if (hour24 === 12) return "12 Noon";
  const period = hour24 < 12 ? "AM" : "PM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12} ${period}`;
};

export const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => `${formatHour(i)} to ${formatHour(i + 2)}`);

export const formatPhone = (input: string): string => {
  const digits = (input || "").replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
};

export const teamNames = (team: unknown): string[] =>
  Array.isArray(team) ? (team as TeamMember[]).map((m) => (m?.name || "").trim()).filter(Boolean) : [];

export const toTeam = (value: unknown): TeamMember[] =>
  Array.isArray(value) ? (value as TeamMember[]) : [];

/** Put a ticket/task on the assigned Google calendar. Never throws. */
export async function syncWorkItemCalendar(kind: WorkItemKind, id: string) {
  const { data, error } = await supabase.functions.invoke("workitem-notify", {
    body: { item_type: kind, item_id: id, action: "sync" },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

/** Text every assigned staff member about a ticket/task. */
export async function notifyWorkItemTeam(kind: WorkItemKind, id: string) {
  const { data, error } = await supabase.functions.invoke("workitem-notify", {
    body: { item_type: kind, item_id: id, action: "sms" },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}
