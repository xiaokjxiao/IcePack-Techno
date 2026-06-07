import type { RoutingProvider } from "./types";
import { geoapifyProvider } from "./providers/geoapify";

const providers: Record<string, RoutingProvider> = {
  geoapify: geoapifyProvider,
};

const DEFAULT_PROVIDER = "geoapify";

function getProvider(): RoutingProvider {
  const id = process.env.EXPO_PUBLIC_ROUTING_PROVIDER || DEFAULT_PROVIDER;
  const provider = providers[id];
  if (!provider) {
    const available = Object.keys(providers).join(", ");
    throw new Error(
      `Unknown routing provider "${id}". Available: ${available}. Check EXPO_PUBLIC_ROUTING_PROVIDER in your .env file.`,
    );
  }
  return provider;
}

export function getRoutingModes(): { id: string; label: string }[] {
  return getProvider().modes;
}

export function getDefaultRoutingMode(): string {
  return getProvider().defaultMode;
}

export async function getTravelTimeHours(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  signal?: AbortSignal,
  mode?: string,
): Promise<number> {
  const provider = getProvider();
  return provider.getTravelTimeHours({
    originLat,
    originLng,
    destLat,
    destLng,
    signal,
    mode,
  });
}
