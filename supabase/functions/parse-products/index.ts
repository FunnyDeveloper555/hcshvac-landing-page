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

    const catText = (categories || []).map((c: any) => `- ${c.name}: ${c.fields.map((f: any) => f.options ? `${f.key}${f.kind === "multi" ? " [multi]" : ""} (one of: ${f.options.join(" | ")})` : f.key).join(", ")}`).join("\n");
    const sys = `You convert supplier price-list rows (any layout) into HVAC products.
Rows are in original order; rows without an item/model are section headers (e.g. "13 SEER A2L", "40 GALLON POWER VENTED", "RHEEM TANKLESS") that give context to the rows below them. Sheet/tab name often is the brand.
Return one product per real item row only (skip headers, separators, totals, addresses).
Decode abbreviations: T=tons, SEER2, R-454/R454B=refrigerant, AC=air conditioner (Condenser), HP=heat pump, ODU=outdoor unit, MBH=thousand BTU, NAT/NG=natural gas, LP=propane, PV=power vented, WHTR=water heater, TKLS=tankless, COND=condensing, CCY=supplier prefix (ignore).
spec_type must be exactly one of: ${(categories || []).map((c: any) => c.name).join(", ")} or "" when none fits (e.g. mini-splits, tankless, parts).
Product filter fields: for the chosen category, go through EVERY field key listed below and fill it whenever the row, its section header, the sheet name, the model code, or well-known HVAC facts about that product line imply a value. Examples: R-454B/R-32 => refrigerant + a2l_compliant "Yes"; NAT/NG => energy_supply_type "Gas"; "1.5T" => tonnage "1.5" and btu_s "18,000 (1.5 Ton)"; "13 SEER2" => seer_rating "13 Seer"; 40G => gallons size; MBH => BTU input; PV => power vented venting; residential split AC/HP => location_type ["Residential"], application_type "Outside Ground", voltage "208/230"; vendor_sku_item_number = the item code; our_cost = the price.
For fields with options you MUST use the exact option text (fields marked multi take an array of option texts). Leave a field out only when nothing implies it. Put the price number in price.
Categories and spec keys:
${catText}`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        instructions: sys,
        input: [{ role: "user", content: `Sheet: ${sheet || "(none)"}\nRows (JSON arrays):\n${rows.map((x: unknown) => JSON.stringify(x)).join("\n")}` }],
        tools: [{ type: "function", name: "products", description: "Parsed products", strict: false, parameters: {
          type: "object", properties: { products: { type: "array", items: { type: "object", properties: {
            model_number: { type: "string" }, product_name: { type: "string", description: "Readable name, e.g. 'Rheem 1.5 Ton 13 SEER2 Air Conditioner R-454B'" },
            brand_name: { type: "string" }, spec_type: { type: "string" }, description: { type: "string" },
            price: { type: "number" }, tons_btu: { type: "string" }, seer_rating: { type: "string" }, refrigerant_type: { type: "string" },
            voltage: { type: "string" }, afue: { type: "string" }, stages: { type: "string" },
            specs: { type: "object", additionalProperties: true },
          }, required: ["model_number", "product_name", "spec_type"] } } }, required: ["products"],
        } }],
        tool_choice: { type: "function", name: "products" },
      }),
    });
    if (r.status === 429) return json({ error: "AI is busy, try again shortly." }, 429);
    if (r.status === 402) return json({ error: "AI credits are used up. Add credits in workspace settings." }, 402);
    if (!r.ok) throw new Error(`AI error ${r.status}: ${await r.text()}`);
    const d = await r.json();
    const args = (d.output || []).find((o: any) => o.type === "function_call")?.arguments;
    const parsed = args ? JSON.parse(args) : { products: [] };
    return json({ products: parsed.products || [] });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
