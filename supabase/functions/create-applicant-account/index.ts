import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin/moderator
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: callerRoles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .in("role", ["admin", "moderator"]);
    if (!callerRoles || callerRoles.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { application_id, portal_base_url } = body || {};
    if (!application_id) {
      return new Response(JSON.stringify({ error: "application_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load application
    const { data: app, error: appErr } = await admin
      .from("hire_applications")
      .select("*")
      .eq("id", application_id)
      .maybeSingle();
    if (appErr || !app) {
      return new Response(JSON.stringify({ error: "Application not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = (app.email as string).toLowerCase().trim();
    const fullName = `${app.first_name ?? ""} ${app.last_name ?? ""}`.trim();

    // Find or create auth user
    let userId: string | null = null;

    const { data: existing } = await admin.auth.admin.listUsers({
      page: 1, perPage: 200,
    });
    const found = existing?.users?.find((u: any) => (u.email || "").toLowerCase() === email);
    if (found) {
      userId = found.id;
    } else {
      const tempPassword = crypto.randomUUID() + "Aa1!";
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { display_name: fullName || email, role: "applicant" },
      });
      if (createErr || !created.user) {
        return new Response(JSON.stringify({ error: createErr?.message || "User create failed" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = created.user.id;
    }

    // Generate password setup link (recovery flow)
    const redirectTo = (portal_base_url || `${new URL(req.url).origin}`)
      .replace(/\/$/, "") + "/applicant/set-password";

    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });
    if (linkErr) {
      return new Response(JSON.stringify({ error: linkErr.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const actionLink = (linkData as any)?.properties?.action_link
      || (linkData as any)?.action_link;

    // Upsert applicant_accounts row
    const { data: acct, error: acctErr } = await admin
      .from("applicant_accounts")
      .upsert({
        user_id: userId,
        application_id: app.id,
        company_id: app.company_id,
        email,
        first_name: app.first_name,
        last_name: app.last_name,
        phone: app.phone,
        status: "invited",
        invited_at: new Date().toISOString(),
      }, { onConflict: "user_id" })
      .select()
      .single();
    if (acctErr) {
      return new Response(JSON.stringify({ error: acctErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get company name for email
    let companyName: string | undefined;
    if (app.company_id) {
      const { data: c } = await admin
        .from("companies").select("name").eq("id", app.company_id).maybeSingle();
      companyName = c?.name || undefined;
    }

    // Send invite email via transactional pipeline
    try {
      await admin.functions.invoke("send-transactional-email", {
        body: {
          templateName: "applicant-portal-invite",
          recipientEmail: email,
          idempotencyKey: `applicant-portal-invite-${acct.id}-${Date.now()}`,
          templateData: {
            applicantName: fullName,
            companyName,
            portalUrl: actionLink,
          },
        },
      });
    } catch (e) {
      console.warn("Email invoke failed", e);
    }

    // Log
    await admin.from("admin_logs").insert({
      user_id: caller.id,
      user_email: caller.email || "unknown",
      action: "create",
      entity_type: "applicant_account",
      entity_id: acct.id,
      details: { application_id, email },
    });

    return new Response(JSON.stringify({
      success: true,
      applicant_account_id: acct.id,
      user_id: userId,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
