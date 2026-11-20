import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const TYPES: Record<string, string> = {
  'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp',
}
const MAX = 5 * 1024 * 1024

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  try {
    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) return json({ error: 'File required' }, 400)
    const ext = TYPES[file.type]
    if (!ext) return json({ error: 'Only PNG, JPG, GIF or WEBP images are allowed' }, 400)
    if (file.size > MAX) return json({ error: 'Logo must be under 5MB' }, 400)
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const name = `${crypto.randomUUID()}.${ext}`
    const { error } = await admin.storage.from('vendor-logos').upload(name, file, { contentType: file.type })
    if (error) return json({ error: error.message }, 500)
    const { data } = admin.storage.from('vendor-logos').getPublicUrl(name)
    return json({ url: data.publicUrl })
  } catch (e) {
    return json({ error: (e as Error).message }, 500)
  }
})
