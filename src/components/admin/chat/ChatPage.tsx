import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Building2, Hash, Loader2, MessageSquare, Paperclip, Phone, Plus, Send, User, X } from "lucide-react";

type Kind = "direct" | "channel" | "company" | "external";
interface Conv {
  id: string; kind: Kind; name: string | null; company_id: string | null;
  external_phone: string | null; external_name: string | null; last_message_at: string;
}
interface Msg {
  id: string; conversation_id: string; sender_id: string | null; sender_name: string | null;
  body: string | null; attachments: Array<{ path?: string; url?: string; name?: string; type?: string }>;
  direction: string; created_at: string;
}
interface Staff { user_id: string; name: string }

const db = supabase as any;
const SECTIONS: Array<{ kind: Kind; label: string; icon: typeof Hash }> = [
  { kind: "direct", label: "Direct messages", icon: User },
  { kind: "channel", label: "Group channels", icon: Hash },
  { kind: "company", label: "Company rooms", icon: Building2 },
  { kind: "external", label: "Customers & vendors (text)", icon: Phone },
];

function useStaff() {
  return useQuery({
    queryKey: ["chat-staff"],
    staleTime: 60_000,
    queryFn: async (): Promise<Staff[]> => {
      const { data: roles } = await db.from("user_roles").select("user_id, role").in("role", ["admin", "moderator"]);
      const ids = [...new Set((roles || []).map((r: any) => r.user_id))];
      if (!ids.length) return [];
      const { data: profs } = await db.from("profiles").select("user_id, display_name, email").in("user_id", ids);
      return (profs || []).map((p: any) => ({ user_id: p.user_id, name: p.display_name || p.email }))
        .sort((a: Staff, b: Staff) => a.name.localeCompare(b.name));
    },
  });
}

