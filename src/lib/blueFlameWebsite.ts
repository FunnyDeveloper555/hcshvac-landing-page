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

export interface WebsiteCoreServiceCard {
  icon?: string;
  title?: string;
  text?: string;
  bullets?: string[];
  button_text?: string;
  button_link?: string;
}

export interface WebsiteServiceDirectory {
  enabled?: boolean;
  badge?: string;
  title?: string;
  subtitle?: string;
  items?: { title?: string; subtitle?: string; icon?: string; cards?: WebsiteDirectoryCard[] }[];
}

/** Sub-content card inside one Service Directory accordion panel. */
export interface WebsiteDirectoryCard {
  tag?: string;
  title?: string;
  text?: string;
  bullets?: string[];
  cities?: string[];
  meta?: { label?: string; value?: string }[];
}

const DIRECTORY_CARD = ".partner-info-card, .area-coverage-card";
const clean = (s: string | null | undefined) => (s || "").replace(/\s+/g, " ").trim();

/** Reads each accordion panel's sub-content cards from the template, so the editor starts from the real website. */
export function readServiceDirectoryCards(html: string): WebsiteDirectoryCard[][] {
  if (typeof DOMParser === "undefined") return [];
  const doc = new DOMParser().parseFromString(html, "text/html");
  const items = doc.querySelectorAll("#serviceDirectoryMaster .master-accordion-item");
  return Array.from(items).map(item => Array.from(item.querySelectorAll(DIRECTORY_CARD)).map(card => {
    const out: WebsiteDirectoryCard = {
      tag: clean(card.querySelector(".tag-label")?.textContent),
      title: clean(card.querySelector(".card-title, .area-coverage-title")?.textContent),
      text: clean(card.querySelector(".partner-card-desc, .area-coverage-desc")?.textContent),
    };
    const bullets = card.querySelectorAll(".partner-check-item");
    if (bullets.length) out.bullets = Array.from(bullets).map(li => clean(Array.from(li.childNodes).filter(n => !(n as Element).classList?.contains("partner-check-circle")).map(n => n.textContent).join("")));
    const cities = card.querySelectorAll(".area-city-pill");
    if (cities.length) out.cities = Array.from(cities).map(c => clean(c.textContent));
    const meta = card.querySelectorAll(".area-coverage-meta > span");
    if (meta.length) out.meta = Array.from(meta).map(m => ({ label: clean(Array.from(m.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent).join("")).replace(/:$/, ""), value: clean(m.querySelector("strong")?.textContent) }));
    return out;
  }));
}

function applyDirectoryCard(doc: Document, card: Element, c: WebsiteDirectoryCard) {
  const set = (el: Element | null, s?: string) => { if (el && typeof s === "string" && s.trim()) el.textContent = s.trim(); };
  set(card.querySelector(".tag-label"), c.tag);
  set(card.querySelector(".card-title, .area-coverage-title"), c.title);
  set(card.querySelector(".partner-card-desc, .area-coverage-desc"), c.text);
  const list = card.querySelector(".partner-checklist");
  const bullets = (c.bullets || []).map(b => b.trim()).filter(Boolean);
  if (list && bullets.length) {
    list.innerHTML = "";
    bullets.forEach(b => {
      const li = doc.createElement("li"); li.className = "partner-check-item";
      const circle = doc.createElement("span"); circle.className = "partner-check-circle"; circle.textContent = "\u2713";
      li.append(circle, doc.createTextNode(" " + b)); list.appendChild(li);
    });
  }
  const pills = card.querySelector(".area-coverage-cities");
  const cities = (c.cities || []).map(b => b.trim()).filter(Boolean);
  if (pills && cities.length) {
    pills.innerHTML = "";
    cities.forEach(city => { const s = doc.createElement("span"); s.className = "area-city-pill"; s.textContent = city; pills.appendChild(s); });
  }
  const metas = card.querySelectorAll(".area-coverage-meta > span");
  (c.meta || []).forEach((m, i) => {
    const el = metas[i]; if (!el || !m) return;
    const strong = el.querySelector("strong");
    if (m.label?.trim()) { Array.from(el.childNodes).filter(n => n.nodeType === 3).forEach(n => n.remove()); el.insertBefore(doc.createTextNode(m.label.trim() + ": "), el.firstChild); }
    if (strong && m.value?.trim()) strong.textContent = m.value.trim();
  });
}

