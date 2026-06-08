// Free US address validation via the US Census Bureau Geocoder
// Docs: https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.pdf
// No API key required, no documented rate limit for reasonable use.

export interface ValidatedAddress {
  address: string;      // "<number> <street>"
  city: string;
  state: string;        // 2-letter
  zip: string;
  matchedText: string;  // full matched address line returned by Census
  lat?: number;
  lon?: number;
}

interface CensusMatch {
  matchedAddress: string;
  coordinates?: { x: number; y: number };
  addressComponents: {
    fromAddress?: string;
    toAddress?: string;
    preQualifier?: string;
    preDirection?: string;
    preType?: string;
    streetName?: string;
    suffixType?: string;
    suffixDirection?: string;
    suffixQualifier?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
}

export async function validateUSAddress(
  oneLine: string,
): Promise<ValidatedAddress[]> {
  const url = new URL(
    "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress",
  );
  url.searchParams.set("address", oneLine);
  url.searchParams.set("benchmark", "Public_AR_Current");
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Geocoder error: ${res.status}`);
  const data = await res.json();
  const matches: CensusMatch[] = data?.result?.addressMatches ?? [];

  return matches.map((m) => {
    const c = m.addressComponents;
    const street = [
      c.fromAddress,
      c.preDirection,
      c.preType,
      c.streetName,
      c.suffixType,
      c.suffixDirection,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();
    return {
      address: street,
      city: c.city ?? "",
      state: c.state ?? "",
      zip: c.zip ?? "",
      matchedText: m.matchedAddress,
      lat: m.coordinates?.y,
      lon: m.coordinates?.x,
    };
  });
}
