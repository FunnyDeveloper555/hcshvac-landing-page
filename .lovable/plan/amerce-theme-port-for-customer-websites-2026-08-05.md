# Amerce Theme Port for Customer Websites

Re-skin the entire company-facing website (all pages) with the purchased Amerce theme, pixel-faithful, while keeping each company's brand color, logo and database-driven content.

## What I need from you first

Upload the **React version** of the Amerce package (zip). The only theme file currently in uploads is the HTML/Bootstrap zip. Once the React zip is here I port from its components; the HTML zip stays as a reference for any page the React build doesn't include.

## Approach: scoped theme shell

The company site is one React page (`CompanyLanding`) that switches sections via `activePage`, plus ~23 components under `src/components/company/`. The admin panel shares the same app and must not change visually.

The theme's CSS is Bootstrap-based, so it is loaded **only inside the company site routes**, scoped so it cannot leak into the admin:

```text
CompanyLanding (subdomain or /c/:slug)
  └── <AmerceShell>            loads theme CSS/fonts/icons, injects brand color
        ├── AmerceHeader       ← company nav, logo, phone
        ├── AmerceHero         ← hero image, tagline, CTAs
        ├── AmerceServices / Brands / ServiceAreas / Coupons / Partners
        ├── AmerceShop         ← product list + product detail (theme's ecommerce pages)
        ├── AmerceContact      ← existing booking/contact form logic reused
        └── AmerceFooter
```

Admin routes never mount `AmerceShell`, so Bootstrap styles stay out of the dashboard.

## Branding stays per-company

Each company's `primary_color`, logo, hero image and theme content continue to drive the page. The theme's accent color variables are overwritten at runtime from `primary_color` (same HSL injection approach already used), so all five company sites use the Amerce layout with their own identity.

## Work order

1. **Extract & audit** the React package: list its pages, component structure, CSS/SCSS entry points, font and icon assets, and any dependencies (Bootstrap, sliders, lightbox).
2. **Assets**: upload theme images/fonts/icons to CDN assets; add required npm packages.
3. **Shell**: build `AmerceShell` with scoped theme stylesheet loading + brand-color override.
4. **Header / Hero / Footer** ported first so every page immediately looks like the theme.
5. **Content sections**: services, brands accordions, service areas, coupons, partners, page content (`header_pages`), CTA icons, popup.
6. **Shop pages**: product list, filters and product detail mapped onto the theme's ecommerce templates.
7. **Contact / booking**: keep existing form logic and validation, re-dress with theme markup.
8. **QA pass**: screenshot each company site (all 5 slugs) at desktop and mobile, verify the admin panel is untouched, fix layout breaks.

## Technical notes

- Theme CSS is loaded via a dynamic import inside `AmerceShell` and wrapped in a scoping class so Bootstrap resets don't reach Tailwind-styled admin UI.
- No data or schema changes; all queries in `CompanyLanding` and the company components are reused as-is.
- The old `companyThemes.ts` presets (Modern/Classic/Bold/Minimal/Elegant) become unused for company sites once Amerce is the single template — I'll leave the file in place unless you want the presets removed.
- ThemeForest license: theme assets ship in this project only; they are not re-distributed.
