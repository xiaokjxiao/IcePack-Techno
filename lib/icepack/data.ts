// IcePack domain data: product categories, storage profiles, ice calculation.

import type { Database } from "@/lib/database.types";

export type CargoCategory = Database["public"]["Enums"]["cargo_category_enum"];
export type ContainerType = Database["public"]["Enums"]["container_type_enum"];

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
    range: "16°C to 24°C",
    tempMinC: 16,
    tempMaxC: 24,
    iceFactor: 0.15,
    meltBase: 0.8,
    tone: "ice-cyan",
    note: "Air‑conditioned storage for produce, confectionery, some dairy powders and electronics requiring mild climate control.",
  },
  chilled: {
    key: "chilled",
    label: "Chilled",
    range: "1°C to 14°C",
    tempMinC: 1,
    tempMaxC: 14,
    iceFactor: 0.6,
    meltBase: 2.4,
    tone: "ice-teal",
    note: "Chilled storage for fresh milk, cheeses, yogurts, fresh meat/poultry (short term), fresh fish, vegetables and other perishables.",
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
    note: "Freezer storage for meats, frozen seafood, frozen produce and many long‑term frozen items; used for export-grade frozen goods.",
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
    note: "Ultra-low temperatures for pharmaceuticals, vaccines, and highly temperature‑sensitive biotech products.",
  },
};

export interface ProductCategory {
  id: CargoCategory;
  label: string;
  icon: string;
  profile: StorageProfileKey;
  description: string;
}

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    id: "meat",
    label: "Meat & Processed Meat",
    icon: "🥩",
    profile: "freezer",
    description:
      "Imported meat for further processing; local dressed chicken; processed meat products for retail",
  },
  {
    id: "fish_aquaculture",
    label: "Fish & Aquaculture Products",
    icon: "🐟",
    profile: "chilled",
    description:
      "Tuna, sardines, shrimp, prawns, squid, mackerel, and other seafood",
  },
  {
    id: "dairy",
    label: "Dairy Products",
    icon: "🥛",
    profile: "chilled",
    description: "Ice cream, cheese, yoghurt, milk",
  },
  {
    id: "fruits_vegetables",
    label: "Fruits & Vegetables",
    icon: "🥬",
    profile: "ac",
    description:
      "Bananas, pineapples, mangoes, papayas, potatoes, onions, garlic, carrots, apples, grapes, pears, oranges, kiwi, and frozen vegetables",
  },
  {
    id: "other_food",
    label: "Other Food Items",
    icon: "🍱",
    profile: "chilled",
    description:
      "Frozen dough, cakes, bakery products, raw materials for quick service restaurants (QSRs)",
  },
  {
    id: "pharma",
    label: "Pharmaceuticals",
    icon: "💊",
    profile: "deep",
    description:
      "Vaccines, biologics, temperature-sensitive drugs requiring ultra-low cold chain",
  },
  {
    id: "electronics",
    label: "Electronics",
    icon: "🖥️",
    profile: "ac",
    description:
      "Computers, components, and sensitive equipment requiring climate-controlled transport",
  },
  {
    id: "cosmetics",
    label: "Cosmetics",
    icon: "🧴",
    profile: "chilled",
    description:
      "Skincare, makeup, and beauty products requiring cool chain stability",
  },
  {
    id: "agricultural_products",
    label: "Agricultural Products",
    icon: "🌾",
    profile: "chilled",
    description:
      "Fresh produce, flowers, seeds, and other agricultural commodities",
  },
];

export const CONTAINER_TYPES: ContainerType[] = [
  "reefer_container",
  "insulated_container",
  "blast_freezer_container",
  "pharma_container",
  "modular_cold_box",
  "ice_chilled_carrier",
];

export type TripStatus = Database["public"]["Enums"]["trip_status_enum"];
export type RiskLevel = "safe" | "warning" | "critical";

// Database-aligned shipment record
export interface Shipment {
  id: number;
  shipmentName: string;
  cargoCategory: CargoCategory;
  cargoKg: number;
  containerType: ContainerType;
  durationHours: number;
  targetTempMinC: number | null;
  targetTempMaxC: number | null;
  originLocation: string | null;
  destinationLocation: string | null;
  notes: string | null;
  convoyId: string | null;
  createdAt: string;
}

// Database-aligned trip record
export interface TripRow {
  id: number;
  shipmentId: number;
  status: TripStatus;
  recommendedIceKg: number;
  iceRemainingKg: number;
  meltRateKgPerHr: number;
  safeDurationHours: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Combined view model used by the current UI layer
export interface Trip {
  id: number;
  name: string;
  productId: CargoCategory;
  cargoKg: number;
  durationHours: number;
  container: ContainerType;
  recommendedIceKg: number;
  iceRemainingKg: number;
  meltRateKgPerHr: number;
  safeDurationHours: number;
  status: TripStatus;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
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

export function getProduct(id: string): ProductCategory {
  return PRODUCT_CATEGORIES.find((p) => p.id === id) ?? PRODUCT_CATEGORIES[0];
}
export function getProfileFor(productId: string) {
  return STORAGE_PROFILES[getProduct(productId).profile];
}

export function elapsedHoursFor(trip: Trip): number {
  if (!trip.startedAt) return 0;
  const start = new Date(trip.startedAt).getTime();
  const end = trip.completedAt
    ? new Date(trip.completedAt).getTime()
    : Date.now();
  return (end - start) / 36e5;
}

export function liveStateFor(trip: Trip) {
  const elapsed = elapsedHoursFor(trip);
  const consumed = Math.min(
    trip.iceRemainingKg,
    elapsed * trip.meltRateKgPerHr,
  );
  const ice = Math.max(0, trip.iceRemainingKg - consumed);
  const pct =
    trip.recommendedIceKg > 0 ? (ice / trip.recommendedIceKg) * 100 : 0;
  const freshness = Math.max(
    0,
    Math.min(100, 100 - (elapsed / trip.safeDurationHours) * 30),
  );
  let risk: RiskLevel = "safe";
  if (pct < 15 || elapsed > trip.safeDurationHours * 0.9) risk = "critical";
  else if (pct < 35 || elapsed > trip.safeDurationHours * 0.65)
    risk = "warning";
  return {
    iceRemainingKg: round(ice),
    pctRemaining: Math.round(pct),
    elapsedHours: round(elapsed),
    freshness: Math.round(freshness),
    risk,
  };
}


export function formatHours(h: number) {
  if (h <= 0) return "0h";
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  if (hh === 0) return `${mm}m`;
  if (mm === 0) return `${hh}h`;
  return `${hh}h ${mm}m`;
}
