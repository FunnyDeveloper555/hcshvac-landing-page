import { test } from "node:test";
import assert from "node:assert/strict";
import { downloadMedia, trustedTwilioMedia } from "../supabase/functions/chat-media/media";

const account = "AC" + "a".repeat(32);
const url = `https://api.twilio.com/2010-04-01/Accounts/${account}/Messages/MM${"b".repeat(32)}/Media/ME${"c".repeat(32)}`;

test("photo credentials are restricted to this account's Twilio media resources", () => {
  assert.equal(trustedTwilioMedia(url, account), true);
  assert.equal(trustedTwilioMedia(url.replace(account, "AC" + "d".repeat(32)), account), false);
  assert.equal(trustedTwilioMedia(url.replace("api.twilio.com", "api.twilio.com.evil.com"), account), false);
  assert.equal(trustedTwilioMedia(url.replace("https:", "http:"), account), false);
  assert.equal(trustedTwilioMedia(url.replace("/Media/", "/"), account), false);
});

test("photo downloads authenticate with Twilio but never forward credentials to redirected storage", async () => {
  const original = globalThis.fetch;
  const calls: Array<{ url: string; auth: string | null }> = [];
  globalThis.fetch = async (input, init) => {
    calls.push({ url: String(input), auth: new Headers(init?.headers).get("Authorization") });
    return calls.length === 1
      ? new Response(null, { status: 302, headers: { location: "https://media.twilio.com/photo" } })
      : new Response(new Uint8Array([1, 2, 3]), { headers: { "content-type": "image/jpeg" } });
  };
  try {
    const blob = await downloadMedia(url, account, "test-token");
    assert.equal(blob.size, 3);
    assert.equal(blob.type, "image/jpeg");
    assert.equal(calls[0].auth, `Basic ${btoa(`${account}:test-token`)}`);
    assert.equal(calls[1].auth, null);
  } finally { globalThis.fetch = original; }
});