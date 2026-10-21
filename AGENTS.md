# Architecture rules

- Customer submission action alerts read actual pending customer/appointment records through the staff-only crm_pending_submissions RPC; staff saves clear review markers, while reading messages never dismisses unfinished work.
- Sidebar and customer/appointment list pending indicators derive record IDs from the same usePendingSubmissions query as the alert list, so they remain synchronized without independent read/dismissal state.

- Apply Open appointment date priority before pagination through the appointment ordering helper; today's work must not be buried on later pages while historical views keep their existing order.- Admin chat lives in chat_conversations/chat_members/chat_messages; all sends go through the chat-send function so outside texts and away-staff alerts happen server-side, and inbound texts route to whichever chat or ticket/task texted that number most recently.
- Installation warranty/maintenance colors come only from src/components/admin/installations/warrantyStatus.ts; appointments whose visit type mentions installation cannot close (manually or by the auto-close job) without an installation record, so the closeout rule stays in one place per layer.
- Extra alert recipients (pagers, office lines) live in public.notification_targets; appointment-sms includes active rows in appointment texts (notify_appointments) and submission alerts (notify_submissions), so new recipients are data changes, not code changes.
- Appointment and manual SMS identify pager recipients from notification_targets email domains and use the shared pager formatter; single-segment printable ASCII avoids legacy pager Unicode/multipart display failures without altering email content.
