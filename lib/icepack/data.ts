// IcePack domain data: product categories, storage profiles, ice calculation,
// and a tiny in-memory + localStorage trip store with useSyncExternalStore.

import { useSyncExternalStore } from "react";

export type StorageProfileKey = "ac" | "chilled" | "freezer" | "deep";

export interface StorageProfile {
  key: StorageProfileKey;
  label: string;
  range: string;
  tempMinC: number;
  tempMaxC: number;
  /** Reference daily ice consumption per kg of cargo, kg ice / kg cargo / day */
  iceFactor: number;
  /** Base melt rate kg/hr per 100kg ice in ambient ~28C */
  meltBase: number;
  /** Tailwind-safe semantic color token name */
  tone: "ice-cyan" | "ice-teal" | "sea-500" | "sea-900";
  note: string;
}

export const STORAGE_PROFILES: Record<StorageProfileKey, StorageProfile> = {
  ac: {
    key: "ac",
    label: "Air Conditioned",
    range: "16°C – 24°C",
    tempMinC: 16,
    tempMaxC: 24,
    iceFactor: 0.25,
    meltBase: 1.2,
    tone: "ice-cyan",
    note: "Climate-controlled stable transport for dry-sensitive goods.",
  },
  chilled: {
    key: "chilled",
    label: "Chilled",
    range: "1°C – 14°C",
    tempMinC: 1,
    tempMaxC: 14,
    iceFactor: 0.6,
    meltBase: 2.4,
    tone: "ice-teal",
    note: "Standard cold chain for fresh perishables.",
  },
  freezer: {
    key: "freezer",
    label: "Freezer",
    range: "-12°C to -24°C",
    tempMinC: -24,
    tempMaxC: -12,
    iceFactor: 1.1,
    meltBase: 3.2,
    tone: "sea-500",
    note: "Frozen storage for proteins and marine products.",
  },
  deep: {
    key: "deep",
    label: "Deep Freeze",
    range: "-30°C or lower",
    tempMinC: -40,
    tempMaxC: -30,
    iceFactor: 1.6,
    meltBase: 4.1,
    tone: "sea-900",
    note: "Ultra-low cold chain for sensitive pharmaceuticals.",
  },
};

export interface ProductCategory {
  id: string;
  label: string;
  icon: string;
  profile: StorageProfileKey;
  description: string;
}

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  { id: "fresh-fish", label: "Fresh Fish", icon: "🐟", profile: "chilled", description: "Whole fish, fillets" },
  { id: "seafood", label: "Seafood", icon: "🦐", profile: "freezer", description: "Shrimp, shellfish" },
  { id: "fresh-meat", label: "Fresh Meat", icon: "🥩", profile: "freezer", description: "Beef, pork, lamb" },
  { id: "poultry", label: "Poultry", icon: "🍗", profile: "chilled", description: "Short term chilled" },
  { id: "dairy", label: "Dairy", icon: "🥛", profile: "chilled", description: "Milk, cheese, yogurt" },
  { id: "vegetables", label: "Vegetables", icon: "🥬", profile: "ac", description: "Leafy & root produce" },
  { id: "pharma", label: "Pharmaceuticals", icon: "💊", profile: "deep", description: "Vaccines, biologics" },
];

export type TripStatus = "planned" | "active" | "completed";
export type RiskLevel = "safe" | "warning" | "critical";

export interface Trip {
  id: string;
  name: string;
  productId: string;
  cargoKg: number;
  durationHours: number;
  container: string;
  recommendedIceKg: number;
  iceRemainingKg: number;
  meltRateKgPerHr: number;
  safeDurationHours: number;
  status: TripStatus;
  startedAt: number | null;
  completedAt: number | null;
  createdAt: number;
  groupId?: string;
  groupName?: string;
}

export interface CalcOutput {
  recommendedIceKg: number;
  meltRateKgPerHr: number;
  safeDurationHours: number;
}

