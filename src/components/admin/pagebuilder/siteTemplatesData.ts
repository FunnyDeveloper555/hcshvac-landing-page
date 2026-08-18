export interface SiteTemplate {
  id: string;
  name: string;
  description: string;
  path: string;
  tags: string[];
  usedBy?: string;
}

export const SITE_TEMPLATES: SiteTemplate[] = [
  {
    id: "home-construction",
    name: "Home Construction",
    description:
      "Amerce construction layout: rotating announcement topbar, marquee strip, full-bleed rounded hero slideshow, editorial banner and top products grid.",
    path: "/amerce-template/home-construction.html",
    tags: ["Amerce", "Marquee hero", "Dark topbar", "Top products"],
    usedBy: "bestcomforthvac.hcshvac.com",
  },
];

export const DEFAULT_SITE_TEMPLATE = "home-construction";

export const getSiteTemplate = (id?: string | null) =>
  SITE_TEMPLATES.find((t) => t.id === id) ?? SITE_TEMPLATES[0];
