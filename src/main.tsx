import { createRoot } from "react-dom/client";
import { applyServiceDirectory, type WebsiteServiceDirectory, applyServiceGuides, type WebsiteServiceGuides, applyFlagship, type WebsiteFlagship, applyFaq, type WebsiteFaq, applyFooter, type WebsiteFooter, applyAboutUs, type WebsiteAboutUs, applyFinancing, type WebsiteFinancing, applyAirQuality, type WebsiteAirQuality } from "./lib/blueFlameWebsite";
import { applyHero, applyTopBar, applyTrustBar, type WebsiteTrustBar, applyCoreServices, type WebsiteCoreServices, blueFlameInPlacePage, rewriteBlueFlameAssets, type WebsiteTopBar, type WebsiteHero } from "./lib/blueFlameWebsite";

import { injectProducts, toTemplateProduct, type ProductRow } from "./lib/blueFlameProducts";

async function loadProducts(): Promise<ProductRow[] | null> {
  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/products?select=*,product_variants(id,sku,variant_name,price,is_active)&status=in.(active_showing,discontinued_showing)&order=display_order.asc.nullslast,product_name.asc`;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const r = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    const rows = await r.json();
    return Array.isArray(rows) ? rows : null;
  } catch {
    return null;
  }
}

const blueFlamePage = blueFlameInPlacePage(window.location.hostname, window.location.pathname);

async function loadSettings(): Promise<{ top_bar?: WebsiteTopBar; hero?: WebsiteHero; trust_bar?: WebsiteTrustBar; core_services?: WebsiteCoreServices; service_directory?: WebsiteServiceDirectory; service_guides?: WebsiteServiceGuides; flagship?: WebsiteFlagship; faq?: WebsiteFaq; footer?: WebsiteFooter; about_us?: WebsiteAboutUs; financing?: WebsiteFinancing; air_quality?: WebsiteAirQuality } | null> {
  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/companies?slug=eq.blueflameheatingcooling&select=top_bar,hero,trust_bar,core_services,service_directory,service_guides,flagship,faq,footer,about_us,financing,air_quality`;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const r = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    const rows = await r.json();
    return rows?.[0] ?? null;
  } catch {
    return null;
  }
}

if (blueFlamePage) {
  // Show the uploaded Blue Flame page at the clean address (e.g. "/" or "/about.html"),
  // with the Page Builder settings applied.
  const needsProducts = /\/(products|product-detail)\.html$/.test(blueFlamePage);
  Promise.all([fetch(blueFlamePage).then((r) => r.text()), loadSettings(), needsProducts ? loadProducts() : Promise.resolve(null)]).then(([raw, cfg, products]) => {
    const html = products ? injectProducts(raw, products.map((p) => toTemplateProduct(p))) : raw;
    document.open();
    document.write(applyAirQuality(applyFinancing(applyAboutUs(applyFooter(applyFaq(applyFlagship(applyServiceGuides(applyServiceDirectory(applyCoreServices(applyTrustBar(applyHero(applyTopBar(rewriteBlueFlameAssets(html), cfg?.top_bar), cfg?.hero), cfg?.trust_bar), cfg?.core_services), cfg?.service_directory), cfg?.service_guides), cfg?.flagship), cfg?.faq), cfg?.footer), cfg?.about_us), cfg?.financing), cfg?.air_quality));
    document.close();
  });
} else {
  Promise.all([import("./App.tsx"), import("./index.css")]).then(([{ default: App }]) => {
    const root = document.getElementById("root");
    if (root) createRoot(root).render(<App />);
  });
}
