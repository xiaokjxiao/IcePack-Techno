// IcePack domain data: product categories, storage profiles, ice calculation.

import type { Database } from "@/lib/database.types";

export type CargoCategory = Database["public"]["Enums"]["cargo_category_enum"];
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
    icon: "Beef",
    profile: "freezer",
    description:
      "Imported meat for further processing; local dressed chicken; processed meat products for retail",
  },
  {
    id: "fish_aquaculture",
    label: "Fish & Aquaculture Products",
    icon: "Fish",
    profile: "chilled",
    description:
      "Tuna, sardines, shrimp, prawns, squid, mackerel, and other seafood",
  },
  {
    id: "dairy",
    label: "Dairy Products",
    icon: "Milk",
    profile: "chilled",
    description: "Ice cream, cheese, yoghurt, milk",
  },
  {
    id: "fruits_vegetables",
    label: "Fruits & Vegetables",
    icon: "Apple",
    profile: "ac",
    description:
      "Bananas, pineapples, mangoes, papayas, potatoes, onions, garlic, carrots, apples, grapes, pears, oranges, kiwi, and frozen vegetables",
  },
  {
    id: "other_food",
    label: "Other Food Items",
    icon: "UtensilsCrossed",
    profile: "chilled",
    description:
      "Frozen dough, cakes, bakery products, raw materials for quick service restaurants (QSRs)",
  },
  {
    id: "pharma",
    label: "Pharmaceuticals",
    icon: "Pill",
    profile: "deep",
    description:
      "Vaccines, biologics, temperature-sensitive drugs requiring ultra-low cold chain",
  },
  {
    id: "electronics",
    label: "Electronics",
    icon: "Monitor",
    profile: "ac",
    description:
      "Computers, components, and sensitive equipment requiring climate-controlled transport",
  },
  {
    id: "cosmetics",
    label: "Cosmetics",
    icon: "SprayCan",
    profile: "chilled",
    description:
      "Skincare, makeup, and beauty products requiring cool chain stability",
  },
  {
    id: "agricultural_products",
    label: "Agricultural Products",
    icon: "Sprout",
    profile: "chilled",
    description:
      "Fresh produce, flowers, seeds, and other agricultural commodities",
  },
];


export type TripStatus = Database["public"]["Enums"]["trip_status_enum"];
export type RiskLevel = "safe" | "warning" | "critical";

// Database-aligned shipment record
export interface Shipment {
  id: number;
  shipmentName: string;
  cargoCategory: CargoCategory;
  cargoKg: number;
  durationHours: number;
  targetTempMinC: number | null;
  targetTempMaxC: number | null;
  originLocation: string | null;
  destinationLocation: string | null;
  notes: string | null;
  tripId: number | null;
  recommendedIceKg: number | null;
  iceRemainingKg: number | null;
  meltRateKgPerHr: number | null;
  safeDurationHours: number | null;
  status: TripStatus;
  createdAt: string;
}

