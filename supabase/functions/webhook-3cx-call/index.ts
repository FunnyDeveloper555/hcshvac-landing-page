// 3CX CDR ingestion endpoint.
// Accepts the raw cdr.log content (text/plain or text/csv) and parses each
// "Call ..." line into a row in call_logs_3cx. Dedupes on historyid.
//
// 3CX "Single file for all calls" CDR template field order:
//  0  historyid                (segment id - unique per call leg)
//  1  callid                   (master call id - shared by all legs)
//  2  duration                 HH:MM:SS
//  3  time-start               yyyy/MM/dd HH:mm:ss
//  4  time-answered            yyyy/MM/dd HH:mm:ss (blank if unanswered)
//  5  time-end                 yyyy/MM/dd HH:mm:ss
//  6  reason-terminated        e.g. src_participant_terminated
//  7  from-no                  e.g. Ext.1000 or external number
//  8  to-no
//  9  from-dn
// 10  to-dn
// 11  dial-no
// 12  reason-changed
// 13  final-number
// 14  final-dn
// 15  bill-code
// 16  bill-rate
// 17  bill-cost
// 18  bill-name
// 19  chain

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SECRET = Deno.env.get("CALL_3CX_WEBHOOK_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function normalizePhone(p?: string | null): string | null {
  if (!p) return null;
  const digits = p.replace(/\D/g, "");
  if (!digits) return null;
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function isExtension(v?: string | null): boolean {
  if (!v) return false;
  return /^Ext\./i.test(v) || /^\d{1,5}$/.test(v.trim());
}

function parseDuration(hms?: string | null): number | null {
  if (!hms) return null;
  const m = /^(\d+):(\d{1,2}):(\d{1,2})$/.exec(hms.trim());
  if (!m) return null;
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

function parseTimestamp(s?: string | null): string | null {
  if (!s || !s.trim()) return null;
  // 3CX writes UTC: "2026/06/02 09:22:13"
  const m = /^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/.exec(s.trim());
  if (!m) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  const [, y, mo, d, h, mi, se] = m;
  return new Date(`${y}-${mo}-${d}T${h}:${mi}:${se}Z`).toISOString();
}

// Split a CSV line that uses comma separator. 3CX does not quote fields,
// but the trailing "Chain:" field can contain semicolons (not commas), so a
// simple split is safe. We still handle optional double quotes defensively.
function splitCsv(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQ = !inQ; continue; }
    if (c === "," && !inQ) { out.push(cur); cur = ""; continue; }
    cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

interface ParsedCall {
  historyid: string;
  callid: string;
  duration: number | null;
  startedAt: string | null;
  answeredAt: string | null;
  endedAt: string | null;
  reasonTerminated: string;
  fromNo: string;
  toNo: string;
  fromDn: string;
  toDn: string;
  dialNo: string;
  chain: string;
  raw: string;
}

function parseLine(rawLine: string): ParsedCall | null {
  let line = rawLine.trim();
  if (!line) return null;
  // Strip optional "Call " prefix
  if (/^Call\s+/i.test(line)) line = line.replace(/^Call\s+/i, "");
  const f = splitCsv(line);
  if (f.length < 7) return null;
  if (!f[0]) return null;
  return {
    historyid: f[0],
    callid: f[1] || "",
    duration: parseDuration(f[2]),
    startedAt: parseTimestamp(f[3]),
    answeredAt: parseTimestamp(f[4]),
    endedAt: parseTimestamp(f[5]),
    reasonTerminated: f[6] || "",
    fromNo: f[7] || "",
    toNo: f[8] || "",
    fromDn: f[9] || "",
    toDn: f[10] || "",
    dialNo: f[11] || "",
    chain: f[19] || "",
    raw: rawLine,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: { ...corsHeaders, "Access-Control-Allow-Headers": "content-type, x-webhook-secret, authorization" },
    });
  }

  try {
    const url = new URL(req.url);
    const provided = req.headers.get("x-webhook-secret") || url.searchParams.get("secret");
    if (!SECRET || provided !== SECRET) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.text();
    if (!body.trim()) {
      return new Response(JSON.stringify({ ok: true, parsed: 0, imported: 0, message: "empty body" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lines = body.split(/\r?\n/);
    const parsed: ParsedCall[] = [];
    for (const l of lines) {
      const p = parseLine(l);
      if (p) parsed.push(p);
    }
    if (parsed.length === 0) {
      return new Response(JSON.stringify({ ok: true, parsed: 0, imported: 0, message: "no Call lines found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Dedupe against existing external_call_ids
    const ids = parsed.map((p) => p.historyid);
    const { data: existRows } = await supabase
      .from("call_logs_3cx").select("external_call_id").in("external_call_id", ids);
    const existing = new Set((existRows || []).map((r: any) => r.external_call_id));

    // Customer phone map (best-effort)
    const { data: customers } = await supabase
      .from("customer_registrations").select("id, phone_number").limit(5000);
    const phoneMap = new Map<string, string>();
    (customers || []).forEach((c: any) => {
      const n = normalizePhone(c.phone_number);
      if (n) phoneMap.set(n, c.id);
    });

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const p of parsed) {
      if (existing.has(p.historyid)) { skipped++; continue; }

      const srcExt = isExtension(p.fromNo);
      const dstExt = isExtension(p.toNo);
      const direction = srcExt && !dstExt ? "outbound"
        : !srcExt && dstExt ? "inbound"
        : srcExt && dstExt ? "internal" : "unknown";

      const matchPhone = direction === "outbound"
        ? normalizePhone(p.toNo)
        : direction === "inbound" ? normalizePhone(p.fromNo) : null;
      const customerId = matchPhone ? phoneMap.get(matchPhone) ?? null : null;

      const status = p.answeredAt
        ? "answered"
        : /(unanswered|missed|noanswer|no_answer)/i.test(p.reasonTerminated) ? "unanswered"
        : p.duration && p.duration > 0 ? "answered" : "unanswered";

      const agentExt = direction === "outbound"
        ? (p.fromDn || p.fromNo.replace(/^Ext\./i, ""))
        : direction === "inbound" ? (p.toDn || p.toNo.replace(/^Ext\./i, "")) : null;

      const row = {
        external_call_id: p.historyid,
        direction,
        from_number: p.fromNo || null,
        to_number: p.toNo || null,
        caller_name: null,
        agent_extension: agentExt || null,
        agent_name: null,
        queue_name: null,
        status,
        started_at: p.startedAt,
        ended_at: p.endedAt,
        duration_seconds: p.duration,
        ring_seconds: p.startedAt && p.answeredAt
          ? Math.max(0, Math.round((new Date(p.answeredAt).getTime() - new Date(p.startedAt).getTime()) / 1000))
          : null,
        talk_seconds: p.answeredAt && p.endedAt
          ? Math.max(0, Math.round((new Date(p.endedAt).getTime() - new Date(p.answeredAt).getTime()) / 1000))
          : null,
        recording_url: null,
        cost: null,
        raw_payload: {
          historyid: p.historyid, callid: p.callid, reason_terminated: p.reasonTerminated,
          from_no: p.fromNo, to_no: p.toNo, from_dn: p.fromDn, to_dn: p.toDn,
          dial_no: p.dialNo, chain: p.chain, raw: p.raw,
        },
        customer_id: customerId,
        matched_phone: matchPhone,
      };

      try {
        const { data, error } = await supabase
          .from("call_logs_3cx").upsert(row, { onConflict: "external_call_id" })
          .select("id").single();
        if (error) throw error;

        await supabase.from("admin_logs").insert({
          user_id: "00000000-0000-0000-0000-000000000000",
          user_email: "3cx-cdr",
          action: direction === "outbound" ? "call_out" : direction === "inbound" ? "call_in" : "call_internal",
          entity_type: "call",
          entity_id: data?.id ?? null,
          details: {
            from: p.fromNo, to: p.toNo, status, duration: p.duration,
            agent: agentExt, customer_id: customerId, reason: p.reasonTerminated,
          },
        });
        imported++;
      } catch (e) {
        errors.push(`${p.historyid}: ${(e as Error).message ?? e}`);
      }
    }

    return new Response(JSON.stringify({
      ok: true, parsed: parsed.length, imported, skipped, errors,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("webhook-3cx-call error:", err);
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
