## Goal
Build an Appointment → Cart flow on `/admin/appointments/add` with per-company/per-visit-type diagnostic fees and Stripe checkout for collecting payment.

This plan covers Phase 1 only (Appointment + Cart + Diagnostic Fee + Stripe). Categories restructure, PDF library/disclaimers, tech site profile, photos/videos, and email/page templates are noted at the bottom as Phase 2+.

---

## Phase 1 — What gets built

### 1. Diagnostic Fee config (new table)
A configurable matrix per company × visit type, plus a preset list of fee amounts the user picks from.

- New table `diagnostic_fees`:
  - `company_id` (nullable = "applies to all companies")
  - `visit_type` — one of: Service Repair, Estimate, Warranty, Inspection Report, Maintenance, Installation, Other
  - `fee_amount` — numeric (0 = waivable, 99, 135, 155, or custom)
  - `is_waivable` — boolean (lets tech remove the fee at checkout)
  - `is_active`, `notes`
- Admin screen at `/admin/diagnostic-fees` to add / edit / list rows.
- Preset amounts surfaced in the form dropdown: **Waivable ($0)**, **$99**, **$135**, **$155**, **Custom**.

### 2. Visit-type-driven auto-add on Appointments/Add
On `/admin/appointments/add`:
- When the admin selects **Company** + **Visit Type**, the cart auto-loads the matching diagnostic fee from `diagnostic_fees` (company-specific first, then global fallback).
- Tech can **waive** the fee inline (only if `is_waivable = true`); a reason is required and logged.

### 3. Appointment Cart (new tables + UI panel)
A line-item cart attached to each appointment.

- New tables:
  - `appointment_carts` — one row per appointment (`appointment_id`, `subtotal`, `tax`, `total`, `payment_status`, `stripe_session_id`, `paid_at`)
  - `appointment_cart_items` — `cart_id`, `product_id` (nullable for ad-hoc fee lines), `description`, `qty`, `unit_price`, `line_total`, `item_type` ('diagnostic_fee' | 'product' | 'service' | 'custom')
- New UI panel on Appointments/Add (and Edit) below the appointment fields:
  - Add items from `products` list (search by name/SKU, with category filter for Parts / Services)
  - Edit qty, unit price (with permission), remove line
  - Running subtotal / tax / total
  - "Charge Customer" button → Stripe Checkout (Phase 1.4)

### 4. Stripe payment
- Enable Lovable's built-in Stripe (`enable_stripe_payments`).
- Edge function `create-appointment-checkout` creates a Stripe Checkout Session from the cart items and returns the URL.
- Edge function `stripe-webhook` listens for `checkout.session.completed` → marks `appointment_carts.payment_status = 'paid'` and stamps `paid_at`.
- "Charge Customer" opens the Stripe Checkout URL in a new tab; cart status badge updates on return.

### 5. Audit + logging
Every cart change (add/remove item, fee waive, charge attempt, payment success) is written to `admin_logs` per existing audit pattern.

---

## Technical notes

- Migration order: `diagnostic_fees` → `appointment_carts` → `appointment_cart_items`, each with GRANTs + RLS (`auth.uid()`-scoped admin write, SECURITY DEFINER read where needed).
- Use existing `products` table; no new product fields in Phase 1.
- Cart totals recomputed in the DB via trigger so totals stay consistent across UI and Stripe.
- Stripe currency = USD; line items sent in cents.
- Tax: skipped in Phase 1 (Stripe `automatic_tax` off). We can wire Stripe Tax in a later pass.
- Diagnostic fee waiver requires `is_waivable = true` and writes a `waiver_reason` to the cart item.

---

## Files touched (Phase 1)

**New**
- `supabase/migrations/<ts>_diagnostic_fees_and_cart.sql`
- `src/components/admin/DiagnosticFeesList.tsx`
- `src/components/admin/DiagnosticFeesAdd.tsx`
- `src/components/admin/appointments/AppointmentCartPanel.tsx`
- `src/components/admin/appointments/CartItemPicker.tsx`
- `supabase/functions/create-appointment-checkout/index.ts`
- `supabase/functions/stripe-webhook/index.ts`

**Edited**
- `src/components/admin/appointments/AppointmentsAdd.tsx` — mount cart panel, wire visit-type → fee auto-add
- `src/components/admin/AdminSidebar.tsx` — add "Diagnostic Fees" menu under Settings
- `src/pages/Admin.tsx` — routes for `/admin/diagnostic-fees` (+ `/add`, `/edit`)

---

## Phase 2+ (not in this build — confirm later)

- 4.1 / 4.2 New product categories: Parts; Services (Residential / Commercial / Non-Profit) — restructure of `product_categories`
- 4.3 PDF system: Warranty templates, manufacturer/supplier PDF library, Service Disclaimer auto-attach by service
- 5. Tech "Site Profile Questionnaire"
- Field photos + video uploads attached to customer/appointment
- Email templates per appointment lifecycle event
- Page templates polish

---

Confirm and I'll start with the migration.