/** Update directory headings while preserving the template's expandable content and scripts. */
export function applyServiceDirectory(html: string, settings: WebsiteServiceDirectory | null | undefined): string {
  if (!settings || typeof settings !== "object" || typeof DOMParser === "undefined") return html;
  if (!Object.keys(settings).length) return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  const section = doc.getElementById("serviceDirectoryMaster");
  if (!section) return html;
  if (settings.enabled === false) section.remove();
  else {
    const setText = (element: Element | null, value: unknown) => {
      if (element && typeof value === "string" && value.trim()) element.textContent = value.trim();
    };
    setText(section.querySelector(".section-header .badge-pill"), settings.badge);
    setText(section.querySelector(".section-title"), settings.title);
    setText(section.querySelector(".section-subtitle"), settings.subtitle);
    const headers = section.querySelectorAll(".master-accordion-header");
    if (Array.isArray(settings.items)) settings.items.forEach((item, i) => {
      const header = headers[i];
      if (!header || !item) return;
      setText(header.querySelector(".master-header-title span"), item.title);
      setText(header.querySelector(".master-header-subtitle"), item.subtitle);
      const original = header.querySelector(".master-header-title svg");
      if (original && typeof item.icon === "string" && /^https?:\/\//i.test(item.icon.trim())) {
        const image = doc.createElement("img");
        image.src = item.icon.trim(); image.alt = ""; image.width = 22; image.height = 22;
        image.style.objectFit = "contain";
        original.replaceWith(image);
      }
      const panel = header.closest(".master-accordion-item");
      const cards = panel ? panel.querySelectorAll(DIRECTORY_CARD) : [];
      (item.cards || []).forEach((c, j) => { if (cards[j] && c) applyDirectoryCard(doc, cards[j], c); });
    });
  }
  return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
}
export interface WebsiteCoreServices {
  enabled?: boolean;
  badge?: string;
  title?: string;
  subtitle?: string;
  cards?: WebsiteCoreServiceCard[];
}

/** Replaces the home page "Complete Climate Solutions" section (#coreServices). Blank fields keep template content. */
export function applyCoreServices(html: string, cs: WebsiteCoreServices | null | undefined): string {
  if (!cs || typeof cs !== "object" || typeof DOMParser === "undefined") return html;
  if (cs.enabled !== false && !JSON.stringify(cs).match(/:"[^"]*\S/)) return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  const sec = doc.getElementById("coreServices");
  if (!sec) return html;
  if (cs.enabled === false) {
    sec.remove();
    return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
  }
  const v = (s?: string) => (s && s.trim() ? s.trim() : null);
  const set = (el: Element | null, s?: string) => { if (el && v(s)) el.textContent = v(s); };
  set(sec.querySelector(".section-header .badge-pill"), cs.badge);
  set(sec.querySelector(".section-header .section-title"), cs.title);
  set(sec.querySelector(".section-header .section-subtitle"), cs.subtitle);
  const cards = sec.querySelectorAll("article.card");
  (cs.cards || []).forEach((c, i) => {
    const el = cards[i];
    if (!el || !c) return;
    const icon = el.querySelector(".service-icon-box");
    if (icon && v(c.icon) && /^https?:\/\//i.test(v(c.icon)!)) {
      const img = doc.createElement("img");
      img.src = v(c.icon)!;
      img.alt = "";
      img.setAttribute("style", "width:60%;height:60%;object-fit:contain;");
      icon.replaceChildren(img);
    }
    set(el.querySelector("h3"), c.title);
    set(el.querySelector("p"), c.text);
    const lis = el.querySelectorAll("li.bullet-item");
    (c.bullets || []).forEach((b, j) => {
      const li = lis[j];
      if (!li || !v(b)) return;
      const ic = li.querySelector(".bullet-icon");
      li.replaceChildren(...(ic ? [ic, doc.createTextNode(" ")] : []), doc.createTextNode(v(b)!));
    });
    const a = el.querySelector("a.btn");
    if (a) {
      set(a, c.button_text);
      if (v(c.button_link)) a.setAttribute("href", v(c.button_link)!);
    }
  });
  return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
}

