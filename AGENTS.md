# Architecture rules

- Apply Open appointment date priority before pagination through the appointment ordering helper; today's work must not be buried on later pages while historical views keep their existing order.- Admin chat lives in chat_conversations/chat_members/chat_messages; all sends go through the chat-send function so outside texts and away-staff alerts happen server-side, and inbound texts route to whichever chat or ticket/task texted that number most recently.