export function calculateIce(
  cargoKg: number,
  durationHours: number,
  profile: StorageProfile,
): CalcOutput {
  if (!cargoKg || !durationHours) {
    return { recommendedIceKg: 0, meltRateKgPerHr: 0, safeDurationHours: 0 };
  }
  const baseDaily = cargoKg * profile.iceFactor; // kg ice per day reference
  const recommendedIceKg = Math.max(
    cargoKg * profile.iceFactor * (durationHours / 24) * 1.25,
    baseDaily * 0.4,
  );
  const meltRateKgPerHr = (recommendedIceKg / 100) * profile.meltBase;
  const safeDurationHours = recommendedIceKg / Math.max(meltRateKgPerHr, 0.1);
  return {
    recommendedIceKg: round(recommendedIceKg),
    meltRateKgPerHr: round(meltRateKgPerHr),
    safeDurationHours: round(safeDurationHours),
  };
}

function round(n: number) {
  return Math.round(n * 10) / 10;
}

export function getProduct(id: string) {
  return PRODUCT_CATEGORIES.find((p) => p.id === id) ?? PRODUCT_CATEGORIES[0];
}
export function getProfileFor(productId: string) {
  return STORAGE_PROFILES[getProduct(productId).profile];
}

export function elapsedHoursFor(trip: Trip): number {
  if (!trip.startedAt) return 0;
  const end = trip.completedAt ?? Date.now();
  return (end - trip.startedAt) / 36e5;
}

export function liveStateFor(trip: Trip) {
  const elapsed = elapsedHoursFor(trip);
  const consumed = Math.min(trip.iceRemainingKg, elapsed * trip.meltRateKgPerHr);
  const ice = Math.max(0, trip.iceRemainingKg - consumed);
  const pct = trip.recommendedIceKg > 0 ? (ice / trip.recommendedIceKg) * 100 : 0;
  const freshness = Math.max(0, Math.min(100, 100 - (elapsed / trip.safeDurationHours) * 30));
  let risk: RiskLevel = "safe";
  if (pct < 15 || elapsed > trip.safeDurationHours * 0.9) risk = "critical";
  else if (pct < 35 || elapsed > trip.safeDurationHours * 0.65) risk = "warning";
  return {
    iceRemainingKg: round(ice),
    pctRemaining: Math.round(pct),
    elapsedHours: round(elapsed),
    freshness: Math.round(freshness),
    risk,
  };
}

// ---------- Store ----------

const STORAGE_KEY = "icepack.trips.v1";

function seed(): Trip[] {
  const now = Date.now();
  return [
    {
      id: "trip-tuna-842",
      name: "Tuna Run #842",
      productId: "fresh-fish",
      cargoKg: 180,
      durationHours: 22,
      container: "Insulated Box 1000L",
      recommendedIceKg: 120,
      iceRemainingKg: 120,
      meltRateKgPerHr: 3.4,
      safeDurationHours: 24,
      status: "active",
      startedAt: now - 1000 * 60 * 60 * 9,
      completedAt: null,
      createdAt: now - 1000 * 60 * 60 * 10,
    },
    {
      id: "trip-pharma-04",
      name: "Pharma Transfer",
      productId: "pharma",
      cargoKg: 40,
      durationHours: 6,
      container: "Cold Box 200L",
      recommendedIceKg: 35,
      iceRemainingKg: 35,
      meltRateKgPerHr: 1.6,
      safeDurationHours: 8,
      status: "active",
      startedAt: now - 1000 * 60 * 60 * 7,
      completedAt: null,
      createdAt: now - 1000 * 60 * 60 * 8,
    },
    {
      id: "trip-dairy-coast",
      name: "Dairy Route Alpha",
      productId: "dairy",
      cargoKg: 90,
      durationHours: 18,
      container: "Reefer Pallet",
      recommendedIceKg: 60,
      iceRemainingKg: 60,
      meltRateKgPerHr: 2.1,
      safeDurationHours: 22,
      status: "active",
      startedAt: now - 1000 * 60 * 60 * 4,
      completedAt: null,
      createdAt: now - 1000 * 60 * 60 * 5,
    },
    {
      id: "trip-shellfish",
      name: "Shellfish Bulk",
      productId: "seafood",
      cargoKg: 110,
      durationHours: 14,
      container: "Insulated Tote",
      recommendedIceKg: 95,
      iceRemainingKg: 95,
      meltRateKgPerHr: 3.0,
      safeDurationHours: 18,
      status: "planned",
      startedAt: null,
      completedAt: null,
      createdAt: now - 1000 * 60 * 60 * 1,
    },
    {
      id: "trip-veg-12",
      name: "Greens Delivery 12",
      productId: "vegetables",
      cargoKg: 60,
      durationHours: 8,
      container: "Vented Crate",
      recommendedIceKg: 18,
      iceRemainingKg: 0,
      meltRateKgPerHr: 0.9,
      safeDurationHours: 12,
      status: "completed",
      startedAt: now - 1000 * 60 * 60 * 30,
      completedAt: now - 1000 * 60 * 60 * 20,
      createdAt: now - 1000 * 60 * 60 * 32,
    },
  ];
}