export interface WebsiteGuideItem { title?: string; text?: string; icon?: string }
export interface WebsiteServiceGuides {
  enabled?: boolean;
  badge?: string;
  title?: string;
  subtitle?: string;
  columns?: { title?: string; icon?: string; items?: WebsiteGuideItem[] }[];
}

const guideClean = (s: string | null | undefined) => (s || "").replace(/\s+/g, " ").trim();

/** Reads the "Interactive Guides" accordion section (#serviceAccordions) from the template for editor defaults. */
export function readServiceGuides(html: string): WebsiteServiceGuides | null {
  if (typeof DOMParser === "undefined") return null;
  const doc = new DOMParser().parseFromString(html, "text/html");
  const sec = doc.getElementById("serviceAccordions");
  if (!sec) return null;
  return {
    enabled: true,
    badge: guideClean(sec.querySelector(".section-header .badge-pill")?.textContent),
    title: guideClean(sec.querySelector(".section-header .section-title")?.textContent),
    subtitle: guideClean(sec.querySelector(".section-header .section-subtitle")?.textContent),
    columns: Array.from(sec.querySelectorAll(".grid-2 > div")).map(col => ({
      title: guideClean(col.querySelector("h3 span")?.textContent),
      icon: "",
      items: Array.from(col.querySelectorAll(".accordion-item")).map(item => ({
        title: guideClean(item.querySelector(".accordion-header-title > span:last-child")?.textContent),
        text: guideClean(item.querySelector(".accordion-inner")?.textContent),
        icon: "",
      })),
    })),
  };
}

