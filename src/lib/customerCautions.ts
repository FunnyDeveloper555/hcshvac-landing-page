// Shared customer cautions/alerts definitions and helpers.
// The customer profile stores cautions_restrictions as JSON:
//   {"selected": { "<key>": true }, "inputs": { "<key>": "details" }}
// Legacy free-text values are kept under the "other" key.

export type CautionOption = {
  key: string;
  label: string;
  needsInput?: boolean;
  blink?: boolean;
  sub?: { key: string; label: string; blink?: boolean }[];
};

export const CAUTION_OPTIONS: CautionOption[] = [
  { key: "call_before_arrival", label: "Call Before Arrival", blink: true },
  { key: "text_before_arrival", label: "Text Before Arrival" },
  { key: "has_dogs", label: "Has Dogs" },
  { key: "has_cats", label: "Has Cats (Allergy Alert)", blink: true },
  {
    key: "handicap",
    label: "Handicap",
    sub: [
      { key: "handicap_deaf", label: "Deaf" },
      { key: "handicap_blind", label: "Blind" },
      { key: "handicap_wheelchair", label: "Wheel Chair / Walker", blink: true },
      { key: "handicap_bed_bound", label: "Bed Bound" },
      { key: "handicap_other", label: "Other" },
    ],
  },
  { key: "doorbell_broken", label: "Doorbell Does not Work" },
  { key: "use_side_door", label: "Use Side Door" },
  { key: "use_back_door", label: "Use Back Door" },
  { key: "customer_opens_garage", label: "Customer Will Open Garage" },
  { key: "buzz_box", label: "Buzz This on Box", needsInput: true },
  { key: "buzzer_nonfunctional", label: "Buzzer System is NON FUNCTIONAL" },
  { key: "see_neighbor", label: "See Neighbor (Name / Address / Phone)", needsInput: true, blink: true },
  { key: "other", label: "Other", needsInput: true },
];

export type CautionsState = {
  selected: Record<string, boolean>;
  inputs: Record<string, string>;
};

export const parseCautions = (raw: string | null | undefined): CautionsState => {
  if (!raw) return { selected: {}, inputs: {} };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.selected) {
      return { selected: parsed.selected || {}, inputs: parsed.inputs || {} };
    }
  } catch {
    // legacy free-text — keep in "other" input
    return { selected: { other: true }, inputs: { other: raw } };
  }
  return { selected: {}, inputs: {} };
};

const labelFor = (key: string): string | undefined => {
  for (const opt of CAUTION_OPTIONS) {
    if (opt.key === key) return opt.label;
    const sub = opt.sub?.find((s) => s.key === key);
    if (sub) return sub.label;
  }
  return undefined;
};

// Human-readable one-line summary, e.g. "Call Before Arrival; Has Dogs; Other: gate code 1234"
export const formatCautions = (raw: string | null | undefined): string => {
  const state = parseCautions(raw);
  const parts: string[] = [];
  for (const [key, on] of Object.entries(state.selected)) {
    if (!on) continue;
    const label = labelFor(key) || key.replace(/_/g, " ");
    const detail = state.inputs[key]?.trim();
    parts.push(detail ? `${label}: ${detail}` : label);
  }
  return parts.join("; ");
};
