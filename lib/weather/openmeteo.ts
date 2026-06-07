const OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast";

interface OpenMeteoCurrentResponse {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    apparent_temperature?: number;
  };
  error?: boolean;
  reason?: string;
}

async function fetchPointWeather(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<{ tempC: number; humidityPct: number; heatIndexC: number } | null> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature",
    timezone: "auto",
  });

  const res = await fetch(`${OPEN_METEO_BASE}?${params}`, { signal });
  if (!res.ok) return null;

  const data: OpenMeteoCurrentResponse = await res.json();
  if (data.error || !data.current) return null;

  return {
    tempC: data.current.temperature_2m ?? 0,
    humidityPct: data.current.relative_humidity_2m ?? 50,
    heatIndexC: data.current.apparent_temperature ?? data.current.temperature_2m ?? 0,
  };
}

export interface RouteWeather {
  avgTempC: number;
  avgHumidityPct: number;
  avgHeatIndexC: number;
}

export async function fetchRouteWeather(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  signal?: AbortSignal,
): Promise<RouteWeather | null> {
  try {
    const [origin, dest] = await Promise.all([
      fetchPointWeather(originLat, originLng, signal),
      fetchPointWeather(destLat, destLng, signal),
    ]);

    if (!origin && !dest) return null;

    const o = origin ?? dest!;
    const d = dest ?? origin!;

    return {
      avgTempC: round((o.tempC + d.tempC) / 2),
      avgHumidityPct: Math.round((o.humidityPct + d.humidityPct) / 2),
      avgHeatIndexC: round((o.heatIndexC + d.heatIndexC) / 2),
    };
  } catch {
    return null;
  }
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