/** Applies guide text and chosen icons inside the existing accordion markup; blank fields keep template content. */
export function applyServiceGuides(html: string, g: WebsiteServiceGuides | null | undefined): string {
  if (!g || typeof g !== "object" || typeof DOMParser === "undefined" || !Object.keys(g).length) return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  const sec = doc.getElementById("serviceAccordions");
  if (!sec) return html;
  if (g.enabled === false) { sec.remove(); return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML; }
  const set = (el: Element | null, s?: string) => { if (el && typeof s === "string" && s.trim()) el.textContent = s.trim(); };
  const icon = (svg: Element | null, url?: string, size = 20) => {
    if (!svg || typeof url !== "string" || !/^https?:\/\//i.test(url.trim())) return;
    const img = doc.createElement("img");
    img.src = url.trim(); img.alt = ""; img.width = size; img.height = size; img.style.objectFit = "contain";
    svg.replaceWith(img);
  };
  set(sec.querySelector(".section-header .badge-pill"), g.badge);
  set(sec.querySelector(".section-header .section-title"), g.title);
  set(sec.querySelector(".section-header .section-subtitle"), g.subtitle);
  const cols = sec.querySelectorAll(".grid-2 > div");
  (g.columns || []).forEach((c, i) => {
    const col = cols[i]; if (!col || !c) return;
    set(col.querySelector("h3 span"), c.title);
    icon(col.querySelector("h3 svg"), c.icon, 24);
    const items = col.querySelectorAll(".accordion-item");
    (c.items || []).forEach((it, j) => {
      const el = items[j]; if (!el || !it) return;
      set(el.querySelector(".accordion-header-title > span:last-child"), it.title);
      set(el.querySelector(".accordion-inner"), it.text);
      icon(el.querySelector(".icon-tag svg"), it.icon, 18);
    });
  });
  return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
}

export interface WebsiteFlagship {
  enabled?: boolean; badge?: string; title?: string; intro?: string;
  bullets?: { label?: string; text?: string; icon?: string }[];
  button_text?: string; button_link?: string;
  image?: string; preview_label?: string; efficiency?: string; caption?: string;
}

/** Reads the flagship product teaser (#homeProductTeaser) from the template for editor defaults. */
export function readFlagship(html: string): WebsiteFlagship | null {
  if (typeof DOMParser === "undefined") return null;
  const sec = new DOMParser().parseFromString(html, "text/html").getElementById("homeProductTeaser");
  if (!sec) return null;
  const c = guideClean;
  return {
    enabled: true,
    badge: c(sec.querySelector(".badge-pill")?.textContent),
    title: c(sec.querySelector("h2")?.textContent),
    intro: c(sec.querySelector(".showcase-grid > div p")?.textContent),
    bullets: Array.from(sec.querySelectorAll(".bullet-item")).map(li => {
      const label = c(li.querySelector("strong")?.textContent).replace(/:$/, "");
      const full = c(li.textContent);
      return { label, text: c(full.slice(full.indexOf(":") + 1)), icon: "" };
    }),
    button_text: c(sec.querySelector("a.btn")?.textContent),
    button_link: sec.querySelector("a.btn")?.getAttribute("href") || "",
    image: "",
    preview_label: c(sec.querySelector(".badge-view-status")?.textContent),
    efficiency: c(sec.querySelector(".efficiency-badge")?.textContent),
    caption: c(sec.querySelector(".primary-image-box + p")?.textContent),
  };
}

/** Applies flagship settings inside the existing markup; blank fields keep template content. */
export function applyFlagship(html: string, f: WebsiteFlagship | null | undefined): string {
  if (!f || typeof f !== "object" || typeof DOMParser === "undefined" || !Object.keys(f).length) return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  const sec = doc.getElementById("homeProductTeaser");
  if (!sec) return html;
  if (f.enabled === false) { sec.remove(); return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML; }
  const ok = (s?: string) => typeof s === "string" && s.trim() ? s.trim() : null;
  const set = (el: Element | null, s?: string) => { const v = ok(s); if (el && v) el.textContent = v; };
  const keepIcon = (el: Element | null, s?: string) => {
    const v = ok(s); if (!el || !v) return;
    const svg = el.querySelector("svg"); el.textContent = " " + v; if (svg) el.prepend(svg);
  };
  const isUrl = (s?: string) => !!ok(s) && /^https?:\/\//i.test(s!.trim());
  keepIcon(sec.querySelector(".badge-pill"), f.badge);
  set(sec.querySelector("h2"), f.title);
  set(sec.querySelector(".showcase-grid > div p"), f.intro);
  const items = sec.querySelectorAll(".bullet-item");
  (f.bullets || []).forEach((b, i) => {
    const li = items[i]; if (!li || !b) return;
    const strong = li.querySelector("strong");
    if (strong && ok(b.label)) strong.textContent = ok(b.label)!.replace(/:?$/, ":");
    if (strong && ok(b.text)) { while (strong.nextSibling) strong.nextSibling.remove(); strong.after(doc.createTextNode(" " + ok(b.text))); }
    const svg = li.querySelector(".bullet-icon svg");
    if (svg && isUrl(b.icon)) { const img = doc.createElement("img"); img.src = b.icon!.trim(); img.alt = ""; img.width = 18; img.height = 18; img.style.objectFit = "contain"; svg.replaceWith(img); }
  });
  const btn = sec.querySelector("a.btn");
  if (btn) { set(btn, f.button_text); if (ok(f.button_link)) btn.setAttribute("href", ok(f.button_link)!); }
  const img = sec.querySelector(".primary-image-box img");
  if (img && isUrl(f.image)) img.setAttribute("src", f.image!.trim());
  keepIcon(sec.querySelector(".badge-view-status"), f.preview_label);
  set(sec.querySelector(".efficiency-badge"), f.efficiency);
  set(sec.querySelector(".primary-image-box + p"), f.caption);
  return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
}

export interface WebsiteFaq {
  enabled?: boolean; badge?: string; title?: string; subtitle?: string;
  items?: { question?: string; answer?: string; icon?: string }[];
}

/** Keeps only FAQ rows that actually say something, so the website's question count follows the saved list. */
export function faqWanted(items?: WebsiteFaq["items"]): NonNullable<WebsiteFaq["items"]> {
  return (items || []).filter(it => it && (String(it.question || "").trim() || String(it.answer || "").trim()));
}

/** Reads the FAQ section (#homeFaq) from the template for editor defaults. */
export function readFaq(html: string): WebsiteFaq | null {
  if (typeof DOMParser === "undefined") return null;
  const sec = new DOMParser().parseFromString(html, "text/html").getElementById("homeFaq");
  if (!sec) return null;
  const c = guideClean;
  return {
    enabled: true,
    badge: c(sec.querySelector(".section-header .badge-pill")?.textContent),
    title: c(sec.querySelector(".section-header .section-title")?.textContent),
    subtitle: c(sec.querySelector(".section-header .section-subtitle")?.textContent),
    items: Array.from(sec.querySelectorAll(".accordion-item")).map(el => ({
      question: c(el.querySelector(".accordion-header-title > span:last-child")?.textContent),
      answer: c(el.querySelector(".accordion-inner")?.textContent), icon: "",
    })),
  };
}

/** Applies FAQ settings inside the existing accordion markup; blank fields keep template content. */
export function applyFaq(html: string, f: WebsiteFaq | null | undefined): string {
  if (!f || typeof f !== "object" || typeof DOMParser === "undefined" || !Object.keys(f).length) return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  const sec = doc.getElementById("homeFaq");
  if (!sec) return html;
  if (f.enabled === false) { sec.remove(); return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML; }
  const set = (el: Element | null, s?: string) => { if (el && typeof s === "string" && s.trim()) el.textContent = s.trim(); };
  set(sec.querySelector(".section-header .badge-pill"), f.badge);
  set(sec.querySelector(".section-header .section-title"), f.title);
  set(sec.querySelector(".section-header .section-subtitle"), f.subtitle);
  const wrapper = sec.querySelector(".accordion-wrapper");
  const found = Array.from(sec.querySelectorAll(".accordion-item"));
  const pattern = found[0] ? found[0].outerHTML : "";
  const wanted = Array.isArray(f.items) ? faqWanted(f.items) : null;
  if (wrapper && pattern && wanted) {
    found.slice(wanted.length).forEach(el => el.remove());
    while (wrapper.querySelectorAll(":scope > .accordion-item").length < wanted.length) wrapper.insertAdjacentHTML("beforeend", pattern);
  }
  const live = Array.from(sec.querySelectorAll(".accordion-item"));
  const rows: NonNullable<WebsiteFaq["items"]> = wanted ?? Array.from({ length: live.length }, () => ({}));
  rows.forEach((it, i) => {
    const el = live[i]; if (!el) return;
    const header = el.querySelector(".accordion-header");
    if (wanted) {
      el.classList.toggle("active", i === 0);
      if (header) header.id = `faq${i + 1}`;
    }
    set(el.querySelector(".accordion-header-title > span:last-child"), it.question);
    set(el.querySelector(".accordion-inner"), it.answer);
    const svg = el.querySelector(".icon-tag svg");
    if (svg && typeof it.icon === "string" && /^https?:\/\//i.test(it.icon.trim())) {
      const img = doc.createElement("img");
      img.src = it.icon.trim(); img.alt = ""; img.width = 18; img.height = 18; img.style.objectFit = "contain";
      svg.replaceWith(img);
    }
  });
  return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
}

export interface WebsiteFooterLink { text?: string; link?: string }
export interface WebsiteFooter {
  enabled?: boolean; logo?: string; brand_name?: string; brand_tagline?: string; description?: string;
  services_title?: string; services?: WebsiteFooterLink[];
  quick_title?: string; quick_links?: WebsiteFooterLink[];
  contact_title?: string; hq_label?: string; hq_text?: string; phone_label?: string; phone?: string;
  hours_label?: string; hours_text?: string; emergency_text?: string;
  copyright?: string; reference?: string;
}

const footClean = (s?: string | null) => (s || "").replace(/\s+/g, " ").trim();

/** Keeps only footer links that have text. */
export function footerLinksWanted(links?: WebsiteFooterLink[]): WebsiteFooterLink[] {
  return (links || []).filter(l => l && String(l.text || "").trim());
}

function footerCols(root: ParentNode) {
  const cols = Array.from(root.querySelectorAll(".footer-top > .footer-col"));
  return { services: cols[0] || null, quick: cols[1] || null, contact: cols[2] || null };
}

/** Reads the site footer from the template for editor defaults. */
export function readFooter(html: string): WebsiteFooter | null {
  if (typeof DOMParser === "undefined") return null;
  const f = new DOMParser().parseFromString(html, "text/html").querySelector("footer.site-footer");
  if (!f) return null;
  const c = footClean;
  const { services, quick, contact } = footerCols(f);
  const links = (col: Element | null) => Array.from(col?.querySelectorAll(".footer-links > a") || []).map(a => ({ text: c(a.textContent), link: a.getAttribute("href") || "" }));
  const items = Array.from(contact?.querySelectorAll(".footer-contact-item") || []);
  const body = (i: number) => items[i]?.querySelector(":scope > div");
  const afterStrong = (i: number) => { const d = body(i); if (!d) return ""; const cl = d.cloneNode(true) as Element; cl.querySelector("strong")?.remove(); cl.querySelectorAll("span,a").forEach(x => x.remove()); return c(cl.textContent); };
  const bottom = Array.from(f.querySelectorAll(".footer-bottom p"));
  return {
    enabled: true, logo: "",
    brand_name: c(f.querySelector(".footer-brand .logo-text h2")?.textContent),
    brand_tagline: c(f.querySelector(".footer-brand .logo-text span")?.textContent),
    description: c(f.querySelector(".footer-brand > p")?.textContent),
    services_title: c(services?.querySelector("h3")?.textContent), services: links(services),
    quick_title: c(quick?.querySelector("h3")?.textContent), quick_links: links(quick),
    contact_title: c(contact?.querySelector("h3")?.textContent),
    hq_label: c(body(0)?.querySelector("strong")?.textContent), hq_text: afterStrong(0),
    phone_label: c(body(1)?.querySelector("strong")?.textContent), phone: c(body(1)?.querySelector("a")?.textContent),
    hours_label: c(body(2)?.querySelector("strong")?.textContent), hours_text: afterStrong(2),
    emergency_text: c(body(2)?.querySelector("span")?.textContent),
    copyright: c(bottom[0]?.textContent), reference: c(bottom[1]?.textContent),
  };
}

/** Applies footer settings inside the existing footer markup on every page; blank fields keep template content. */
export function applyFooter(html: string, s: WebsiteFooter | null | undefined): string {
  if (!s || typeof s !== "object" || typeof DOMParser === "undefined" || !Object.keys(s).length) return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  const f = doc.querySelector("footer.site-footer");
  if (!f) return html;
  const out = () => "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
  if (s.enabled === false) { f.remove(); return out(); }
  const ok = (v?: string): v is string => typeof v === "string" && !!v.trim();
  const set = (el: Element | null | undefined, v?: string) => { if (el && ok(v)) el.textContent = v.trim(); };
  set(f.querySelector(".footer-brand .logo-text h2"), s.brand_name);
  set(f.querySelector(".footer-brand .logo-text span"), s.brand_tagline);
  set(f.querySelector(".footer-brand > p"), s.description);
  const icon = f.querySelector(".footer-brand .logo-icon");
  if (icon && ok(s.logo) && /^https?:\/\//i.test(s.logo.trim())) {
    icon.innerHTML = ""; const img = doc.createElement("img");
    img.src = s.logo.trim(); img.alt = ""; img.style.cssText = "width:100%;height:100%;object-fit:contain;"; icon.appendChild(img);
  }
  const { services, quick, contact } = footerCols(f);
  const applyLinks = (col: Element | null, title?: string, list?: WebsiteFooterLink[]) => {
    if (!col) return;
    set(col.querySelector("h3"), title);
    const box = col.querySelector(".footer-links");
    if (!box || !Array.isArray(list)) return;
    const orig = Array.from(box.querySelectorAll(":scope > a"));
    const icons = orig.map(a => a.querySelector("svg")?.outerHTML || "");
    box.innerHTML = "";
    footerLinksWanted(list).forEach((l, i) => {
      const a = doc.createElement("a");
      a.setAttribute("href", ok(l.link) ? l.link.trim() : "#");
      a.innerHTML = (icons[i] || icons[0] || "") + " ";
      a.appendChild(doc.createTextNode(String(l.text).trim()));
      box.appendChild(a);
    });
  };
  applyLinks(services, s.services_title, s.services);
  applyLinks(quick, s.quick_title, s.quick_links);
  if (contact) {
    set(contact.querySelector("h3"), s.contact_title);
    const items = Array.from(contact.querySelectorAll(".footer-contact-item > div"));
    const setLine = (d: Element | undefined, v?: string) => {
      if (!d || !ok(v)) return;
      const br = d.querySelector("br"); if (!br) return;
      let n = br.nextSibling; while (n && n.nodeType === 3) { const nx = n.nextSibling; n.remove(); n = nx; }
      br.after(doc.createTextNode("\n" + v.trim() + (d.querySelector("span") ? "" : "\n")));
    };
    set(items[0]?.querySelector("strong"), s.hq_label); setLine(items[0], s.hq_text);
    set(items[1]?.querySelector("strong"), s.phone_label);
    const pa = items[1]?.querySelector("a");
    if (pa && ok(s.phone)) { pa.textContent = s.phone.trim(); pa.setAttribute("href", "tel:" + s.phone.replace(/\D/g, "")); }
    set(items[2]?.querySelector("strong"), s.hours_label); setLine(items[2], s.hours_text);
    set(items[2]?.querySelector("span"), s.emergency_text);
  }
  const bottom = Array.from(f.querySelectorAll(".footer-bottom p"));
  set(bottom[0], s.copyright); set(bottom[1], s.reference);
  return out();
}

export interface WebsiteAboutBullet { label?: string; text?: string; icon?: string }
export interface WebsiteAboutCardItem { title?: string; text?: string; icon?: string }
export interface WebsiteAboutPledge { title?: string; text?: string; icon?: string }
export interface WebsiteAboutUs {
  enabled?: boolean;
  hero_badge?: string; hero_title?: string; hero_intro?: string;
  story_badge?: string; story_title?: string; story_p1?: string; story_p2?: string;
  story_bullets?: WebsiteAboutBullet[];
  card_title?: string;
  card_items?: WebsiteAboutCardItem[];
  pledges_badge?: string; pledges_title?: string; pledges_subtitle?: string;
  pledges?: WebsiteAboutPledge[];
}

/** Reads the About page (about.html) hero, story and pledges sections from the template for editor defaults. */
export function readAboutUs(html: string): WebsiteAboutUs | null {
  if (typeof DOMParser === "undefined") return null;
  const doc = new DOMParser().parseFromString(html, "text/html");
  const hero = doc.querySelector("section.page-hero");
  const main = doc.querySelector("main.section-navy");
  if (!hero && !main) return null;
  const c = guideClean;
  const story = main?.querySelector(".grid-2 > div:first-child");
  const card = main?.querySelector(".card-glowing-salmon");
  const paras = story ? Array.from(story.querySelectorAll(":scope > p")) : [];
  return {
    enabled: true,
    hero_badge: c(hero?.querySelector(".badge-pill")?.textContent),
    hero_title: c(hero?.querySelector("h1")?.textContent),
    hero_intro: c(hero?.querySelector("p")?.textContent),
    story_badge: c(story?.querySelector(".badge-pill")?.textContent),
    story_title: c(story?.querySelector("h2")?.textContent),
    story_p1: c(paras[0]?.textContent),
    story_p2: c(paras[1]?.textContent),
    story_bullets: story ? Array.from(story.querySelectorAll(".bullet-item")).map(li => {
      const label = c(li.querySelector("strong")?.textContent).replace(/:$/, "");
      const full = c(li.textContent);
      return { label, text: c(full.slice(full.indexOf(":") + 1)), icon: "" };
    }) : [],
    card_title: c(card?.querySelector("h3")?.textContent),
    card_items: card ? Array.from(card.querySelectorAll("h4")).map(h => ({
      title: c(h.textContent),
      text: c(h.parentElement?.querySelector("p")?.textContent),
      icon: "",
    })) : [],
    pledges_badge: c(main?.querySelector(".section-header .badge-pill")?.textContent),
    pledges_title: c(main?.querySelector(".section-header .section-title")?.textContent),
    pledges_subtitle: c(main?.querySelector(".section-header .section-subtitle")?.textContent),
    pledges: main ? Array.from(main.querySelectorAll(".accordion-item")).map(el => ({
      title: c(el.querySelector(".accordion-header-title > span:last-child")?.textContent),
      text: c(el.querySelector(".accordion-inner")?.textContent),
      icon: "",
    })) : [],
  };
}

/** Applies About page settings inside the existing about.html markup; blank fields keep template content. */
export function applyAboutUs(html: string, a: WebsiteAboutUs | null | undefined): string {
  if (!a || typeof a !== "object" || typeof DOMParser === "undefined" || !Object.keys(a).length) return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  const hero = doc.querySelector("section.page-hero");
  const main = doc.querySelector("main.section-navy");
  if (!hero && !main) return html;
  const out = () => "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
  if (a.enabled === false) { main?.remove(); return out(); }
  const ok = (s?: string) => (typeof s === "string" && s.trim() ? s.trim() : null);
  const set = (el: Element | null | undefined, s?: string) => { const v = ok(s); if (el && v) el.textContent = v; };
  const icon = (svg: Element | null | undefined, url?: string, size = 18) => {
    const v = ok(url);
    if (!svg || !v || !/^https?:\/\//i.test(v)) return;
    const img = doc.createElement("img");
    img.src = v; img.alt = ""; img.width = size; img.height = size; img.style.objectFit = "contain";
    svg.replaceWith(img);
  };
  if (hero) {
    set(hero.querySelector(".badge-pill"), a.hero_badge);
    set(hero.querySelector("h1"), a.hero_title);
    set(hero.querySelector("p"), a.hero_intro);
  }
  if (main) {
    const story = main.querySelector(".grid-2 > div:first-child");
    if (story) {
      set(story.querySelector(".badge-pill"), a.story_badge);
      set(story.querySelector("h2"), a.story_title);
      const paras = story.querySelectorAll(":scope > p");
      set(paras[0], a.story_p1);
      set(paras[1], a.story_p2);
      const items = story.querySelectorAll(".bullet-item");
      (a.story_bullets || []).forEach((b, i) => {
        const li = items[i]; if (!li || !b) return;
        const strong = li.querySelector("strong");
        if (strong && ok(b.label)) strong.textContent = ok(b.label)!.replace(/:?$/, ":");
        if (strong && ok(b.text)) { while (strong.nextSibling) strong.nextSibling.remove(); strong.after(doc.createTextNode(" " + ok(b.text))); }
        icon(li.querySelector(".bullet-icon svg"), b.icon);
      });
    }
    const card = main.querySelector(".card-glowing-salmon");
    if (card) {
      set(card.querySelector("h3"), a.card_title);
      const heads = card.querySelectorAll("h4");
      (a.card_items || []).forEach((it, i) => {
        const h = heads[i]; if (!h || !it) return;
        set(h, it.title);
        set(h.parentElement?.querySelector("p"), it.text);
        icon(h.parentElement?.parentElement?.querySelector(".trust-item-icon svg"), it.icon, 20);
      });
    }
    set(main.querySelector(".section-header .badge-pill"), a.pledges_badge);
    set(main.querySelector(".section-header .section-title"), a.pledges_title);
    set(main.querySelector(".section-header .section-subtitle"), a.pledges_subtitle);
    const acc = main.querySelectorAll(".accordion-item");
    (a.pledges || []).forEach((p, i) => {
      const el = acc[i]; if (!el || !p) return;
      set(el.querySelector(".accordion-header-title > span:last-child"), p.title);
      set(el.querySelector(".accordion-inner"), p.text);
      icon(el.querySelector(".icon-tag svg"), p.icon);
    });
  }
  return out();
}
