import { test } from "node:test";
import assert from "node:assert/strict";
import { blueFlameWebsiteDestination, blueFlameInPlacePage, faqWanted, rewriteBlueFlameAssets } from "../src/lib/blueFlameWebsite";

test("Blue Flame domains show index.html at the root without redirecting", () => {
  for (const h of ["blueflameheatingcooling.com", "www.blueflameheatingcooling.com", "blueflameheatingcooling.hcshvac.com"]) {
    assert.equal(blueFlameInPlacePage(h, "/"), "/blueflame-site/index.html");
    assert.equal(blueFlameWebsiteDestination(h, "/"), null);
  }
  assert.equal(blueFlameInPlacePage("blueflameheatingcooling.com", "/products.html"), "/blueflame-site/products.html");
});

test("other companies and CRM paths are untouched", () => {
  assert.equal(blueFlameInPlacePage("bestcomforthvac.hcshvac.com", "/"), null);
  assert.equal(blueFlameInPlacePage("blueflameheatingcooling.com", "/admin/chat"), null);
  assert.equal(blueFlameInPlacePage("blueflameheatingcooling.hcshvac.com", "/book/x"), null);
});

test("asset paths resolve from the domain root", () => {
  assert.equal(rewriteBlueFlameAssets('<link href="assets/css/style.css"><a href="about.html">'),
    '<link href="/blueflame-site/assets/css/style.css"><a href="about.html">');
});
