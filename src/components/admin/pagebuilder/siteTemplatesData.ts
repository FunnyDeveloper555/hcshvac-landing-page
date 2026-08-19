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
      "Construction layout: rotating announcement topbar, marquee strip, full-bleed rounded hero slideshow, editorial banner and top products grid.",
    path: "/amerce-template/home-construction.html",
    tags: ["Marquee hero", "Dark topbar", "Top products"],
    usedBy: "bestcomforthvac.hcshvac.com",
  },
  {
    id: "home-organic",
    name: "Home Organic",
    description:
      "Light, airy layout with red accent palette, white footer, category chips and a popular products carousel. Friendly residential-service feel.",
    path: "/amerce-template/home-organic.html",
    tags: ["Light theme", "Popular products", "White footer"],
    usedBy: "blueflameheatingcooling.hcshvac.com",
  },
  {
    id: "home-office-equipment",
    name: "Home Office Equipment",
    description:
      "Business-forward layout: utility topbar, mega-menu navigation, banner grid and equipment-style product listings. Good fit for commercial service pages.",
    path: "/amerce-template/home-office-equipment.html",
    tags: ["Commercial", "Mega menu", "Banner grid"],
  },
  {
    id: "home-electronics",
    name: "Home Electronics",
    description:
      "Dense catalog layout with deal countdowns, category rail and multi-row product grids. Best when the company sells lots of equipment SKUs.",
    path: "/amerce-template/home-electronics.html",
    tags: ["Catalog", "Deals countdown", "Category rail"],
  },
  {
    id: "home-garden",
    name: "Home Garden",
    description:
      "Warm, image-led layout with large lifestyle hero, service highlight cards and testimonial band. Strong for residential seasonal maintenance offers.",
    path: "/amerce-template/home-garden.html",
    tags: ["Lifestyle hero", "Highlight cards", "Testimonials"],
  },
];

export const DEFAULT_SITE_TEMPLATE = "home-construction";

export const getSiteTemplate = (id?: string | null) =>
  SITE_TEMPLATES.find((t) => t.id === id) ?? SITE_TEMPLATES[0];
