// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { readServicesPage, applyServicesPage } from "../src/lib/blueFlameServicesPage";

const html = readFileSync("public/blueflame-site/services.html", "utf8");

describe("Service Page template", () => {
  it("reads every section from the template", () => {
    const t = readServicesPage(html);
    expect(Object.keys(t)).toHaveLength(10);
    expect(t["page-heading"].title).toBe("Expert Heating, Cooling & Hydronics Across Chicagoland");
    expect(t["coupons"].cards?.[0].code).toBe("SAVE50");
    expect(t["service-packages"].cards?.[0].price).toBe("Starting at $199");
  });
  it("applies edits and hides disabled sections", () => {
    const out = applyServicesPage(html, { coupons: { cards: [{ code: "NEW25" }] }, "equipment-types": { enabled: false } });
    const t = readServicesPage(out);
    expect(t["coupons"].cards?.[0].code).toBe("NEW25");
    expect(t["equipment-types"]).toBeUndefined();
  });
});
