import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmployeeOption, TeamMember, formatPhone } from "./workItems";

export interface CustomerLite {
  id: string;
  account_number: string | null;
  ship_to_first_name: string;
  ship_to_last_name: string;
  ship_to_business_name: string | null;
  ship_to_address: string;
  ship_to_city: string;
  ship_to_state: string;
  ship_to_zip_code: string;
  email: string;
  phone: string;
}

export const customerLabel = (c: CustomerLite) =>
  [c.ship_to_business_name, `${c.ship_to_first_name} ${c.ship_to_last_name}`.trim()].filter(Boolean).join(" — ");

export const customerAddress = (c: CustomerLite) =>
  [c.ship_to_address, c.ship_to_city, [c.ship_to_state, c.ship_to_zip_code].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");

const CUSTOMER_COLUMNS =
  "id, account_number, ship_to_first_name, ship_to_last_name, ship_to_business_name, ship_to_address, ship_to_city, ship_to_state, ship_to_zip_code, email, phone";

/** Optional customer selector — tickets can be internal with no customer at all. */
export function CustomerPicker({
  selected,
  onSelect,
  onClear,
}: {
  selected: CustomerLite | null;
  onSelect: (c: CustomerLite) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: customers, isLoading } = useQuery({
    queryKey: ["workitem-customers", search],
    queryFn: async () => {
      let q = supabase
        .from("customer_registrations")
        .select(CUSTOMER_COLUMNS)
        .order("created_at", { ascending: false })
        .limit(50);
      const term = search.trim();
      if (term) {
        const like = `%${term}%`;
        q = q.or(
          `ship_to_first_name.ilike.${like},ship_to_last_name.ilike.${like},ship_to_business_name.ilike.${like},email.ilike.${like},phone.ilike.${like},account_number.ilike.${like}`,
        );
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as CustomerLite[];
    },
    staleTime: 15_000,
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" className="flex-1 justify-between font-normal">
              {selected ? customerLabel(selected) : "Search a customer (optional)"}
              <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[420px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput placeholder="Name, business, phone, email…" value={search} onValueChange={setSearch} />
              <CommandList>
                <CommandEmpty>{isLoading ? "Searching…" : "No customers found"}</CommandEmpty>
                <CommandGroup>
                  {(customers || []).map((c) => (
                    <CommandItem
                      key={c.id}
                      value={c.id}
                      onSelect={() => {
                        onSelect(c);
                        setOpen(false);
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", selected?.id === c.id ? "opacity-100" : "opacity-0")} />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{customerLabel(c)}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {formatPhone(c.phone)} {c.account_number ? `• ${c.account_number}` : ""}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {selected && (
          <Button variant="ghost" size="icon" onClick={onClear} title="Remove customer">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {selected && (
        <div className="rounded-md border bg-muted/30 p-2 text-xs text-muted-foreground">
          <div className="font-medium text-foreground">{customerLabel(selected)}</div>
          <div>{customerAddress(selected)}</div>
          <div>
            {formatPhone(selected.phone)} {selected.email ? `• ${selected.email}` : ""}
          </div>
        </div>
      )}
    </div>
  );
}

/** Checkbox list of staff — one or many people can be assigned. */
export function TeamChecklist({
  employees,
  team,
  onToggle,
  companyId,
}: {
  employees: EmployeeOption[] | undefined;
  team: TeamMember[];
  onToggle: (emp: EmployeeOption, checked: boolean) => void;
  companyId?: string;
}) {
  const [q, setQ] = useState("");
  const [onlyCompany, setOnlyCompany] = useState(true);
  const term = q.trim().toLowerCase();
  const list = (employees || []).filter((e) => {
    if (companyId && onlyCompany && e.company_id && e.company_id !== companyId) return false;
    if (!term) return true;
    return [e.first_name, e.last_name, e.employee_code, e.phone_number, e.email_address, e.id]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(term));
  });
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Users className="h-4 w-4" /> Assign To *
      </Label>
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, staff code, phone, email…"
          className="h-8 flex-1 rounded-md border bg-background px-2 text-sm"
        />
        {companyId && (
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Checkbox checked={onlyCompany} onCheckedChange={(v) => setOnlyCompany(v === true)} /> This company's staff only
          </label>
        )}
      </div>
      <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-md border p-2">
        {list.length === 0 && (
          <p className="text-xs text-muted-foreground">No matching staff.</p>
        )}
        {list.map((e) => {
          const checked = team.some((m) => m.id === e.id);
          return (
            <label key={e.id} className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={checked} onCheckedChange={(v) => onToggle(e, v === true)} />
              <span>
                {e.first_name} {e.last_name}
                {e.employee_code && <span className="ml-1 font-mono text-xs text-muted-foreground">({e.employee_code})</span>}
              </span>
              {e.phone_number && <span className="text-xs text-muted-foreground">{e.phone_number}</span>}
            </label>
          );
        })}
      </div>
      {team.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {team.length} assigned — {team.map((m) => m.name).join(", ")}
        </p>
      )}
    </div>
  );
}

export function useEmployeeOptions() {
  return useQuery({
    queryKey: ["workitem-employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, phone_number, email_address, employee_code, company_id")
        .order("first_name");
      if (error) throw error;
      return data as EmployeeOption[];
    },
    staleTime: 30_000,
  });
}

export function useCalendarOptions() {
  return useQuery({
    queryKey: ["calendars-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calendars")
        .select("id, calendar_name, calendar_type, is_active")
        .eq("is_active", true)
        .order("calendar_name");
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });
}
