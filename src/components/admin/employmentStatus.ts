// Client-defined employment status tree for the Employee Bio form's
// "Employment Status" tab. Only "active" appears in the Active Employees
// list; every other status lands in the Employee Archive.
export type EmploymentStatusKey =
  | "active"
  | "medical_no_duty"
  | "medical_light_duty"
  | "fmla"
  | "pto"
  | "termination"
  | "voluntary_quit_notice"
  | "voluntary_quit_no_notice"
  | "retirement";

export interface EmploymentStatusOption {
  value: EmploymentStatusKey;
  label: string;
  group?: "Inactive" | "Termination/Separation";
  dates: ("start" | "end" | "final")[];
  tbd?: boolean;
}

export const EMPLOYMENT_STATUS_OPTIONS: EmploymentStatusOption[] = [
  { value: "active", label: "Active", dates: ["start"] },
  { value: "medical_no_duty", label: "Medical No Duty", group: "Inactive", dates: ["start", "end"], tbd: true },
  { value: "medical_light_duty", label: "Medical Light Duty", group: "Inactive", dates: ["start", "end"], tbd: true },
  { value: "fmla", label: "FMLA", group: "Inactive", dates: ["start", "end"] },
  { value: "pto", label: "P.T.O", group: "Inactive", dates: ["start", "end"] },
  { value: "termination", label: "Termination", group: "Termination/Separation", dates: ["final"] },
  { value: "voluntary_quit_notice", label: "Voluntary Quit — W/ 2 Week Notice", group: "Termination/Separation", dates: ["final"] },
  { value: "voluntary_quit_no_notice", label: "Voluntary Quit — Without 2 Week Notice", group: "Termination/Separation", dates: ["final"] },
  { value: "retirement", label: "Retirement", group: "Termination/Separation", dates: ["final"] },
];

export const EMPLOYMENT_STATUS_LABEL: Record<string, string> = Object.fromEntries([
  ...EMPLOYMENT_STATUS_OPTIONS.map((o) => [o.value, o.label] as [string, string]),
  ["on_leave", "On Leave"],
  ["inactive", "Inactive"],
]);
