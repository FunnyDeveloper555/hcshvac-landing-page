const blueFlameHosts = new Set([
  "blueflameheatingcooling.com",
  "www.blueflameheatingcooling.com",
  "blueflameheatingcooling.hcshvac.com",
]);

const websitePages = new Set([
  "index.html", "about.html", "air-quality.html", "contact.html", "financing.html",
  "products.html", "product-detail.html", "services.html", "services-churches.html",
  "services-commercial.html", "services-educational.html", "services-industrial.html",
  "services-light-industrial.html", "services-medical.html", "services-residential.html",
]);

/** Load original documents, without allowing their CSS or scripts into the CRM. */
export function blueFlameWebsiteDestination(hostname: string, pathname: string): string | null {
  if (/^\/company\/blueflameheatingcooling\/?$/.test(pathname)) {
    return "/blueflame-site/index.html";
  }
  return null;
}
/** On Blue Flame's own domains, the static page to show at the current address (no redirect). */
export function blueFlameInPlacePage(hostname: string, pathname: string): string | null {
  if (!blueFlameHosts.has(hostname.toLowerCase())) return null;
  if (pathname === "/" || pathname === "") return "/blueflame-site/index.html";
  const page = pathname.slice(1);
  return websitePages.has(page) ? `/blueflame-site/${page}` : null;
}

/** Point the page's own asset references at the static folder so it works from the domain root. */
export function rewriteBlueFlameAssets(html: string): string {
  return html.replace(/(href|src)="assets\//g, '$1="/blueflame-site/assets/');
}

export interface WebsiteTopBar {
  enabled?: boolean;
  emergency_text?: string;
  service_area_text?: string;
  urgent_label?: string;
  phone?: string;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Apply the Page Builder "Top Header" settings to the template's top bar. Blank fields keep the template text. */
export function applyTopBar(html: string, bar: WebsiteTopBar | null | undefined): string {
  if (!bar || typeof bar !== "object") return html;
  if (bar.enabled === false) {
    return html.replace(/<aside class="top-bar"[\s\S]*?<\/aside>/, "");
  }
  let out = html;
  const t = (v?: string) => (v && v.trim() ? esc(v.trim()) : null);
  const em = t(bar.emergency_text);
  if (em) out = out.replace(/(<span class="emergency-pulse"><\/span>\s*<strong>)[\s\S]*?(<\/strong>)/, `$1${em}$2`);
  const area = t(bar.service_area_text);
  if (area) out = out.replace(/(<use href="#icon-map-pin"><\/use><\/svg>)[^<]*(<\/span>)/, `$1 ${area}$2`);
  const label = t(bar.urgent_label);
  if (label) out = out.replace(/(<\/div>\s*<div class="top-bar-item">\s*<span>)[^<]*(<\/span>)/, `$1${label}$2`);
  const phone = t(bar.phone);
  if (phone) {
    const tel = phone.replace(/\D/g, "");
    out = out.replace(
      /<a href="tel:[^"]*"( class="top-phone-link"[^>]*>\s*<svg class="svg-icon"><use href="#icon-phone"><\/use><\/svg>)[^<]*/,
      `<a href="tel:${tel}"$1 ${phone}`,
    );
  }
  return out;
}

export interface WebsiteHero {
  badge?: string;
  headline?: string;
  highlight?: string;
  lead?: string;
  cta1_text?: string;
  cta1_link?: string;
  cta2_text?: string;
  cta2_link?: string;
  stats?: { value?: string; label?: string }[];
}

/** Apply Page Builder "Hero" settings to the home page hero. Blank fields keep the template content. */
export function applyHero(html: string, hero: WebsiteHero | null | undefined): string {
  if (!hero || typeof hero !== "object" || typeof DOMParser === "undefined") return html;
  if (!JSON.stringify(hero).match(/:"[^"]*\S/)) return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  const root = doc.querySelector(".hero-home .hero-content");
  if (!root) return html;
  const v = (s?: string) => (s && s.trim() ? s.trim() : null);
  const badge = root.querySelector(".badge-pill > span");
  if (badge && v(hero.badge)) badge.textContent = v(hero.badge);
  const h1 = root.querySelector("h1");
  if (h1 && (v(hero.headline) || v(hero.highlight))) {
    const span = h1.querySelector(".gradient-text");
    const hl = v(hero.highlight) ?? span?.textContent ?? "";
    const head = v(hero.headline) ?? (h1.textContent || "").replace(span?.textContent || "", "").trim();
    h1.textContent = head + " ";
    const s = doc.createElement("span");
    s.className = "gradient-text";
    s.textContent = hl;
    h1.appendChild(s);
  }
  const lead = root.querySelector(".hero-lead");
  if (lead && v(hero.lead)) lead.textContent = v(hero.lead);
  const ctas = root.querySelectorAll<HTMLAnchorElement>(".hero-cta-group a");
  ([[hero.cta1_text, hero.cta1_link], [hero.cta2_text, hero.cta2_link]] as const).forEach(([t, l], i) => {
    const a = ctas[i];
    if (!a) return;
    if (v(t)) a.textContent = v(t);
    if (v(l)) a.setAttribute("href", v(l)!);
  });
  const items = root.querySelectorAll(".hero-stat-item");
  (hero.stats || []).forEach((st, i) => {
    const it = items[i];
    if (!it || !st) return;
    const h3 = it.querySelector("h3");
    const p = it.querySelector("p");
    if (h3 && v(st.value)) h3.textContent = v(st.value);
    if (p && v(st.label)) p.textContent = v(st.label);
  });
  return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
}

export interface WebsiteTrustBar {
  enabled?: boolean;
  items?: { title?: string; text?: string; icon?: string }[];
}

/** Replaces the home page trust bar (4 badges under the hero). Blank fields keep template text. */
export function applyTrustBar(html: string, bar: WebsiteTrustBar | null | undefined): string {
  if (!bar || typeof bar !== "object" || typeof DOMParser === "undefined") return html;
  const hasText = (bar.items || []).some((i) => i?.title?.trim() || i?.text?.trim() || i?.icon?.trim());
  if (bar.enabled !== false && !hasText) return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  const grid = doc.querySelector(".trust-bar-grid");
  if (!grid) return html;
  if (bar.enabled === false) {
    (grid.closest("section") || grid.parentElement || grid).remove();
  } else {
    const items = grid.querySelectorAll(".trust-item");
    (bar.items || []).forEach((it, i) => {
      const el = items[i];
      if (!el || !it) return;
      const h4 = el.querySelector("h4");
      const p = el.querySelector("p");
      if (h4 && it.title?.trim()) h4.textContent = it.title.trim();
      if (p && it.text?.trim()) p.textContent = it.text.trim();
      const box = el.querySelector(".trust-item-icon");
      if (box && it.icon?.trim() && /^https?:\/\//i.test(it.icon.trim())) {
        const img = doc.createElement("img");
        img.src = it.icon.trim();
        img.alt = "";
        img.setAttribute("style", "width:60%;height:60%;object-fit:contain;");
        box.replaceChildren(img);
      }
    });
  }
  return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
}
