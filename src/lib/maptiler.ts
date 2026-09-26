/** MapTiler (free tier) — sharp streets tiles + campus geocoding. */

export function getMapTilerKey(): string | undefined {
  const key = process.env.NEXT_PUBLIC_MAPTILER_KEY?.trim();
  return key || undefined;
}

export function hasMapTilerKey(): boolean {
  return Boolean(getMapTilerKey());
}

/** Leaflet raster layer config for MapTiler Streets (retina-aware). */
export function mapTilerStreetsUrl(key: string): string {
  return `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}@2x.png?key=${encodeURIComponent(key)}`;
}

export type GeocodeResult = {
  lat: number;
  lng: number;
  placeName: string;
};

const memoryCache = new Map<string, GeocodeResult | null>();

/**
 * Geocode a university / institution to coordinates via MapTiler.
 * Results are cached in memory + sessionStorage for the browser session.
 */
export async function geocodeInstitution(
  institution: string,
  stateCode: string,
  stateName: string,
  key: string,
): Promise<GeocodeResult | null> {
  const q = institution.trim();
  if (!q) return null;

  const cacheKey = `maptiler-geo:v1:${stateCode}:${q.toLowerCase()}`;
  if (memoryCache.has(cacheKey)) return memoryCache.get(cacheKey) ?? null;

  try {
    const cached =
      typeof sessionStorage !== "undefined"
        ? sessionStorage.getItem(cacheKey)
        : null;
    if (cached) {
      const parsed = JSON.parse(cached) as GeocodeResult | null;
      memoryCache.set(cacheKey, parsed);
      return parsed;
    }
  } catch {
    /* ignore */
  }

  const query = encodeURIComponent(`${q}, ${stateName}, United States`);
  const url = `https://api.maptiler.com/geocoding/${query}.json?key=${encodeURIComponent(key)}&limit=3&country=us&types=poi,municipality,place,address`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      memoryCache.set(cacheKey, null);
      return null;
    }
    const data = (await res.json()) as {
      features?: Array<{
        center?: [number, number];
        place_name?: string;
        text?: string;
        place_type?: string[];
      }>;
    };

    const features = data.features ?? [];
    // Prefer POI / university-like hits
    const best =
      features.find((f) =>
        (f.place_type ?? []).some((t) => t === "poi" || t === "college"),
      ) ??
      features.find((f) =>
        /university|college|institute|school/i.test(
          `${f.place_name ?? ""} ${f.text ?? ""}`,
        ),
      ) ??
      features[0];

    if (!best?.center || best.center.length < 2) {
      memoryCache.set(cacheKey, null);
      return null;
    }

    const result: GeocodeResult = {
      lng: best.center[0],
      lat: best.center[1],
      placeName: best.place_name ?? q,
    };
    memoryCache.set(cacheKey, result);
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(result));
    } catch {
      /* ignore quota */
    }
    return result;
  } catch {
    memoryCache.set(cacheKey, null);
    return null;
  }
}
