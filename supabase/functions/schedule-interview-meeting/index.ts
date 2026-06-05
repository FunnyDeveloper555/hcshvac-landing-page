import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/google_calendar/calendar/v3'

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Chicago' })
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago', timeZoneName: 'short' })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!
    const GOOGLE_CALENDAR_API_KEY = Deno.env.get('GOOGLE_CALENDAR_API_KEY')!

    const authHeader = req.headers.get('Authorization') || ''
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const admin = createClient(SUPABASE_URL, SERVICE_KEY)
    const { data: isAdmin } = await admin.rpc('has_role', { _user_id: user.id, _role: 'admin' })
    const { data: isMod } = await admin.rpc('has_role', { _user_id: user.id, _role: 'moderator' })
    if (!isAdmin && !isMod) {
      return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const body = await req.json()
    const {
      applicant_account_id,
      scheduled_at,
      duration_minutes = 45,
      location,
      meeting_url: providedMeetingUrl,
      interviewer_name,
      interviewer_email,
      position_title,
      applicant_notes,
      internal_notes,
      generate_meet = true,
      calendar_id = 'primary',
    } = body || {}

    if (!applicant_account_id || !scheduled_at) {
      return new Response(JSON.stringify({ error: 'applicant_account_id and scheduled_at required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Load applicant
    const { data: applicant, error: appErr } = await admin
      .from('applicant_accounts')
      .select('id, user_id, first_name, last_name, email')
      .eq('id', applicant_account_id)
      .maybeSingle()
    if (appErr || !applicant) {
      return new Response(JSON.stringify({ error: 'applicant not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const start = new Date(scheduled_at)
    const end = new Date(start.getTime() + duration_minutes * 60_000)

    let meetingUrl = providedMeetingUrl || null
    let googleEventId: string | null = null
    let googleCalendarId: string | null = null

    if (generate_meet) {
      const attendees: { email: string }[] = []
      if (applicant.email) attendees.push({ email: applicant.email })
      if (interviewer_email) attendees.push({ email: interviewer_email })

      const summary = `Interview${position_title ? ` — ${position_title}` : ''} with ${applicant.first_name || ''} ${applicant.last_name || ''}`.trim()
      const requestId = `intv-${applicant.id}-${Date.now()}`

      const evRes = await fetch(
        `${GATEWAY_URL}/calendars/${encodeURIComponent(calendar_id)}/events?conferenceDataVersion=1&sendUpdates=all`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            'X-Connection-Api-Key': GOOGLE_CALENDAR_API_KEY,
          },
          body: JSON.stringify({
            summary,
            description: applicant_notes || '',
            location: location || undefined,
            start: { dateTime: start.toISOString() },
            end: { dateTime: end.toISOString() },
            attendees,
            conferenceData: {
              createRequest: {
                requestId,
                conferenceSolutionKey: { type: 'hangoutsMeet' },
              },
            },
          }),
        },
      )

      const evText = await evRes.text()
      if (!evRes.ok) {
        console.error('Google Calendar event create failed', evRes.status, evText)
        return new Response(JSON.stringify({ error: 'calendar_create_failed', status: evRes.status, body: evText }), {
          status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const ev = JSON.parse(evText)
      googleEventId = ev.id || null
      googleCalendarId = calendar_id
      meetingUrl =
        ev.hangoutLink ||
        ev.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === 'video')?.uri ||
        meetingUrl
    }

    // Insert interview row
    const { data: inserted, error: insErr } = await admin
      .from('applicant_interviews')
      .insert({
        applicant_account_id: applicant.id,
        user_id: applicant.user_id,
        scheduled_at: start.toISOString(),
        duration_minutes,
        location: location || null,
        meeting_url: meetingUrl,
        interviewer_name: interviewer_name || null,
        interviewer_email: interviewer_email || null,
        position_title: position_title || null,
        applicant_notes: applicant_notes || null,
        internal_notes: internal_notes || null,
        created_by: user.id,
        google_event_id: googleEventId,
        google_calendar_id: googleCalendarId,
      })
      .select()
      .single()

    if (insErr) {
      return new Response(JSON.stringify({ error: insErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Send emails
    const applicantName = `${applicant.first_name || ''} ${applicant.last_name || ''}`.trim()
    const templateData = {
      applicantName,
      positionTitle: position_title,
      interviewDate: fmtDate(start),
      interviewTime: fmtTime(start),
      interviewLocation: location,
      interviewerName: interviewer_name,
      meetingUrl,
      notes: applicant_notes,
    }

    const sendEmail = async (to: string) => {
      try {
        const r = await admin.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'interview-invite',
            recipientEmail: to,
            idempotencyKey: `interview-${inserted.id}-${to}`,
            templateData,
          },
        })
        if (r.error) console.error('send-transactional-email failed', to, r.error)
      } catch (e) {
        console.error('send email error', to, e)
      }
    }

    const recipients = new Set<string>()
    if (applicant.email) recipients.add(applicant.email)
    if (interviewer_email) recipients.add(interviewer_email)
    await Promise.all([...recipients].map(sendEmail))

    return new Response(
      JSON.stringify({ ok: true, interview: inserted, meeting_url: meetingUrl, google_event_id: googleEventId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (e: any) {
    console.error('schedule-interview-meeting error', e)
    return new Response(JSON.stringify({ error: e?.message || 'internal' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
