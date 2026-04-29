import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
] as const;

export const HOLIDAYS = [
  { key: "new_years", label: "New Year's Day (January 1)" },
  { key: "mlk", label: "Martin Luther King Jr. Day (3rd Mon Jan)" },
  { key: "washington", label: "Washington's Birthday (3rd Mon Feb)" },
  { key: "memorial", label: "Memorial Day (last Mon May)" },
  { key: "juneteenth", label: "Juneteenth (June 19)" },
  { key: "independence", label: "Independence Day (July 4)" },
  { key: "labor", label: "Labor Day (1st Mon Sep)" },
  { key: "columbus", label: "Columbus Day (2nd Mon Oct)" },
  { key: "veterans", label: "Veterans Day (November 11)" },
  { key: "thanksgiving", label: "Thanksgiving Day (4th Thu Nov)" },
  { key: "christmas", label: "Christmas Day (December 25)" },
] as const;

export type DayHours = { closed: boolean; open: string; close: string };
export type HoursValue = {
  days: Record<string, DayHours>;
  holidays_closed: string[];
};

const DEFAULT_DAY: DayHours = { closed: false, open: "09:00", close: "17:00" };

export const defaultHours = (): HoursValue => ({
  days: DAYS.reduce((acc, d) => {
    acc[d.key] = { ...DEFAULT_DAY, closed: d.key === "saturday" || d.key === "sunday" };
    return acc;
  }, {} as Record<string, DayHours>),
  holidays_closed: [],
});

export const parseHours = (raw: string | null | undefined): HoursValue => {
  if (!raw) return defaultHours();
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.days) {
      const base = defaultHours();
      return {
        days: { ...base.days, ...parsed.days },
        holidays_closed: Array.isArray(parsed.holidays_closed) ? parsed.holidays_closed : [],
      };
    }
  } catch {
    // legacy plain text — keep default
  }
  return defaultHours();
};

export const serializeHours = (value: HoursValue): string => JSON.stringify(value);

interface Props {
  value: HoursValue;
  onChange: (val: HoursValue) => void;
}

export const HoursOfOperationField = ({ value, onChange }: Props) => {
  const v = useMemo(() => value || defaultHours(), [value]);

  const updateDay = (dayKey: string, patch: Partial<DayHours>) => {
    onChange({
      ...v,
      days: { ...v.days, [dayKey]: { ...v.days[dayKey], ...patch } },
    });
  };

  const toggleHoliday = (key: string, checked: boolean) => {
    const set = new Set(v.holidays_closed);
    if (checked) set.add(key);
    else set.delete(key);
    onChange({ ...v, holidays_closed: Array.from(set) });
  };

  return (
    <div className="space-y-4 border rounded-md p-4 bg-muted/20">
      <div className="space-y-2">
        <Label className="text-base font-semibold">Weekly Hours</Label>
        <div className="space-y-2">
          {DAYS.map((d) => {
            const day = v.days[d.key] || DEFAULT_DAY;
            return (
              <div
                key={d.key}
                className="grid grid-cols-12 gap-2 items-center bg-background rounded p-2"
              >
                <div className="col-span-3 font-medium text-sm">{d.label}</div>
                <div className="col-span-3 flex items-center gap-2">
                  <Switch
                    checked={!day.closed}
                    onCheckedChange={(checked) => updateDay(d.key, { closed: !checked })}
                  />
                  <span className="text-sm text-muted-foreground">
                    {day.closed ? "Closed" : "Open"}
                  </span>
                </div>
                <div className="col-span-3">
                  <Input
                    type="time"
                    value={day.open}
                    disabled={day.closed}
                    onChange={(e) => updateDay(d.key, { open: e.target.value })}
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    type="time"
                    value={day.close}
                    disabled={day.closed}
                    onChange={(e) => updateDay(d.key, { close: e.target.value })}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-base font-semibold">Closed on Holidays</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {HOLIDAYS.map((h) => {
            const checked = v.holidays_closed.includes(h.key);
            return (
              <label
                key={h.key}
                className="flex items-center gap-2 text-sm bg-background rounded p-2 cursor-pointer"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(c) => toggleHoliday(h.key, !!c)}
                />
                <span>{h.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};
