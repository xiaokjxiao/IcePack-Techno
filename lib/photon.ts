const PHOTON_BASE = "https://photon.komoot.io/api";

export interface PhotonFeature {
  geometry: { coordinates: [number, number]; type: "Point" };
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    state?: string;
    country?: string;
    osm_type?: string;
    osm_id?: number;
    osm_key?: string;
    osm_value?: string;
    extent?: [number, number, number, number];
  };
}

export interface PhotonResult {
  features: PhotonFeature[];
}

export async function searchPhoton(
  query: string,
  opts?: { limit?: number; lang?: string },
): Promise<PhotonFeature[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    q: query.trim(),
    limit: String(opts?.limit ?? 5),
    lang: opts?.lang ?? "en",
  });

  const res = await fetch(`${PHOTON_BASE}?${params}`);
  if (!res.ok) {
    throw new Error(`Photon API error: ${res.status}`);
  }

  const data: PhotonResult = await res.json();
  return data.features ?? [];
}

export function formatPhotonName(feature: PhotonFeature): string {
  const p = feature.properties;
  const parts: string[] = [];
  if (p.name) parts.push(p.name);
  if (p.street && p.street !== p.name) parts.push(p.street);
  if (p.city) parts.push(p.city);
  if (p.state && p.state !== p.city) parts.push(p.state);
  if (p.country) parts.push(p.country);
  return parts.join(", ");
}
