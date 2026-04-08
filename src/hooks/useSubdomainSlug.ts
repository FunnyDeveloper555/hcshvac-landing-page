/**
 * Detects if the current hostname is a company subdomain of hcshvac.com
 * e.g. bestcomforthvac.hcshvac.com → "bestcomforthvac"
 * Returns null if on the main domain or a non-matching host.
 */
export function getSubdomainSlug(): string | null {
  const hostname = window.location.hostname;

  // Match *.hcshvac.com but not www.hcshvac.com or bare hcshvac.com
  const match = hostname.match(/^([a-z0-9-]+)\.hcshvac\.com$/i);
  if (match && match[1].toLowerCase() !== "www") {
    return match[1].toLowerCase();
  }

  return null;
}
