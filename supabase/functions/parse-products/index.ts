import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get("Authorization") || "";
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: u } = await sb.auth.getUser();
    if (!u?.user) return json({ error: "Unauthorized" }, 401);
    const { data: staff } = await sb.rpc("is_staff", { _uid: u.user.id });
    if (!staff) return json({ error: "Forbidden" }, 403);

    const { rows, sheet, categories } = await req.json();
    if (!Array.isArray(rows) || rows.length === 0) return json({ products: [] });
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("LOVABLE_API_KEY missing");

    const catText = (categories || []).map((c: any) => `- ${c.name}: ${c.fields.map((f: any) => f.options ? `${f.key} (one of: ${f.options.slice(0, 25).join(" | ")})` : f.key).join(", ")}`).join("\n");
    const sys = `You convert supplier price-list rows (any layout) into HVAC products.
Rows are in original order; rows without an item/model are section headers (e.g. "13 SEER A2L", "40 GALLON POWER VENTED", "RHEEM TANKLESS") that give context to the rows below them. Sheet/tab name often is the brand.
Return one product per real item row only (skip headers, separators, totals, addresses).
Decode abbreviations: T=tons, SEER2, R-454/R454B=refrigerant, AC=air conditioner (Condenser), HP=heat pump, ODU=outdoor unit, MBH=thousand BTU, NAT/NG=natural gas, LP=propane, PV=power vented, WHTR=water heater, TKLS=tankless, COND=condensing, CCY=supplier prefix (ignore).
spec_type must be exactly one of: ${(categories || []).map((c: any) => c.name).join(", ")} or "" when none fits (e.g. mini-splits, tankless, parts).
Only fill specs keys from that category's list; for option fields use an exact option text. Put the price number in price. Never invent values that aren't implied by the row.
Categories and spec keys:
${catText}`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: sys }, { role: "user", content: `Sheet: ${sheet || "(none)"}\nRows (JSON arrays):\n${rows.map((x: unknown) => JSON.stringify(x)).join("\n")}` }],
        tools: [{ type: "function", function: { name: "products", description: "Parsed products", parameters: {
          type: "object", properties: { products: { type: "array", items: { type: "object", properties: {
            model_number: { type: "string" }, product_name: { type: "string", description: "Readable name, e.g. 'Rheem 1.5 Ton 13 SEER2 Air Conditioner R-454B'" },
            brand_name: { type: "string" }, spec_type: { type: "string" }, description: { type: "string" },
            price: { type: "number" }, tons_btu: { type: "string" }, seer_rating: { type: "string" }, refrigerant_type: { type: "string" },
            voltage: { type: "string" }, afue: { type: "string" }, stages: { type: "string" },
            specs: { type: "object", additionalProperties: true },
          }, required: ["model_number", "product_name", "spec_type"] } } }, required: ["products"],
        } } }],
        tool_choice: { type: "function", function: { name: "products" } },
      }),
    });
    if (r.status === 429) return json({ error: "AI is busy, try again shortly." }, 429);
    if (r.status === 402) return json({ error: "AI credits are used up. Add credits in workspace settings." }, 402);
    if (!r.ok) throw new Error(`AI error ${r.status}: ${await r.text()}`);
    const d = await r.json();
    const args = d.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = args ? JSON.parse(args) : { products: [] };
    return json({ products: parsed.products || [] });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