export default function ChatPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const activeId = params.get("c");
  const { data: staff = [] } = useStaff();
  const [dialog, setDialog] = useState<null | "direct" | "channel" | "external">(null);

  const { data: convs = [] } = useQuery({
    queryKey: ["chat-conversations"],
    refetchInterval: 5000,
    queryFn: async (): Promise<Conv[]> => {
      const { data } = await db.from("chat_conversations").select("*").order("last_message_at", { ascending: false });
      return data || [];
    },
  });
  const { data: members = [] } = useQuery({
    queryKey: ["chat-members"],
    refetchInterval: 15000,
    queryFn: async () => (await db.from("chat_members").select("conversation_id, user_id")).data || [],
  });
  const { data: unread = {} } = useQuery({
    queryKey: ["chat-unread"],
    refetchInterval: 5000,
    queryFn: async () => {
      const { data } = await db.rpc("chat_unread_counts");
      const map: Record<string, number> = {};
      (data || []).forEach((r: any) => { map[r.conversation_id] = Number(r.unread); });
      return map;
    },
  });
  const { data: companies = [] } = useQuery({
    queryKey: ["chat-companies"],
    staleTime: 60_000,
    queryFn: async () => (await db.from("companies").select("id, name").eq("is_active", true).order("name")).data || [],
  });

  const staffName = (id: string) => staff.find((s) => s.user_id === id)?.name || "Staff";
  const title = (c: Conv) => {
    if (c.kind === "direct") {
      const other = members.filter((m: any) => m.conversation_id === c.id && m.user_id !== user?.id);
      return other.map((m: any) => staffName(m.user_id)).join(", ") || "Just you";
    }
    if (c.kind === "company") return companies.find((x: any) => x.id === c.company_id)?.name || c.name || "Company";
    if (c.kind === "external") return c.external_name || c.name || c.external_phone || "Contact";
    return `# ${c.name}`;
  };

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["chat-conversations"] });
    qc.invalidateQueries({ queryKey: ["chat-members"] });
  };
  const open = (id: string) => setParams({ c: id });

  const openCompany = async (companyId: string, name: string) => {
    const existing = convs.find((c) => c.kind === "company" && c.company_id === companyId);
    if (existing) return open(existing.id);
    const { data, error } = await db.from("chat_conversations")
      .insert({ kind: "company", company_id: companyId, name, created_by: user?.id }).select("id").single();
    if (error) return toast.error(error.message);
    refresh(); open(data.id);
  };

  const active = convs.find((c) => c.id === activeId) || null;
  const missingCompanies = companies.filter((co: any) => !convs.some((c) => c.kind === "company" && c.company_id === co.id));

  return (
    <div className="space-y-3">
      <h2 className="flex items-center gap-2 text-xl font-bold"><MessageSquare className="h-5 w-5" /> Chat</h2>
      <div className="grid gap-3 md:grid-cols-[300px_1fr]">
        <Card className={`max-h-[75vh] overflow-y-auto p-2 ${active ? "hidden md:block" : ""}`}>
          <div className="mb-2 flex flex-wrap gap-1">
            <Button size="sm" variant="outline" onClick={() => setDialog("direct")}><User className="mr-1 h-3 w-3" />Message</Button>
            <Button size="sm" variant="outline" onClick={() => setDialog("channel")}><Hash className="mr-1 h-3 w-3" />Channel</Button>
            <Button size="sm" variant="outline" onClick={() => setDialog("external")}><Phone className="mr-1 h-3 w-3" />Text</Button>
          </div>
          {SECTIONS.map((s) => {
            const list = convs.filter((c) => c.kind === s.kind);
            return (
              <div key={s.kind} className="mb-3">
                <p className="px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">{s.label}</p>
                {list.map((c) => (
                  <button key={c.id} onClick={() => open(c.id)}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent ${c.id === activeId ? "bg-accent" : ""}`}>
                    <s.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className={`flex-1 truncate ${unread[c.id] ? "font-semibold" : ""}`}>{title(c)}</span>
                    {!!unread[c.id] && c.id !== activeId && (
                      <span className="rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">{unread[c.id]}</span>
                    )}
                  </button>
                ))}
                {s.kind === "company" && missingCompanies.map((co: any) => (
                  <button key={co.id} onClick={() => openCompany(co.id, co.name)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-accent">
                    <Building2 className="h-4 w-4 shrink-0" /><span className="flex-1 truncate">{co.name}</span>
                  </button>
                ))}
                {list.length === 0 && s.kind !== "company" && <p className="px-2 text-xs text-muted-foreground">None yet</p>}
              </div>
            );
          })}
        </Card>
        {active ? (
          <ChatThread conv={active} title={title(active)} onBack={() => setParams({})} />
        ) : (
          <Card className="hidden min-h-[400px] items-center justify-center text-sm text-muted-foreground md:flex">
            Pick a conversation or start a new one.
          </Card>
        )}
      </div>
      <NewChatDialog mode={dialog} onClose={() => setDialog(null)} staff={staff.filter((s) => s.user_id !== user?.id)}
        convs={convs} members={members} onOpen={(id) => { refresh(); open(id); }} />
    </div>
  );
}

function ChatThread({ conv, title, onBack }: { conv: Conv; title: string; onBack: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const key = ["chat-messages", conv.id];

  const { data: msgs = [], isLoading } = useQuery({
    queryKey: key,
    refetchInterval: 10000,
    queryFn: async (): Promise<Msg[]> => {
      const { data } = await db.from("chat_messages").select("*").eq("conversation_id", conv.id)
        .order("created_at", { ascending: false }).limit(200);
      return (data || []).reverse();
    },
  });

  // Live updates for this conversation.
  useEffect(() => {
    const ch = supabase.channel(`chat-${conv.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `conversation_id=eq.${conv.id}` },
        () => qc.invalidateQueries({ queryKey: ["chat-messages", conv.id] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [conv.id, qc]);

  // Mark read whenever new messages show while the thread is open.
  useEffect(() => {
    if (!user) return;
    db.from("chat_members").upsert({ conversation_id: conv.id, user_id: user.id, last_read_at: new Date().toISOString() },
      { onConflict: "conversation_id,user_id" }).then(() => {
      qc.invalidateQueries({ queryKey: ["chat-unread"] });
      qc.invalidateQueries({ queryKey: ["sidebar-chat-unread"] });
    });
    bottom.current?.scrollIntoView({ block: "end" });
  }, [msgs.length, conv.id, user, qc]);

  const send = async () => {
    if (!text.trim() && files.length === 0) return;
    setSending(true);
    try {
      const attachments = [];
      for (const f of files) {
        const path = `${conv.id}/${Date.now()}-${f.name.replace(/[^\w.-]/g, "_")}`;
        const { error } = await supabase.storage.from("chat-files").upload(path, f, { contentType: f.type });
        if (error) throw error;
        attachments.push({ path, name: f.name, type: f.type });
      }
      const { data, error } = await supabase.functions.invoke("chat-send", {
        body: { conversation_id: conv.id, body: text, attachments },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setText(""); setFiles([]);
      qc.invalidateQueries({ queryKey: key });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="flex h-[75vh] flex-col">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Button variant="ghost" size="sm" className="md:hidden" onClick={onBack}>←</Button>
        <span className="font-semibold">{title}</span>
        {conv.kind === "external" && <span className="text-xs text-muted-foreground">{conv.external_phone} · sent as text</span>}
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {isLoading && <Loader2 className="mx-auto h-5 w-5 animate-spin" />}
        {!isLoading && msgs.length === 0 && <p className="text-center text-sm text-muted-foreground">No messages yet. Say hello.</p>}
        {msgs.map((m) => {
          const mine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                <p className="text-xs opacity-75">
                  {mine ? "You" : m.sender_name || "Unknown"} · {format(new Date(m.created_at), "MMM d, h:mm a")}
                  {m.direction === "inbound" && " · text received"}{m.direction === "outbound" && " · text sent"}
                </p>
                {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                {(m.attachments || []).map((a, i) => <Attachment key={i} a={a} />)}
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      <div className="border-t p-2">
        {files.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {files.map((f, i) => (
              <span key={i} className="flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs">
                {f.name}<button onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label="Remove file"><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <input ref={fileInput} type="file" multiple hidden onChange={(e) => setFiles([...files, ...Array.from(e.target.files || [])])} />
          <Button variant="outline" size="icon" onClick={() => fileInput.current?.click()} aria-label="Attach files"><Paperclip className="h-4 w-4" /></Button>
          <Textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
          <Button onClick={send} disabled={sending} aria-label="Send">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function Attachment({ a }: { a: Msg["attachments"][number] }) {
  const [url, setUrl] = useState<string | null>(a.url || null);
  useEffect(() => {
    if (a.path && !a.url) supabase.storage.from("chat-files").createSignedUrl(a.path, 3600).then(({ data }) => setUrl(data?.signedUrl || null));
  }, [a.path, a.url]);
  if (!url) return null;
  const isImage = (a.type || "").startsWith("image/") || a.name === "photo";
  return isImage ? (
    <a href={url} target="_blank" rel="noreferrer"><img src={url} alt={a.name || "photo"} className="mt-1 max-h-48 rounded" /></a>
  ) : (
    <a href={url} target="_blank" rel="noreferrer" className="mt-1 block underline">📎 {a.name || "file"}</a>
  );
}

function NewChatDialog({ mode, onClose, staff, convs, members, onOpen }: {
  mode: null | "direct" | "channel" | "external"; onClose: () => void; staff: Staff[];
  convs: Conv[]; members: any[]; onOpen: (id: string) => void;
}) {
  const { user } = useAuth();
  const [picked, setPicked] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => { setPicked([]); setName(""); setPhone(""); setSearch(""); }, [mode]);

  const { data: contacts = [] } = useQuery({
    queryKey: ["chat-contacts", search],
    enabled: mode === "external" && search.trim().length >= 2,
    queryFn: async () => {
      const q = `%${search.trim()}%`;
      const [c, v] = await Promise.all([
        db.from("customer_registrations").select("id, ship_to_first_name, ship_to_last_name, ship_to_business_name, phone")
          .or(`ship_to_first_name.ilike.${q},ship_to_last_name.ilike.${q},ship_to_business_name.ilike.${q},phone.ilike.${q}`).limit(10),
        db.from("vendors").select("id, vendor_name, phone, representative_phone").or(`vendor_name.ilike.${q},phone.ilike.${q}`).limit(10),
      ]);
      return [
        ...(c.data || []).map((x: any) => ({ type: "customer", name: [x.ship_to_first_name, x.ship_to_last_name].filter(Boolean).join(" ") || x.ship_to_business_name, phone: x.phone })),
        ...(v.data || []).map((x: any) => ({ type: "vendor", name: x.vendor_name, phone: x.representative_phone || x.phone })),
      ].filter((x) => x.phone);
    },
  });

  const toE164 = (p: string) => {
    let d = p.replace(/\D/g, ""); if (d.length === 10) d = "1" + d;
    return d.length >= 11 ? "+" + d : null;
  };

  const create = async (row: Record<string, unknown>, memberIds: string[]) => {
    const { data, error } = await db.from("chat_conversations").insert({ ...row, created_by: user?.id }).select("id").single();
    if (error) { toast.error(error.message); return; }
    await db.from("chat_members").insert(memberIds.map((u) => ({ conversation_id: data.id, user_id: u })));
    onClose(); onOpen(data.id);
  };

  const startDirect = async () => {
    if (!user || picked.length === 0) return toast.error("Pick at least one person");
    const want = [...picked, user.id].sort().join(",");
    const existing = convs.find((c) => c.kind === "direct" &&
      members.filter((m) => m.conversation_id === c.id).map((m) => m.user_id).sort().join(",") === want);
    if (existing) { onClose(); return onOpen(existing.id); }
    await create({ kind: "direct" }, [user.id, ...picked]);
  };
  const startChannel = async () => {
    if (!user || !name.trim()) return toast.error("Give the channel a name");
    await create({ kind: "channel", name: name.trim().replace(/^#/, "") }, [user.id]);
  };
  const startExternal = async (p: string, n: string, type: string) => {
    const e164 = toE164(p);
    if (!user || !e164) return toast.error("Enter a valid 10-digit phone number");
    const existing = convs.find((c) => c.kind === "external" && c.external_phone === e164);
    if (existing) { onClose(); return onOpen(existing.id); }
    await create({ kind: "external", external_phone: e164, external_name: n || null, name: n || e164, external_type: type }, [user.id]);
  };

  const toggle = (id: string) => setPicked((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  return (
    <Dialog open={!!mode} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "direct" ? "New message" : mode === "channel" ? "New group channel" : "Text a customer or vendor"}
          </DialogTitle>
        </DialogHeader>
        {mode === "direct" && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Pick one person for a private chat, or several for a small group.</p>
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {staff.map((s) => (
                <label key={s.user_id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-accent">
                  <input type="checkbox" checked={picked.includes(s.user_id)} onChange={() => toggle(s.user_id)} />{s.name}
                </label>
              ))}
              {staff.length === 0 && <p className="text-sm text-muted-foreground">No other staff accounts yet.</p>}
            </div>
            <Button onClick={startDirect} className="w-full"><Plus className="mr-1 h-4 w-4" />Start chat</Button>
          </div>
        )}
        {mode === "channel" && (
          <div className="space-y-2">
            <Input placeholder="e.g. Dispatch, Installers" value={name} onChange={(e) => setName(e.target.value)} />
            <p className="text-xs text-muted-foreground">Every staff member can see and join group channels.</p>
            <Button onClick={startChannel} className="w-full"><Plus className="mr-1 h-4 w-4" />Create channel</Button>
          </div>
        )}
        {mode === "external" && (
          <div className="space-y-3">
            <Input placeholder="Search customers or vendors by name or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {contacts.map((c: any, i: number) => (
                <button key={i} onClick={() => startExternal(c.phone, c.name, c.type)} className="flex w-full justify-between rounded px-2 py-1 text-left text-sm hover:bg-accent">
                  <span>{c.name} <span className="text-xs text-muted-foreground">({c.type})</span></span>
                  <span className="text-xs text-muted-foreground">{c.phone}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2 border-t pt-3">
              <Input placeholder="Or type a phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Button onClick={() => startExternal(phone, "", "other")}>Start</Button>
            </div>
            <p className="text-xs text-muted-foreground">Messages go out as texts from your company number, and replies show up here.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