let trips: Trip[] = [];
const listeners = new Set<() => void>();
let hydrated = false;

function hydrate() {
  if (hydrated) return;
  hydrated = true;
  if (typeof window === "undefined") {
    trips = seed();
    return;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      trips = JSON.parse(raw) as Trip[];
    } else {
      trips = seed();
      persist();
    }
  } catch {
    trips = seed();
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  } catch {}
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  hydrate();
  listeners.add(l);
  return () => listeners.delete(l);
}

function getSnapshot() {
  hydrate();
  return trips;
}

function getServerSnapshot() {
  return [] as Trip[];
}

export function useTrips() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useTrip(id: string | undefined) {
  const all = useTrips();
  return all.find((t) => t.id === id);
}

export const tripStore = {
  list(): Trip[] {
    hydrate();
    return trips;
  },
  add(partial: Omit<Trip, "id" | "createdAt" | "status" | "startedAt" | "completedAt" | "iceRemainingKg"> & { status?: TripStatus }) {
    hydrate();
    const id = `trip-${Math.random().toString(36).slice(2, 9)}`;
    const trip: Trip = {
      ...partial,
      id,
      createdAt: Date.now(),
      status: partial.status ?? "planned",
      startedAt: null,
      completedAt: null,
      iceRemainingKg: partial.recommendedIceKg,
    };
    trips = [trip, ...trips];
    persist();
    emit();
    return trip;
  },
  start(id: string) {
    trips = trips.map((t) =>
      t.id === id ? { ...t, status: "active" as const, startedAt: Date.now() } : t,
    );
    persist();
    emit();
  },
  startMany(ids: string[], groupName?: string) {
    const set = new Set(ids);
    const now = Date.now();
    const useGroup = ids.length > 1;
    const groupId = useGroup ? `grp-${now.toString(36)}` : undefined;
    const existingGroupNames = new Set(
      trips.map((t) => t.groupName).filter(Boolean) as string[],
    );
    let finalName = groupName?.trim();
    if (useGroup && !finalName) {
      let n = 1;
      while (existingGroupNames.has(`Convoy ${n}`)) n++;
      finalName = `Convoy ${n}`;
    }
    trips = trips.map((t) =>
      set.has(t.id) && t.status === "planned"
        ? {
            ...t,
            status: "active" as const,
            startedAt: now,
            groupId: useGroup ? groupId : t.groupId,
            groupName: useGroup ? finalName : t.groupName,
          }
        : t,
    );
    persist();
    emit();
  },
  complete(id: string) {
    trips = trips.map((t) =>
      t.id === id
        ? { ...t, status: "completed" as const, completedAt: Date.now(), iceRemainingKg: 0 }
        : t,
    );
    persist();
    emit();
  },
  reset() {
    trips = seed();
    persist();
    emit();
  },
  clear() {
    trips = [];
    persist();
    emit();
  },
};

export function formatHours(h: number) {
  if (h <= 0) return "0h";
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  if (hh === 0) return `${mm}m`;
  if (mm === 0) return `${hh}h`;
  return `${hh}h ${mm}m`;
}
