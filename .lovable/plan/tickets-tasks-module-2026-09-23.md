# Tickets & Tasks module

## What the client is asking for (plain reading)

Two new internal work items that sit next to Appointments and behave the same way (assigned crew, calendar entry, text message):

**Ticket** — something that needs fixing or following up, usually tied to a customer.
Created when a customer calls in to complain, when an employee forgot something, or when someone needs to do something for a customer. A ticket has: the customer (optional — some tickets are internal), notes, an expected completion date, and optionally a real appointment date and time. It records who created it.

**Task** — an internal to-do that usually has no customer: "Meeting at 9", "Pick up a condenser from the supply house", "Drop off paperwork". Same essentials: what it is, who does it, when.

Both can be assigned to one staff member or several, land on those people's calendar, and send them a text when assigned (and as a reminder if a date and time is set). Both appear on a "Tickets and Tasks" board the employee sees.

## Menu layout the client drew

```text
Appointments
  New
    Appointment
    Ticket
    Task
  List
    Open
    Closed
    Tickets
    Tasks
Logs
  Tickets
  Tasks
```

So Tickets and Tasks are not their own top-level menus — they are new "New" and "List" entries under Appointments, plus history under Logs.

## What gets built

**Data**
- `tickets` table: ticket number (TKT260001 style), customer (nullable), subject, reason/category, notes, priority, expected completion date, optional scheduled date/time and duration, assigned team (same JSON shape as appointments), status (open / in progress / completed / cancelled), created-by user, timestamps. Grants + admin/staff row policies like the appointments tables.
- `tasks` table: task number (TSK260001), task type (Meeting, Pick Up, Drop Off, Callback, Errand, Other), title, location/where, notes, due date, optional scheduled date/time and duration, assigned team, status, created-by, timestamps.
- Both get calendar sync fields (`calendar_id`, `google_event_id`, reminder flags) mirroring appointments so the existing sync and reminder machinery applies.
- Status/assignment changes write to the existing activity log so the Logs > Tickets / Tasks views have history.

**Admin screens**
- New Ticket form: customer search box (same selector as the appointment form, skippable for internal tickets), reason, notes, expected completion date, optional appointment date/time, Assigned Team checklist, calendar pick, "created by" stamp shown on save, Submit.
- New Task form: task type picker, title, where/who, notes, due date, optional date/time, Assigned Team, calendar.
- Tickets list and Tasks list: filter by status, assignee, date range; search; inline status change; edit and close actions — same table style as the appointments lists.
- Logs > Tickets and Logs > Tasks: read-only history of created / assigned / status-changed entries.

**Calendar and texts**
- Tickets and tasks with a date appear in the existing Appointments calendar alongside appointments, visually distinguished (colour + a Ticket/Task tag), with every assigned crew name listed.
- The existing calendar sync function is extended to push tickets and tasks to the chosen calendar, adding each assigned person as an attendee.
- The existing text-reminder function is extended so every assigned person gets a text when they are assigned, and a reminder before a scheduled ticket/task — reusing the blocked-number and de-duplication rules already in place.

**Employee board**
- A single "Tickets & Tasks" board showing the signed-in staff member's open items, grouped Today / This week / Later, with a one-tap Complete button. Reachable from the admin menu for staff.

## Questions before building

1. Should a completed ticket be able to turn into a real appointment (one click, carrying customer and notes over), or do those stay separate?
2. Who may create tickets and tasks — admins only, or any staff member for themselves and others?
3. Should the customer ever be told about their ticket (text/email confirmation), or is it internal only for now?

## Order of work

1. Tables, grants, policies, numbering, history logging.
2. New Ticket and New Task forms plus the two lists, menu entries under Appointments.
3. Calendar rendering + sync, then assignment and reminder texts.
4. Employee Tickets & Tasks board and the two Logs views.
