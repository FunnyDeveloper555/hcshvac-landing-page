import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const GATEWAY = "https://connector-gateway.lovable.dev/stripe";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const stripeKey = Deno.env.get("STRIPE_SANDBOX_API_KEY") || Deno.env.get("STRIPE_API_KEY");
    if (!lovableKey || !stripeKey) {
      return new Response(JSON.stringify({ error: "Payments not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { appointment_id, cart_id, customer_email, customer_name, line_items } = await req.json();
    if (!cart_id || !Array.isArray(line_items) || line_items.length === 0) {
      return new Response(JSON.stringify({ error: "Missing cart_id or line_items" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build form-encoded Stripe Checkout Session body
    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("success_url", `${req.headers.get("origin") || ""}/admin/appointments/list?paid=1`);
    params.append("cancel_url", `${req.headers.get("origin") || ""}/admin/appointments/list?canceled=1`);
    if (customer_email) params.append("customer_email", customer_email);
    params.append("metadata[appointment_id]", appointment_id || "");
    params.append("metadata[cart_id]", cart_id);

    line_items.forEach((li: any, idx: number) => {
      const cents = Math.round(Number(li.unit_price) * 100);
      const qty = Math.max(1, Math.round(Number(li.qty) || 1));
      params.append(`line_items[${idx}][price_data][currency]`, "usd");
      params.append(`line_items[${idx}][price_data][product_data][name]`, String(li.description).slice(0, 250));
      params.append(`line_items[${idx}][price_data][unit_amount]`, String(cents));
      params.append(`line_items[${idx}][quantity]`, String(qty));
    });

    const res = await fetch(`${GATEWAY}/v1/checkout/sessions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": stripeKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const session = await res.json();
    if (!res.ok) {
      console.error("Stripe error:", session);
      return new Response(JSON.stringify({ error: session.error?.message || "Stripe error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Persist session id
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    await supabase.from("appointment_carts")
      .update({ stripe_session_id: session.id, payment_status: "pending" })
      .eq("id", cart_id);

    return new Response(JSON.stringify({ url: session.url, id: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