// Database-aligned trip record
export interface TripRow {
  id: number;
  tripName: string;
  status: TripStatus;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Combined view model used by the current UI layer
export interface Trip {
  id: number;
  shipmentId: number;
  name: string;
  productId: CargoCategory;
  cargoKg: number;
  durationHours: number;
  recommendedIceKg: number;
  iceRemainingKg: number;
  meltRateKgPerHr: number;
  safeDurationHours: number;
  status: TripStatus;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  notes: string | null;
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

// ─── Ice Types ────────────────────────────────────────────────

export type IceTypeKey = "block" | "crushed" | "tube" | "flake" | "dry_ice";

export interface IceType {
  key: IceTypeKey;
  label: string;
  characteristics: string;
  commonlyUsedFor: string;
  notes: string;
  icon: string;
  meltBase: number;
  meltRateRange: string;
  coverageFactor: number;
}

export const ICE_TYPES: Record<IceTypeKey, IceType> = {
  block: {
    key: "block",
    label: "Block",
    characteristics: "Large solid blocks, slow melting",
    commonlyUsedFor: "Fish (whole catch, tuna, sardines), coastal aquaculture",
    notes: "Often broken into chunks; widely used in fishing boats and ports",
    icon: "IceCube",
    meltBase: 2.0,
    meltRateRange: "1.8 - 2.2",
    coverageFactor: 0.25,
  },
  crushed: {
    key: "crushed",
    label: "Crushed",
    characteristics: "Small fragments, high surface contact",
    commonlyUsedFor: "Fish, meat, poultry",
    notes: "Provides rapid chilling; common in ice-chilled carriers",
    icon: "IceCube",
    meltBase: 4.0,
    meltRateRange: "3.5 - 4.5",
    coverageFactor: 0.75,
  },
  tube: {
    key: "tube",
    label: "Tube",
    characteristics: "Cylindrical, hollow, slower melt",
    commonlyUsedFor: "Meat, poultry, fish",
    notes: "Good for longer transport; less surface coverage than flake",
    icon: "IceCube",
    meltBase: 2.8,
    meltRateRange: "2.5 - 3.2",
    coverageFactor: 0.45,
  },
  flake: {
    key: "flake",
    label: "Flake",
    characteristics: "Thin, flat pieces, maximum coverage",
    commonlyUsedFor: "Shrimp, fillets, dairy, bakery",
    notes: "Gentle cooling for delicate products; ideal in processing plants",
    icon: "IceCube",
    meltBase: 5.8,
    meltRateRange: "5.0 - 6.5",
    coverageFactor: 1.0,
  },
  dry_ice: {
    key: "dry_ice",
    label: "Dry Ice (CO₂)",
    characteristics: "Ultra-low temperature, sublimates (no water)",
    commonlyUsedFor: "Pharmaceuticals, vaccines, high-value exports",
    notes: "Maintains strict cold chain for sensitive goods",
    icon: "IceCube",
    meltBase: 1.2,
    meltRateRange: "0.8 - 1.5",
    coverageFactor: 0.15,
  },
};

const ICE_TYPE_RECOMMENDATIONS: Record<CargoCategory, IceTypeKey[]> = {
  meat: ["tube", "crushed"],
  fish_aquaculture: ["block", "flake", "crushed"],
  dairy: ["flake", "crushed"],
  fruits_vegetables: ["crushed", "flake"],
  other_food: ["crushed", "tube"],
  pharma: ["dry_ice"],
  electronics: ["dry_ice"],
  cosmetics: ["crushed", "flake"],
  agricultural_products: ["crushed", "flake"],
};

export function getRecommendedIceTypes(productId: string): IceType[] {
  const keys = ICE_TYPE_RECOMMENDATIONS[productId as CargoCategory] ?? ["crushed"];
  return keys.map((k) => ICE_TYPES[k]);
}

export function getPrimaryIceType(productId: string): IceType {
  return getRecommendedIceTypes(productId)[0] ?? ICE_TYPES.crushed;
}

export interface IceDistribution {
  iceType: IceType;
  amountKg: number;
  meltRateKgPerHr: number;
  safeDurationHours: number;
}

export function calculateIceForType(
  cargoKg: number,
  durationHours: number,
  pallets: number,
  iceType: IceType,
  profile: StorageProfile,
): { amountKg: number; meltRateKgPerHr: number; safeDurationHours: number } {
  if (!cargoKg || !durationHours) return { amountKg: 0, meltRateKgPerHr: 0, safeDurationHours: 0 };

  const baseIce = cargoKg * profile.iceFactor * (durationHours / 24) * 1.25;

  let iceMultiplier = 1.0;
  if (iceType.key === "flake") iceMultiplier = 1.4;
  if (iceType.key === "crushed") iceMultiplier = 1.25;
  if (iceType.key === "tube") iceMultiplier = 1.0;
  if (iceType.key === "block") iceMultiplier = 0.85;
  if (iceType.key === "dry_ice") iceMultiplier = 0.7;

  const amountKg = round(baseIce * iceMultiplier * (1 + pallets * 0.02));
  const meltRateKgPerHr = round((amountKg / 100) * iceType.meltBase);
  const safeDurationHours = meltRateKgPerHr > 0 ? round(amountKg / meltRateKgPerHr) : 0;
  return { amountKg, meltRateKgPerHr, safeDurationHours };
}

export function calculateIceDistribution(
  cargoKg: number,
  durationHours: number,
  pallets: number,
  productId: string,
  profile: StorageProfile,
): IceDistribution[] {
  const types = getRecommendedIceTypes(productId);
  return types.map((iceType) => {
    const { amountKg, meltRateKgPerHr, safeDurationHours } = calculateIceForType(
      cargoKg, durationHours, pallets, iceType, profile,
    );
    return { iceType, amountKg, meltRateKgPerHr, safeDurationHours };
  });
}
