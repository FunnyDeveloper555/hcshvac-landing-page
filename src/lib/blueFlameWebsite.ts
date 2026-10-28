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
