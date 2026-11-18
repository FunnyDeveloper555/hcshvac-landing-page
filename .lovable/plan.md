# Split Bundle Maker into Bundles + Estimates, with a reusable Finance Calculator

## How it will work

### Part 1 — Bundle Maker (makes bundles for the Products page)
- Bundle Maker becomes a tool for building **saved bundles** (e.g. "Rheem 80% Furnace + 3-Ton AC + Coil").
- Pick the products (furnace, condenser, coil, water heater, accessories, add-ons), give the bundle a name, image and short description.
- Each bundle shows Total Our Cost, a calculated price (using the Pricing Rules), and an optional override price.
- A **"Show on website"** switch. Bundles that are switched on appear on the company's Products page as bundle packages.
- New **Bundles** list with search, edit, duplicate and delete.

### Part 2 — Estimate Builder (custom estimate for a client)
- New **Estimate** screen with the current header (company logo, Bill To / Ship To, estimate #, dates, rep, site profile).
- Below it, an **"Add to estimate"** area with three choices:
  1. **Single product**: search the Products module.
  2. **Pre-made bundle**: pick one of the saved bundles from Part 1.
  3. **Custom bundle**: opens the bundle builder inside the estimate. This bundle is saved only on this estimate, with an option to "Also save as a reusable bundle".
- An estimate can hold several lines: products, bundles or a mix. Each line shows qty, price and a remove button.
- Estimate totals: subtotal, optional discount and grand total.
- Prices are saved with the estimate, as they are now.

### Finance Calculator (works anywhere)
- The FTL financing table becomes its own reusable calculator. It has an **"Apply financing"** button on any of these:
  - each line of an estimate (e.g. finance just the bundle)
  - the estimate's grand total
  - a single bundle preview
- It also opens on its own from the Products menu (**Finance Calculator**) for quick quotes. You type any amount and it shows the monthly payments.
- Loan plans (months, APR, BDr) are managed in one place, so every calculator uses the same plans. They start with the current placeholder plans until you send the real FTL rates.

## Menu changes (under Products)
- Bundle Maker → **Bundles** (list) + **Bundle Maker** (add/edit)
- **Estimates** (list) + **New Estimate**
- **Finance Calculator**

## Existing estimates
- Estimates already saved keep working. They open as an estimate with one custom-bundle line.

## Technical details
- New table `product_bundles` (company_id, name, slug, image, description, items jsonb, price_override, is_showing, status). Website visibility defaults off. Staff-only write; public read only where is_showing.
- New table `finance_plans` (months, apr, bdr, label, sort, active). Staff write, authenticated read.
- `product_estimates` gains `lines jsonb` (type: product | bundle | custom_bundle, snapshot, qty, financing). Legacy rows are mapped to one custom_bundle line on read.
- Extract the bundle editor into a shared `BundleEditor` component used by Bundle Maker and the custom-bundle dialog. Financing math stays in `src/lib/bundleMath.ts`, and `<FinanceCalculator amount>` is a reusable component/dialog.
- Blue Flame products page: add a "Bundles" section, rendered from showing bundles via the existing products loader.
- Tests for line totals and the financing payment math.
