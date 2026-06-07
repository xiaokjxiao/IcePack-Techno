import type { RoutingProvider, RoutingRequest } from "../types";

const GEOAPIFY_BASE = "https://api.geoapify.com/v1/routing";

const MODES = [
  { id: "light_truck", label: "Light Truck" },
  { id: "medium_truck", label: "Medium Truck" },
  { id: "heavy_truck", label: "Heavy Truck" },
];

function getApiKey(): string {
  const key = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY;
  if (!key) {
    throw new Error(
      "Geoapify API key not configured. Add EXPO_PUBLIC_GEOAPIFY_API_KEY to your .env file.",
    );
  }
  return key;
}

function resolveMode(requestMode?: string): string {
  return requestMode || process.env.EXPO_PUBLIC_GEOAPIFY_ROUTING_MODE || "truck";
}

interface GeoapifyRouteResponse {
  type: string;
  features?: {
    properties: {
      mode: string;
      distance: number;
      time: number;
    };
  }[];
  message?: string;
}

async function fetchTravelTime(req: RoutingRequest): Promise<number> {
  const { originLat, originLng, destLat, destLng, signal } = req;

  const params = new URLSearchParams({
    waypoints: `${originLat},${originLng}|${destLat},${destLng}`,
    mode: resolveMode(req.mode),
    apiKey: getApiKey(),
  });

  const res = await fetch(`${GEOAPIFY_BASE}?${params}`, { signal });
  if (!res.ok) {
    throw new Error(`Geoapify API error: ${res.status}`);
  }

  const data: GeoapifyRouteResponse = await res.json();

  if (!data.features || data.features.length === 0) {
    throw new Error(data.message ?? "No route found between locations");
  }

  const durationSeconds = data.features[0].properties.time;
  return Number((durationSeconds / 3600).toFixed(1));
}

export const geoapifyProvider: RoutingProvider = {
  id: "geoapify",
  label: "Geoapify",
  defaultMode: "truck",
  modes: MODES,
  getTravelTimeHours: fetchTravelTime,
};
