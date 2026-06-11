import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const event = await req.json();
    const type: string = event?.type || event?.event || "";
    const data = event?.data?.object || event?.data || event;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Stripe-style: checkout.session.completed / transaction.completed
    if (type.includes("completed") || type === "checkout.session.completed") {
      const sessionId = data?.id || data?.session_id;
      const cartId = data?.metadata?.cart_id;
      const pi = data?.payment_intent;

      const match = cartId
        ? { id: cartId }
        : sessionId ? { stripe_session_id: sessionId } : null;

      if (match) {
        const q = supabase.from("appointment_carts")
          .update({
            payment_status: "paid",
            paid_at: new Date().toISOString(),
            stripe_payment_intent_id: typeof pi === "string" ? pi : pi?.id || null,
          });
        const ref = cartId ? q.eq("id", cartId) : q.eq("stripe_session_id", sessionId);
        await ref;
      }
    } else if (type.includes("failed")) {
      const sessionId = data?.id;
      const cartId = data?.metadata?.cart_id;
      if (cartId || sessionId) {
        const q = supabase.from("appointment_carts").update({ payment_status: "failed" });
        await (cartId ? q.eq("id", cartId) : q.eq("stripe_session_id", sessionId));
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("webhook error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
