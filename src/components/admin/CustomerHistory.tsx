import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search } from "lucide-react";
import { format } from "date-fns";

const digits = (p?: string | null) => (p || "").replace(/\D/g, "").slice(-10);
const fmt = (d?: string | null) => (d ? format(new Date(d), "MM-dd-yyyy h:mm a") : "—");
const join = (...p: (string | null | undefined)[]) => p.filter(Boolean).join(" ");

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground py-6 text-center">{text}</p>;
}

export default function CustomerHistory() {
  const [params, setParams] = useSearchParams();
  const id = params.get("id");
  const [q, setQ] = useState("");

  const { data: matches = [], isFetching: searching } = useQuery({
    queryKey: ["history-search", q],
    enabled: q.trim().length >= 2,
    queryFn: async () => {
      const s = q.trim().replace(/[,%()]/g, "");
      const { data } = await supabase
        .from("customer_registrations")
        .select("id, ship_to_first_name, ship_to_last_name, ship_to_business_name, account_number, phone, email, ship_to_city")
        .or(`ship_to_first_name.ilike.%${s}%,ship_to_last_name.ilike.%${s}%,ship_to_business_name.ilike.%${s}%,account_number.ilike.%${s}%,phone.ilike.%${s}%,email.ilike.%${s}%`)
        .limit(10);
      return data || [];
    },
  });

  const { data: c, isLoading } = useQuery({
    queryKey: ["history-customer", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from("customer_registrations").select("*").eq("id", id!).maybeSingle();
      return data;
    },
  });

  const phones = useMemo(
    () => Array.from(new Set([c?.phone, c?.point_of_contact_phone, c?.business_phone].map(digits).filter((p) => p.length === 10))),
    [c],
  );
  const emails = useMemo(
    () => Array.from(new Set([c?.email, c?.point_of_contact_email].filter(Boolean).map((e) => e!.toLowerCase()))),
    [c],
  );

  const { data: hist, isLoading: histLoading } = useQuery({
    queryKey: ["history-data", id, phones, emails],
    enabled: !!c,
    staleTime: 30000,
    queryFn: async () => {
      const phoneOr = phones.map((p) => `customer_phone.ilike.%${p.slice(-4)}%`);
      const emailOr = emails.map((e) => `customer_email.ilike.${e}`);
      const apptOr = [...phoneOr, ...emailOr].join(",");
      let appts: any[] = [];
      if (apptOr) {
        const { data } = await supabase.from("appointments").select("*").or(apptOr).order("scheduled_date", { ascending: false }).limit(200);
        appts = (data || []).filter(
          (a) => phones.includes(digits(a.customer_phone)) || emails.includes((a.customer_email || "").toLowerCase()),
        );
      }
      const apptIds = appts.map((a) => a.id);

      const [emailRes, callRes, convRes, smsRes] = await Promise.all([
        emails.length
          ? supabase.from("email_send_log").select("*").in("recipient_email", emails).order("created_at", { ascending: false }).limit(200)
          : Promise.resolve({ data: [] as any[] }),
        supabase.from("call_logs_3cx").select("*")
          .or([`customer_id.eq.${id}`, ...phones.flatMap((p) => [`from_number.ilike.%${p}`, `to_number.ilike.%${p}`])].join(","))
          .order("started_at", { ascending: false }).limit(200),
        phones.length
          ? supabase.from("chat_conversations").select("id, external_phone").or(phones.map((p) => `external_phone.ilike.%${p}`).join(","))
          : Promise.resolve({ data: [] as any[] }),
        apptIds.length
          ? supabase.from("appointment_sms_log").select("*").in("appointment_id", apptIds).eq("recipient_type", "customer").order("created_at", { ascending: false })
          : Promise.resolve({ data: [] as any[] }),
      ]);
      const convIds = (convRes.data || []).map((x: any) => x.id);
      const msgs = convIds.length
        ? (await supabase.from("chat_messages").select("id, body, direction, sender_name, created_at, attachments").in("conversation_id", convIds).order("created_at", { ascending: false }).limit(300)).data || []
        : [];
      const texts = [
        ...msgs.map((m: any) => ({ id: m.id, at: m.created_at, dir: m.direction === "inbound" ? "Received" : "Sent", who: m.sender_name, body: m.body, src: "Chat" })),
        ...(smsRes.data || []).map((s: any) => ({ id: s.id, at: s.created_at, dir: "Sent", who: "System", body: s.message, src: `Appointment ${s.kind || ""}`.trim(), status: s.status })),
      ].sort((a, b) => (a.at < b.at ? 1 : -1));
      return { appts, emails: emailRes.data || [], calls: callRes.data || [], texts };
    },
  });

  const today = format(new Date(), "yyyy-MM-dd");
  const next = (hist?.appts || [])
    .filter((a) => a.status === "open" && a.scheduled_date && a.scheduled_date >= today)
    .sort((a, b) => (a.scheduled_date < b.scheduled_date ? -1 : 1))[0];

  const billSame = c?.bill_to_same_as_ship_to;
  const shipName = join(c?.ship_to_first_name, c?.ship_to_last_name) || c?.ship_to_business_name;
  const billName = billSame ? shipName : join(c?.bill_to_first_name, c?.bill_to_last_name) || c?.bill_to_business_name;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Customer History</h1>
        <p className="text-muted-foreground">Look up a customer to see their account and communication history.</p>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by name, account #, phone or email" value={q} onChange={(e) => setQ(e.target.value)} />
        {q.trim().length >= 2 && (
          <Card className="absolute z-20 mt-1 w-full">
            <CardContent className="p-1">
              {searching && <Loader2 className="h-4 w-4 animate-spin m-3" />}
              {!searching && matches.length === 0 && <Empty text="No customers found" />}
              {matches.map((m: any) => (
                <button key={m.id} className="w-full text-left px-3 py-2 rounded hover:bg-accent text-sm"
                  onClick={() => { setParams({ id: m.id }); setQ(""); }}>
                  <span className="font-medium">{join(m.ship_to_first_name, m.ship_to_last_name) || m.ship_to_business_name}</span>
                  <span className="text-muted-foreground"> · {m.account_number || "—"} · {m.phone || m.email || ""} {m.ship_to_city ? `· ${m.ship_to_city}` : ""}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {!id && <Empty text="Search for a customer above, or open History from the Customers list." />}
      {id && isLoading && <Loader2 className="h-6 w-6 animate-spin" />}
      {id && !isLoading && !c && <Empty text="Customer not found." />}

      {c && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Billing Address & Contact</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                <div className="font-medium">{billName || "—"}</div>
                <div>{billSame ? join(c.ship_to_address, c.ship_to_suite_number) : join(c.bill_to_address, c.bill_to_suite_number) || "—"}</div>
                <div>{billSame ? join(c.ship_to_city, c.ship_to_state, c.ship_to_zip_code) : join(c.bill_to_city, c.bill_to_state, c.bill_to_zip_code)}</div>
                <div>{c.phone || "—"}</div>
                <div>{c.email || "—"}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Service Address & Contact</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                <div className="font-medium">{shipName || "—"}</div>
                <div>{join(c.ship_to_address, c.ship_to_suite_number) || "—"}</div>
                <div>{join(c.ship_to_city, c.ship_to_state, c.ship_to_zip_code)}</div>
                <div>{c.point_of_contact_phone || c.phone || "—"}</div>
                <div>{c.point_of_contact_email || c.email || "—"}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card><CardContent className="pt-6">
              <div className="text-xs text-muted-foreground">Account Status</div>
              <Badge className="mt-1 uppercase">{c.status || "active"}</Badge>
              <div className="text-xs text-muted-foreground mt-2">Account # {c.account_number || "—"}</div>
            </CardContent></Card>
            <Card><CardContent className="pt-6">
              <div className="text-xs text-muted-foreground">Balance Due</div>
              <div className="text-xl font-semibold mt-1">$0.00</div>
              <div className="text-xs text-muted-foreground">No billing records yet</div>
            </CardContent></Card>
            <Card><CardContent className="pt-6">
              <div className="text-xs text-muted-foreground">Next Scheduled Appointment</div>
              {next ? (
                <div className="mt-1 text-sm">
                  <div className="font-semibold">{format(new Date(next.scheduled_date + "T00:00"), "MM-dd-yyyy")} {next.scheduled_time || ""}</div>
                  <div>{next.visit_type || next.appointment_type}</div>
                </div>
              ) : <div className="mt-1 text-sm">None scheduled</div>}
            </CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Communication History</CardTitle></CardHeader>
            <CardContent>
              {histLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <Tabs defaultValue="appointments">
                  <TabsList className="flex-wrap h-auto">
                    <TabsTrigger value="appointments">Appointments ({hist?.appts.length || 0})</TabsTrigger>
                    <TabsTrigger value="emails">Sent Emails ({hist?.emails.length || 0})</TabsTrigger>
                    <TabsTrigger value="calls">Call Logs ({hist?.calls.length || 0})</TabsTrigger>
                    <TabsTrigger value="texts">Text Messages ({hist?.texts.length || 0})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="appointments" className="space-y-2">
                    {!hist?.appts.length && <Empty text="No appointments" />}
                    {hist?.appts.map((a) => (
                      <div key={a.id} className="border rounded p-3 text-sm">
                        <div className="flex justify-between gap-2">
                          <span className="font-medium">{a.appointment_number || "Appointment"} · {a.visit_type || a.appointment_type}</span>
                          <Badge variant={a.status === "open" ? "default" : "secondary"}>{a.status}</Badge>
                        </div>
                        <div className="text-muted-foreground">{a.scheduled_date || "No date"} {a.scheduled_time || ""}</div>
                        {a.visit_summary_notes && <div className="mt-1">Summary: {a.visit_summary_notes}</div>}
                        {a.cancellation_reason && <div className="mt-1">Cancelled: {a.cancellation_reason}</div>}
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="emails" className="space-y-2">
                    {!hist?.emails.length && <Empty text="No emails sent" />}
                    {hist?.emails.map((e: any) => (
                      <div key={e.id} className="border rounded p-3 text-sm flex justify-between gap-2">
                        <div>
                          <div className="font-medium">{(e.template_name || "email").replace(/[-_]/g, " ")}</div>
                          <div className="text-muted-foreground">{e.recipient_email} · {fmt(e.created_at)}</div>
                        </div>
                        <Badge variant={e.status === "failed" ? "destructive" : "secondary"}>{e.status}</Badge>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="calls" className="space-y-2">
                    {!hist?.calls.length && <Empty text="No calls" />}
                    {hist?.calls.map((l: any) => (
                      <div key={l.id} className="border rounded p-3 text-sm">
                        <div className="flex justify-between gap-2">
                          <span className="font-medium capitalize">{l.direction || "call"} · {l.from_number} → {l.to_number}</span>
                          <Badge variant="secondary">{l.status}</Badge>
                        </div>
                        <div className="text-muted-foreground">
                          {fmt(l.started_at || l.created_at)}{l.agent_name ? ` · ${l.agent_name}` : ""}{l.talk_seconds ? ` · ${Math.round(l.talk_seconds / 60)} min` : ""}
                        </div>
                        {l.notes && <div className="mt-1">{l.notes}</div>}
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="texts" className="space-y-2">
                    {!hist?.texts.length && <Empty text="No text messages" />}
                    {hist?.texts.map((t: any) => (
                      <div key={t.id} className="border rounded p-3 text-sm">
                        <div className="flex justify-between gap-2 text-muted-foreground">
                          <span>{t.dir} · {t.src}{t.who ? ` · ${t.who}` : ""}</span>
                          <span>{fmt(t.at)}</span>
                        </div>
                        <div className="mt-1 whitespace-pre-wrap">{t.body || "(attachment)"}</div>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
