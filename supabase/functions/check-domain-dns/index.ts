import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface DomainRecord {
  id: string;
  company_id: string;
  domain_name: string;
  record_type: string;
  target_ip: string;
  txt_verify_value: string | null;
  status: string;
  ssl_status: string;
  is_primary: boolean;
}

// Check A record via DNS-over-HTTPS (Cloudflare)
async function checkARecord(domain: string, expectedIp: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=A`,
      { headers: { Accept: "application/dns-json" } }
    );
    if (!res.ok) return false;
    const data = await res.json();
    const answers = data.Answer || [];
    return answers.some((a: { type: number; data: string }) => a.type === 1 && a.data === expectedIp);
  } catch (e) {
    console.error(`DNS A check failed for ${domain}:`, e);
    return false;
  }
}

// Check TXT record via DNS-over-HTTPS
async function checkTXTRecord(domain: string, expectedValue: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=_lovable.${encodeURIComponent(domain)}&type=TXT`,
      { headers: { Accept: "application/dns-json" } }
    );
    if (!res.ok) return false;
    const data = await res.json();
    const answers = data.Answer || [];
    return answers.some(
      (a: { type: number; data: string }) =>
        a.type === 16 && a.data.replace(/"/g, "").includes(expectedValue)
    );
  } catch (e) {
    console.error(`DNS TXT check failed for ${domain}:`, e);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Optional: check a single domain by id (manual trigger)
    let singleDomainId: string | null = null;
    try {
      const body = await req.json();
      singleDomainId = body?.domain_id || null;
    } catch {
      // No body = batch mode (cron)
    }

    // Fetch domains that need checking
    let query = supabase
      .from("company_domains")
      .select("*")
      .in("status", ["pending", "verifying", "dns_verified"]);

    if (singleDomainId) {
      query = supabase
        .from("company_domains")
        .select("*")
        .eq("id", singleDomainId);
    }

    const { data: domains, error: fetchError } = await query;
    if (fetchError) throw fetchError;
    if (!domains || domains.length === 0) {
      return new Response(
        JSON.stringify({ message: "No domains to check", checked: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { id: string; domain: string; oldStatus: string; newStatus: string; sslStatus: string }[] = [];

    for (const domain of domains as DomainRecord[]) {
      const oldStatus = domain.status;
      let newStatus = domain.status;
      let newSslStatus = domain.ssl_status;
      let verifiedAt = null;

      // Step 1: Check DNS propagation
      if (domain.status === "pending" || domain.status === "verifying") {
        // Update to verifying if still pending
        if (domain.status === "pending") {
          newStatus = "verifying";
        }

        const aRecordValid = await checkARecord(domain.domain_name, domain.target_ip);

        // Check TXT if we have a verify value (only for root domains, not www)
        let txtValid = true;
        if (domain.txt_verify_value && !domain.domain_name.startsWith("www.")) {
          txtValid = await checkTXTRecord(domain.domain_name, domain.txt_verify_value);
        }

        if (aRecordValid && txtValid) {
          newStatus = "dns_verified";
          verifiedAt = new Date().toISOString();
          console.log(`✅ DNS verified for ${domain.domain_name}`);
        } else {
          newStatus = "verifying";
          console.log(
            `⏳ DNS not ready for ${domain.domain_name} - A: ${aRecordValid}, TXT: ${txtValid}`
          );
        }
      }

      // Step 2: SSL provisioning (simulated - in production this would call an SSL provider API)
      if (newStatus === "dns_verified" && newSslStatus !== "active") {
        // In a real system, this would trigger Let's Encrypt or similar
        // For now we simulate SSL provisioning
        newSslStatus = "provisioning";
        console.log(`🔒 SSL provisioning started for ${domain.domain_name}`);

        // Simulate immediate provisioning success for demo
        // In production, this would be checked on subsequent runs
        newSslStatus = "active";
        newStatus = "active";
        console.log(`🔒 SSL active for ${domain.domain_name}`);
      }

      // Step 3: Update domain record
      const updateData: Record<string, unknown> = {
        status: newStatus,
        ssl_status: newSslStatus,
      };
      if (verifiedAt) {
        updateData.verified_at = verifiedAt;
      }

      const { error: updateError } = await supabase
        .from("company_domains")
        .update(updateData)
        .eq("id", domain.id);

      if (updateError) {
        console.error(`Failed to update domain ${domain.domain_name}:`, updateError);
      }

      results.push({
        id: domain.id,
        domain: domain.domain_name,
        oldStatus,
        newStatus,
        sslStatus: newSslStatus,
      });
    }

    return new Response(
      JSON.stringify({
        message: `Checked ${results.length} domain(s)`,
        checked: results.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Domain check error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
