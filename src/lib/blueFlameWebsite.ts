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
