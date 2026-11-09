// Service Page (services.html) settings for the uploaded Blue Flame template.
// Each section is described once; the editor and the website both read this config.

export type CardField = { key: string; label: string; selector: string; long?: boolean };
export type ServicesSectionDef = {
  key: string;
  title: string;
  selector: string;
  hero?: boolean;
  cardSelector?: string;
  cardLabel?: string;
  fields?: CardField[];
  bullets?: string;
};
export type ServicesCard = Record<string, string | string[]>;
export type ServicesSection = {
  enabled?: boolean;
  badge?: string; title?: string; subtitle?: string;
  buttons?: string[];
  cards?: ServicesCard[];
};
export type WebsiteServicesPage = Record<string, ServicesSection>;

export const SERVICES_SECTIONS: ServicesSectionDef[] = [
  { key: "page-heading", title: "Page Heading", selector: "section.page-hero", hero: true },
  { key: "sector-directory", title: "Sector Directory", selector: "#sectorDirectory", cardSelector: "a.card", cardLabel: "Sector",
    fields: [{ key: "title", label: "Name", selector: "h3" }, { key: "text", label: "Short text", selector: "h3 + span" }] },
  { key: "service-packages", title: "Service Packages & Pricing", selector: "#corePricingPackages", cardSelector: "article.card", cardLabel: "Package",
    fields: [{ key: "price", label: "Price label", selector: ":scope > div:first-child > span" }, { key: "title", label: "Title", selector: "h3" }, { key: "text", label: "Description", selector: "h3 + p", long: true }],
    bullets: "li.bullet-item" },
  { key: "equipment-types", title: "Equipment Types", selector: "#equipmentMatrix", cardSelector: ".equipment-card", cardLabel: "Equipment",
    fields: [{ key: "category", label: "Category", selector: ".equipment-card-cat" }, { key: "title", label: "Title", selector: ".equipment-card-title" }, { key: "text", label: "Description", selector: ".equipment-card-desc", long: true }] },
  { key: "related-products", title: "Related Products", selector: "#serviceRelatedProducts" },
  { key: "coupons", title: "Coupons", selector: "#couponsSection", cardSelector: ".card", cardLabel: "Coupon",
    fields: [{ key: "amount", label: "Discount", selector: ":scope > span:nth-of-type(1)" }, { key: "text", label: "Offer", selector: ":scope > span:nth-of-type(2)" }, { key: "code", label: "Code", selector: ":scope > div" }] },
  { key: "heating", title: "Heating", selector: "main section#heating" },
  { key: "cooling", title: "Cooling", selector: "main section#cooling" },
  { key: "indoor-air", title: "Indoor Air & Membership", selector: "main section#iaq" },
  { key: "comparison", title: "Furnace Comparison", selector: "main section:not([id])" },
];

const clean = (s?: string | null) => (s || "").replace(/\s+/g, " ").trim();
const ok = (s?: unknown) => (typeof s === "string" && s.trim() ? s.trim() : null);

/** Replace visible text while keeping icons (svg / icon spans) inside the element. */
function setText(doc: Document, el: Element | null | undefined, value?: unknown) {
  const v = ok(value);
  if (!el || !v) return;
  const keep = Array.from(el.children).filter(c => c.tagName.toLowerCase() === "svg" || c.classList.contains("bullet-icon"));
  el.textContent = "";
  keep.forEach(k => el.appendChild(k));
  el.appendChild(doc.createTextNode((keep.length ? " " : "") + v));
}

function header(root: Element, hero?: boolean) {
  return hero
    ? { badge: root.querySelector(".badge-pill"), title: root.querySelector("h1"), subtitle: root.querySelector("h1 + p") }
    : { badge: root.querySelector(".section-header .badge-pill"), title: root.querySelector(".section-header .section-title"), subtitle: root.querySelector(".section-header .section-subtitle") };
}

export function readServicesPage(html: string): WebsiteServicesPage {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const out: WebsiteServicesPage = {};
  for (const def of SERVICES_SECTIONS) {
    const root = doc.querySelector(def.selector);
    if (!root) continue;
    const h = header(root, def.hero);
    const sec: ServicesSection = { badge: clean(h.badge?.textContent), title: clean(h.title?.textContent), subtitle: clean(h.subtitle?.textContent) };
    if (def.hero) sec.buttons = Array.from(root.querySelectorAll("a.btn")).map(a => clean(a.textContent));
    if (def.cardSelector && def.fields) {
      sec.cards = Array.from(root.querySelectorAll(def.cardSelector)).map(card => {
        const c: ServicesCard = {};
        def.fields!.forEach(f => { c[f.key] = clean(card.querySelector(f.selector)?.textContent); });
        if (def.bullets) c.bullets = Array.from(card.querySelectorAll(def.bullets)).map(b => clean(b.textContent));
        return c;
      });
    }
    out[def.key] = sec;
  }
  return out;
}

export function applyServicesPage(html: string, cfg: WebsiteServicesPage | null | undefined): string {
  if (!cfg || typeof cfg !== "object") return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  if (!doc.querySelector("#sectorDirectory")) return html; // only services.html
  for (const def of SERVICES_SECTIONS) {
    const s = cfg[def.key];
    const root = doc.querySelector(def.selector);
    if (!s || !root) continue;
    if (s.enabled === false) { root.remove(); continue; }
    const h = header(root, def.hero);
    setText(doc, h.badge, s.badge); setText(doc, h.title, s.title); setText(doc, h.subtitle, s.subtitle);
    if (def.hero) {
      const btns = root.querySelectorAll("a.btn");
      (s.buttons || []).forEach((b, i) => setText(doc, btns[i], b));
    }
    if (def.cardSelector && def.fields && Array.isArray(s.cards)) {
      const cards = root.querySelectorAll(def.cardSelector);
      s.cards.forEach((c, i) => {
        const card = cards[i]; if (!card || !c) return;
        def.fields!.forEach(f => setText(doc, card.querySelector(f.selector), c[f.key]));
        if (def.bullets && Array.isArray(c.bullets)) {
          const items = card.querySelectorAll(def.bullets);
          c.bullets.forEach((b, j) => setText(doc, items[j], b));
        }
      });
    }
  }
  return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
}
