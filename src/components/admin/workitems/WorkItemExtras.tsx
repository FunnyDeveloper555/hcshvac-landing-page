import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, FileText, Loader2, MessageSquare, Paperclip, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { WorkItemKind, formatPhone } from "./workItems";

export type ForType = "employee" | "customer" | "vendor" | "other";

export const FOR_TYPES: { value: ForType; label: string }[] = [
  { value: "employee", label: "Employee" },
  { value: "customer", label: "Customer" },
  { value: "vendor", label: "Vendor" },
  { value: "other", label: "Other" },
];

export interface Attachment {
  path: string;
  name: string;
  type: string;
  size: number;
}

export const toAttachments = (v: unknown): Attachment[] => (Array.isArray(v) ? (v as Attachment[]) : []);

export interface VendorLite {
  id: string;
  vendor_name: string;
  vendor_address: string | null;
  phone: string | null;
  representative_first_name: string | null;
  representative_last_name: string | null;
  representative_phone: string | null;
  representative_email: string | null;
}

export const vendorContact = (v: VendorLite) =>
  [
    v.vendor_address,
    [v.representative_first_name, v.representative_last_name].filter(Boolean).join(" "),
    formatPhone(v.representative_phone || v.phone || ""),
    v.representative_email,
  ]
    .filter(Boolean)
    .join(" • ");

export function useCompanyOptions() {
  return useQuery({
    queryKey: ["workitem-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, company_initials, company_address, company_city, company_state, company_zip_code")
        .order("name");
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });
}

export function CompanySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { data } = useCompanyOptions();
  return (
    <div>
      <Label className="mb-2 block">Company</Label>
      <RadioGroup
        value={value || "none"}
        onValueChange={(v) => onChange(v === "none" ? "" : v)}
        className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
      >
        <label className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm">
          <RadioGroupItem value="none" /> HCS Corp (head office)
        </label>
        {(data || []).map((c) => (
          <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm">
            <RadioGroupItem value={c.id} />
            <span className="truncate">
              {c.name}
              {c.company_initials ? ` (${c.company_initials})` : ""}
            </span>
          </label>
        ))}
      </RadioGroup>
      <p className="mt-1 text-xs text-muted-foreground">The number starts with this company's initials.</p>
    </div>
  );
}

