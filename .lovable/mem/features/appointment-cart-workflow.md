---
name: Appointment Cart Workflow
description: Diagnostic-fee matrix (company × visit type), appointment cart line items, Stripe checkout via connector gateway
type: feature
---
**Tables**: `diagnostic_fees` (company_id nullable = global), `appointment_carts` (one per appointment), `appointment_cart_items`. Cart totals recomputed by trigger `cart_item_recalc_totals` calling `public.recalc_cart_totals`.

**Visit types** (single source of truth in `VISIT_TYPES` from `DiagnosticFeesAdd.tsx`): Service Repair, Estimate, Warranty, Inspection Report, Maintenance, Installation, Other.

**Fee presets**: Waivable ($0), $99, $135, $155, Custom.

**Auto-add diagnostic fee**: When AppointmentsAdd has both `company_id` and `visit_type`, AppointmentCartPanel looks up `diagnostic_fees` (company-specific first, then `company_id IS NULL` global) and inserts one `item_type='diagnostic_fee'` line. Tech can waive (requires reason, only if `is_waivable`).

**Stripe**: Built-in Lovable payments (Stripe). Edge function `create-appointment-checkout` POSTs to `https://connector-gateway.lovable.dev/stripe/v1/checkout/sessions` with `Authorization: Bearer LOVABLE_API_KEY` + `X-Connection-Api-Key: STRIPE_SANDBOX_API_KEY`. Uses inline `price_data` per line (no pre-created Stripe products). Metadata carries `cart_id` + `appointment_id`. Webhook at `/functions/v1/payments-webhook` (env=sandbox|live) marks cart paid on `*.completed` events.

**Cart panel mounts only when editing an existing appointment** (`isEditing && editId`) — needs appointment id.
