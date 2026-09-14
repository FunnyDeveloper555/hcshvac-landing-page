import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  OUR_SERVICE_EQUIPMENT,
  OUR_SERVICE_JOB_TYPES,
  OUR_SERVICE_PROPERTY_TYPES,
  OurServicesMap,
  countOurServices,
  ourServiceKey,
} from "@/lib/ourServices";

interface Props {
  value: OurServicesMap;
  onChange: (next: OurServicesMap) => void;
}

const TOTAL =
  OUR_SERVICE_EQUIPMENT.length *
  OUR_SERVICE_PROPERTY_TYPES.length *
  OUR_SERVICE_JOB_TYPES.length;

export default function OurServicesEditor({ value, onChange }: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const selected = useMemo(() => countOurServices(value), [value]);

  const setKeys = (keys: string[], checked: boolean) => {
    const next = { ...value };
    for (const k of keys) {
      if (checked) next[k] = true;
      else delete next[k];
    }
    onChange(next);
  };

  const equipmentKeys = (equipment: string) =>
    OUR_SERVICE_PROPERTY_TYPES.flatMap((p) =>
      OUR_SERVICE_JOB_TYPES.map((j) => ourServiceKey(equipment, p, j)),
    );

  const propertyKeys = (equipment: string, property: string) =>
    OUR_SERVICE_JOB_TYPES.map((j) => ourServiceKey(equipment, property, j));

  const countOf = (keys: string[]) => keys.filter((k) => value[k]).length;

  const allKeys = OUR_SERVICE_EQUIPMENT.flatMap((e) => equipmentKeys(e));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Check all services your company performs. These selections drive the website
          &ldquo;Our Services&rdquo; accordion, the partner listing box, the
          &ldquo;Select Visit Reason&rdquo; options in scheduling forms, and Field Report Types.
        </p>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {selected} of {TOTAL} selected
          </Badge>
          <Button type="button" size="sm" variant="outline" onClick={() => setKeys(allKeys, true)}>
            Select All
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setKeys(allKeys, false)}>
            Clear All
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {OUR_SERVICE_EQUIPMENT.map((equipment) => {
          const eKeys = equipmentKeys(equipment);
          const eCount = countOf(eKeys);
          const isOpen = !!open[equipment];
          return (
            <div key={equipment} className="rounded-md border bg-card">
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <button
                  type="button"
                  className="flex flex-1 items-center gap-2 text-left"
                  onClick={() => setOpen((o) => ({ ...o, [equipment]: !isOpen }))}
                >
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                      isOpen && "rotate-180",
                    )}
                  />
                  <span className="text-sm font-semibold">{equipment}</span>
                  <Badge variant={eCount ? "default" : "outline"} className="text-[11px]">
                    {eCount} of {eKeys.length}
                  </Badge>
                </button>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={() => setKeys(eKeys, true)}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => setKeys(eKeys, false)}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {isOpen && (
                <div className="grid gap-3 border-t p-3 md:grid-cols-2 xl:grid-cols-3">
                  {OUR_SERVICE_PROPERTY_TYPES.map((property) => {
                    const pKeys = propertyKeys(equipment, property);
                    const pCount = countOf(pKeys);
                    return (
                      <div key={property} className="rounded-md border p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {property} {equipment}
                          </span>
                          <button
                            type="button"
                            className="text-xs text-primary hover:underline"
                            onClick={() => setKeys(pKeys, pCount !== pKeys.length)}
                          >
                            {pCount === pKeys.length ? "Clear" : "Select all"}
                          </button>
                        </div>
                        <div className="space-y-1.5">
                          {OUR_SERVICE_JOB_TYPES.map((job) => {
                            const key = ourServiceKey(equipment, property, job);
                            return (
                              <label
                                key={job}
                                className="flex cursor-pointer items-center gap-2 text-sm"
                              >
                                <Checkbox
                                  checked={!!value[key]}
                                  onCheckedChange={(c) => setKeys([key], !!c)}
                                />
                                <span>
                                  {equipment} {job}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
