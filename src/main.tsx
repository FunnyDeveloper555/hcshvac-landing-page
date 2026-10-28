import { createRoot } from "react-dom/client";
import { applyTopBar, blueFlameInPlacePage, rewriteBlueFlameAssets, type WebsiteTopBar } from "./lib/blueFlameWebsite";

const blueFlamePage = blueFlameInPlacePage(window.location.hostname, window.location.pathname);

async function loadTopBar(): Promise<WebsiteTopBar | null> {
  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/companies?slug=eq.blueflameheatingcooling&select=top_bar`;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const r = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    const rows = await r.json();
    return rows?.[0]?.top_bar ?? null;
  } catch {
    return null;
  }
}

if (blueFlamePage) {
  // Show the uploaded Blue Flame page at the clean address (e.g. "/" or "/about.html"),
  // with the Page Builder settings applied.
  Promise.all([fetch(blueFlamePage).then((r) => r.text()), loadTopBar()]).then(([html, bar]) => {
    document.open();
    document.write(applyTopBar(rewriteBlueFlameAssets(html), bar));
    document.close();
  });
} else {
  Promise.all([import("./App.tsx"), import("./index.css")]).then(([{ default: App }]) => {
    createRoot(document.getElementById("root")!).render(<App />);
  });
}