export function ForTypeRadio({ value, onChange }: { value: ForType; onChange: (v: ForType) => void }) {
  return (
    <div>
      <Label className="mb-2 block">Who is this for? *</Label>
      <RadioGroup value={value} onValueChange={(v) => onChange(v as ForType)} className="flex flex-wrap gap-4">
        {FOR_TYPES.map((t) => (
          <label key={t.value} className="flex cursor-pointer items-center gap-2 text-sm">
            <RadioGroupItem value={t.value} /> {t.label}
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}

const VENDOR_COLUMNS =
  "id, vendor_name, vendor_address, phone, representative_first_name, representative_last_name, representative_phone, representative_email";

export async function loadVendor(id: string) {
  const { data } = await supabase.from("vendors").select(VENDOR_COLUMNS).eq("id", id).maybeSingle();
  return (data as VendorLite) || null;
}

export function VendorPicker({
  selected,
  onSelect,
  onClear,
}: {
  selected: VendorLite | null;
  onSelect: (v: VendorLite) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["workitem-vendors", search],
    queryFn: async () => {
      let q = supabase.from("vendors").select(VENDOR_COLUMNS).order("vendor_name").limit(50);
      const term = search.trim();
      if (term) {
        const like = `%${term}%`;
        q = q.or(
          `vendor_name.ilike.${like},vendor_address.ilike.${like},phone.ilike.${like},representative_first_name.ilike.${like},representative_last_name.ilike.${like},representative_email.ilike.${like}`,
        );
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as VendorLite[];
    },
    staleTime: 15_000,
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" className="flex-1 justify-between font-normal">
              {selected ? selected.vendor_name : "Search a vendor"}
              <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[420px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput placeholder="Vendor name, location, contact…" value={search} onValueChange={setSearch} />
              <CommandList>
                <CommandEmpty>{isLoading ? "Searching…" : "No vendors found"}</CommandEmpty>
                <CommandGroup>
                  {(data || []).map((v) => (
                    <CommandItem key={v.id} value={v.id} onSelect={() => { onSelect(v); setOpen(false); }}>
                      <Check className={cn("mr-2 h-4 w-4", selected?.id === v.id ? "opacity-100" : "opacity-0")} />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{v.vendor_name}</div>
                        <div className="truncate text-xs text-muted-foreground">{v.vendor_address}</div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {selected && (
          <Button variant="ghost" size="icon" onClick={onClear} title="Remove vendor">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {selected && (
        <div className="rounded-md border bg-muted/30 p-2 text-xs text-muted-foreground">
          <div className="font-medium text-foreground">{selected.vendor_name}</div>
          <div>{vendorContact(selected)}</div>
        </div>
      )}
    </div>
  );
}

/** Photo / file uploads for a ticket or task. Files live in private storage; links are signed on view. */
export function AttachmentsField({
  kind,
  value,
  onChange,
}: {
  kind: WorkItemKind;
  value: Attachment[];
  onChange: (v: Attachment[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const missing = value.filter((a) => !urls[a.path]);
    if (!missing.length) return;
    supabase.storage
      .from("workitem-files")
      .createSignedUrls(missing.map((a) => a.path), 3600)
      .then(({ data }) => {
        const next: Record<string, string> = {};
        (data || []).forEach((d) => { if (d.path && d.signedUrl) next[d.path] = d.signedUrl; });
        setUrls((p) => ({ ...p, ...next }));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const added: Attachment[] = [];
    for (const f of Array.from(files)) {
      const safe = f.name.replace(/[^\w.-]+/g, "_");
      const path = `${kind}s/${crypto.randomUUID()}-${safe}`;
      const { error } = await supabase.storage.from("workitem-files").upload(path, f, { contentType: f.type });
      if (error) toast.error(`${f.name}: ${error.message}`);
      else added.push({ path, name: f.name, type: f.type, size: f.size });
    }
    onChange([...value, ...added]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = async (a: Attachment) => {
    onChange(value.filter((x) => x.path !== a.path));
    await supabase.storage.from("workitem-files").remove([a.path]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2"><Paperclip className="h-4 w-4" /> Photos &amp; Files</Label>
        <Button type="button" size="sm" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Upload
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
          className="hidden"
          onChange={(e) => upload(e.target.files)}
        />
      </div>
      {value.length === 0 ? (
        <p className="text-xs text-muted-foreground">No photos or files yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {value.map((a) => (
            <div key={a.path} className="group relative overflow-hidden rounded-md border">
              <a href={urls[a.path]} target="_blank" rel="noreferrer" className="block aspect-square bg-muted">
                {a.type.startsWith("image/") && urls[a.path] ? (
                  <img src={urls[a.path]} alt={a.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-1 p-1 text-center text-[10px] text-muted-foreground">
                    <FileText className="h-6 w-6" />
                    <span className="line-clamp-2 break-all">{a.name}</span>
                  </div>
                )}
              </a>
              <button
                type="button"
                onClick={() => remove(a)}
                className="absolute right-1 top-1 rounded bg-background/80 p-1 opacity-0 transition group-hover:opacity-100"
                title="Remove"
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Two-way conversation on a ticket or task. */
export function RepliesThread({ kind, itemId }: { kind: WorkItemKind; itemId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const key = ["workitem-replies", kind, itemId];

  const { data: replies } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_item_replies")
        .select("*")
        .eq("item_type", kind)
        .eq("item_id", itemId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const send = async () => {
    if (!text.trim() || !user) return;
    setSending(true);
    const { data: prof } = await supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle();
    const { error } = await supabase.from("work_item_replies").insert({
      item_type: kind,
      item_id: itemId,
      author_id: user.id,
      author_name: prof?.display_name || user.email,
      message: text.trim(),
    });
    setSending(false);
    if (error) return toast.error(error.message);
    setText("");
    toast.success("Note posted");
    qc.invalidateQueries({ queryKey: key });
    qc.invalidateQueries({ queryKey: ["customer-work-history"] });
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Notes Log</Label>
      <p className="text-xs text-muted-foreground">Each note is posted on its own and stamped with who wrote it, plus the date and time. Notes also show in the customer's history.</p>
      <div className="max-h-72 space-y-2 overflow-y-auto">
        {(replies || []).length === 0 && <p className="text-xs text-muted-foreground">No notes yet.</p>}
        {(replies || []).map((r) => (
          <div
            key={r.id}
            className={cn(
              "rounded-md border p-2 text-sm",
              r.author_id === user?.id ? "ml-8 bg-primary/5" : "mr-8 bg-muted/40",
            )}
          >
            <div className="mb-1 text-xs text-muted-foreground">
              {r.author_name || "Staff"} • {new Date(r.created_at).toLocaleString()}
            </div>
            <div className="whitespace-pre-wrap">{r.message}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a note update…" />
        <Button type="button" onClick={send} disabled={sending || !text.trim()}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-1 h-4 w-4" />Submit Note</>}
        </Button>
      </div>
    </div>
  );
}

