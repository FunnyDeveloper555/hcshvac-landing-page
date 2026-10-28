import { test } from "node:test";
import assert from "node:assert/strict";
import { blueFlameWebsiteDestination } from "../src/lib/blueFlameWebsite";

test("both requested Blue Flame domains load the original uploaded home document", () => {
  for (const hostname of ["www.blueflameheatingcooling.com", "blueflameheatingcooling.hcshvac.com"]) {
    assert.equal(blueFlameWebsiteDestination(hostname, "/"), "/blueflame-site/index.html");
  }
});

test("other company websites and CRM paths are not replaced by the upload", () => {
  assert.equal(blueFlameWebsiteDestination("bestcomforthvac.hcshvac.com", "/"), null);
  assert.equal(blueFlameWebsiteDestination("pozitivehvac.hcshvac.com", "/"), null);
  assert.equal(blueFlameWebsiteDestination("www.blueflameheatingcooling.com", "/admin/chat"), null);
  assert.equal(blueFlameWebsiteDestination("blueflameheatingcooling.hcshvac.com", "/book/example-token"), null);
});

test("Blue Flame preview and original page links load the static site without redirect loops", () => {
  assert.equal(blueFlameWebsiteDestination("localhost", "/company/blueflameheatingcooling"), "/blueflame-site/index.html");
  assert.equal(blueFlameWebsiteDestination("blueflameheatingcooling.com", "/products.html"), "/blueflame-site/products.html");
  assert.equal(blueFlameWebsiteDestination("blueflameheatingcooling.com", "/blueflame-site/index.html"), null);
});