export function trustedTwilioMedia(raw: string, account: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && url.hostname === "api.twilio.com" && !url.username && !url.password &&
      new RegExp(`^/2010-04-01/Accounts/${account}/Messages/[A-Z]{2}[a-f0-9]{32}/Media/ME[a-f0-9]{32}$`).test(url.pathname);
  } catch { return false; }
}

export async function downloadMedia(raw: string, account: string, token: string): Promise<Blob> {
  if (!trustedTwilioMedia(raw, account)) throw new Error("Invalid photo source");
  let url = raw;
  for (let hop = 0; hop < 4; hop++) {
    const target = new URL(url);
    const headers = target.hostname === "api.twilio.com" ? { Authorization: `Basic ${btoa(`${account}:${token}`)}` } : undefined;
    const response = await fetch(url, { headers, redirect: "manual", signal: AbortSignal.timeout(15000) });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Missing photo redirect");
      const next = new URL(location, url);
      if (next.protocol !== "https:" || next.username || next.password ||
        !(next.hostname.endsWith(".twilio.com") || next.hostname.endsWith(".amazonaws.com"))) {
        throw new Error("Invalid photo redirect");
      }
      // Credentials are only ever sent to the original, validated API resource.
      if (next.hostname === "api.twilio.com" && !trustedTwilioMedia(next.href, account)) throw new Error("Invalid photo source");
      url = next.href;
      await response.body?.cancel();
      continue;
    }
    if (!response.ok) throw new Error(`Photo retrieval failed (${response.status})`);
    const limit = 10 * 1024 * 1024;
    if (Number(response.headers.get("content-length")) > limit) {
      await response.body?.cancel();
      throw new Error("Photo exceeds download limit");
    }
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Photo is empty");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new Error("Photo exceeds download limit"); }
      chunks.push(value);
    }
    return new Blob(chunks, { type: response.headers.get("content-type") || "application/octet-stream" });
  }
  throw new Error("Too many photo redirects");
}