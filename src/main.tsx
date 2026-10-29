import { createRoot } from "react-dom/client";
import { applyServiceDirectory, type WebsiteServiceDirectory } from "./lib/blueFlameWebsite";
import { applyHero, applyTopBar, applyTrustBar, type WebsiteTrustBar, applyCoreServices, type WebsiteCoreServices, blueFlameInPlacePage, rewriteBlueFlameAssets, type WebsiteTopBar, type WebsiteHero } from "./lib/blueFlameWebsite";

const blueFlamePage = blueFlameInPlacePage(window.location.hostname, window.location.pathname);

async function loadSettings(): Promise<{ top_bar?: WebsiteTopBar; hero?: WebsiteHero; trust_bar?: WebsiteTrustBar; core_services?: WebsiteCoreServices; service_directory?: WebsiteServiceDirectory } | null> {
  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/companies?slug=eq.blueflameheatingcooling&select=top_bar,hero,trust_bar,core_services,service_directory`;
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
  Promise.all([fetch(blueFlamePage).then((r) => r.text()), loadSettings()]).then(([html, cfg]) => {
    document.open();
    document.write(applyServiceDirectory(applyCoreServices(applyTrustBar(applyHero(applyTopBar(rewriteBlueFlameAssets(html), cfg?.top_bar), cfg?.hero), cfg?.trust_bar), cfg?.core_services), cfg?.service_directory));
    document.close();
  });
} else {
  Promise.all([import("./App.tsx"), import("./index.css")]).then(([{ default: App }]) => {
    const root = document.getElementById("root");
    if (root) createRoot(root).render(<App />);
  });
}
