import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userErr } = await anonClient.auth.getUser(token);
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "Missing url field" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create a job record
    const { data: job, error: jobErr } = await supabase
      .from("fileserver_jobs")
      .insert({ url, status: "processing", progress: 0, uploaded_by: user.id })
      .select()
      .single();

    if (jobErr) {
      return new Response(JSON.stringify({ error: jobErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Process in background using EdgeRuntime.waitUntil
    // @ts-ignore - EdgeRuntime is a Deno Deploy global
    EdgeRuntime.waitUntil(
      processUpload(supabase, job.id, url, user.id).catch(async (err) => {
        console.error(`Job ${job.id} failed:`, err);
        await supabase
          .from("fileserver_jobs")
          .update({ status: "failed", error: err.message })
          .eq("id", job.id);
      })
    );

    // Return immediately with job ID
    return new Response(JSON.stringify({ job_id: job.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function processUpload(supabase: any, jobId: string, url: string, userId: string) {
  // Update progress: fetching
  await supabase
    .from("fileserver_jobs")
    .update({ progress: 10 })
    .eq("id", jobId);

  const fileRes = await fetch(url);
  if (!fileRes.ok) {
    throw new Error(`Failed to fetch URL: ${fileRes.status} ${fileRes.statusText}`);
  }

  // Update progress: downloaded
  await supabase
    .from("fileserver_jobs")
    .update({ progress: 50 })
    .eq("id", jobId);

  const blob = await fileRes.blob();
  const urlObj = new URL(url);
  const fileName = urlObj.pathname.split("/").pop() || "downloaded-file";
  const storagePath = `${crypto.randomUUID()}-${fileName}`;
  const mimeType = blob.type || fileRes.headers.get("content-type") || "application/octet-stream";

  // Update progress: uploading to storage
  await supabase
    .from("fileserver_jobs")
    .update({ progress: 70 })
    .eq("id", jobId);

  const { error: uploadErr } = await supabase.storage
    .from("fileserver")
    .upload(storagePath, blob, { contentType: mimeType });
  if (uploadErr) {
    throw new Error(uploadErr.message);
  }

  // Update progress: saving record
  await supabase
    .from("fileserver_jobs")
    .update({ progress: 90 })
    .eq("id", jobId);

  const { data: record, error: dbErr } = await supabase
    .from("fileserver_items")
    .insert({
      name: fileName,
      storage_path: storagePath,
      file_url: `fileserver/${storagePath}`,
      file_size: blob.size,
      mime_type: mimeType,
      uploaded_by: userId,
    })
    .select()
    .single();

  if (dbErr) {
    throw new Error(dbErr.message);
  }

  // Mark complete
  await supabase
    .from("fileserver_jobs")
    .update({
      status: "completed",
      progress: 100,
      result: record,
    })
    .eq("id", jobId);
}
