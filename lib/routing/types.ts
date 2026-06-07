export interface RoutingRequest {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  signal?: AbortSignal;
  mode?: string;
}

export interface RoutingProvider {
  readonly id: string;
  readonly label: string;
  readonly defaultMode: string;
  readonly modes: { id: string; label: string }[];
  getTravelTimeHours(req: RoutingRequest): Promise<number>;
}
