export type WarrantyColor = "green" | "yellow" | "red" | "expired";

export interface WarrantyInput {
  install_date: string | null;
  last_maintenance_date?: string | null;
  maintenance_interval_months?: number | null;
  labor_warranty_years?: number | null;
  equipment_warranty_years?: number | null;
}

const addMonths = (iso: string, m: number) => {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + m);
  return d;
};

/**
 * Green  = warranty active, maintenance up to date.
 * Yellow = warranty active, maintenance overdue by 1–90 days.
 * Red    = maintenance overdue by more than 90 days → warranty VOID.
 * Expired = warranty period has ended.
 */
export function warrantyStatus(r: WarrantyInput, todayIso: string): { color: WarrantyColor; overdueDays: number; dueDate: string | null } {
  if (!r.install_date) return { color: "green", overdueDays: 0, dueDate: null };
  const today = new Date(todayIso + "T00:00:00Z");
  const years = Math.max(r.labor_warranty_years || 0, r.equipment_warranty_years || 0);
  const interval = r.maintenance_interval_months || 12;
  const base = r.last_maintenance_date && r.last_maintenance_date > r.install_date ? r.last_maintenance_date : r.install_date;
  const due = addMonths(base, interval);
  const overdueDays = Math.max(0, Math.floor((today.getTime() - due.getTime()) / 86400000));
  const dueDate = due.toISOString().slice(0, 10);
  if (overdueDays > 90) return { color: "red", overdueDays, dueDate };
  if (years > 0 && today >= addMonths(r.install_date, years * 12)) return { color: "expired", overdueDays, dueDate };
  return { color: overdueDays > 0 ? "yellow" : "green", overdueDays, dueDate };
}

export const WARRANTY_LABEL: Record<WarrantyColor, string> = {
  green: "Active",
  yellow: "Maintenance Due",
  red: "VOID — Maintenance >90 days overdue",
  expired: "Expired",
};

export const WARRANTY_CLASS: Record<WarrantyColor, string> = {
  green: "bg-green-600 text-white hover:bg-green-600",
  yellow: "bg-yellow-400 text-black hover:bg-yellow-400",
  red: "bg-destructive text-destructive-foreground hover:bg-destructive",
  expired: "bg-fuchsia-700 text-white hover:bg-fuchsia-700",
};

export const isInstallationVisit = (visitType?: string | null) => /install/i.test(visitType || "");
