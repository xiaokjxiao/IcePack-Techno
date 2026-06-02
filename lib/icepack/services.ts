import type { Database } from "@/lib/database.types";
import type { Trip, TripStatus } from "@/lib/icepack/data";
import { supabase } from "@/lib/supabase";

type ShipmentRow = Database["public"]["Tables"]["shipments"]["Row"];
type ShipmentInsert = Database["public"]["Tables"]["shipments"]["Insert"];
type ShipmentUpdate = Database["public"]["Tables"]["shipments"]["Update"];

type TripRow = Database["public"]["Tables"]["trips"]["Row"];
type TripInsert = Database["public"]["Tables"]["trips"]["Insert"];
type TripUpdate = Database["public"]["Tables"]["trips"]["Update"];

// ---------- Shipment services ----------

export async function getShipments() {
  const { data, error } = await supabase
    .from("shipments")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as ShipmentRow[];
}

export async function getShipment(id: number) {
  const { data, error } = await supabase
    .from("shipments")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as ShipmentRow;
}

export async function createShipment(input: ShipmentInsert) {
  console.debug("createShipment: input", input);
  const { data, error } = await supabase
    .from("shipments")
    .insert(input)
    .select()
    .single();
  console.debug("createShipment: supabase response", { data, error });
  if (error) {
    console.debug("createShipment: throwing error", error);
    throw error;
  }
  console.debug("createShipment: success, returning", data);
  return data as ShipmentRow;
}

export async function updateShipment(id: number, input: ShipmentUpdate) {
  const { data, error } = await supabase
    .from("shipments")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as ShipmentRow;
}

export async function deleteShipment(id: number) {
  const { error } = await supabase.from("shipments").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Trip services ----------

export async function getTripsByShipment(shipmentId: number) {
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("shipment_id", shipmentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as TripRow[];
}

export async function getTrip(id: number) {
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as TripRow;
}

export async function createTrip(input: Omit<TripInsert, "updated_at">) {
  const payload = {
    ...input,
    updated_at: new Date().toISOString(),
  };
  console.debug("createTrip: input", input);
  console.debug("createTrip: payload with updated_at", payload);
  const { data, error } = await supabase
    .from("trips")
    .insert(payload)
    .select()
    .single();
  console.debug("createTrip: supabase response", { data, error });
  if (error) {
    console.debug("createTrip: throwing error", error);
    throw error;
  }
  console.debug("createTrip: success, returning", data);
  return data as TripRow;
}

export async function updateTrip(id: number, input: TripUpdate) {
  const { data, error } = await supabase
    .from("trips")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as TripRow;
}

export async function updateTripStatus(id: number, status: TripStatus) {
  const now = new Date().toISOString();
  const patch: TripUpdate & { started_at?: string; completed_at?: string } = {
    status,
    updated_at: now,
  };

  if (status === "active") {
    patch.started_at = now;
  } else if (status === "completed" || status === "cancelled") {
    patch.completed_at = now;
  }

  const { data, error } = await supabase
    .from("trips")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as TripRow;
}

export async function deleteTrip(id: number) {
  const { error } = await supabase.from("trips").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Combined view ----------

type TripWithShipment = TripRow & { shipment: ShipmentRow };

export async function getTripsWithShipments() {
  console.debug("getTripsWithShipments: request");
  const { data, error } = await supabase
    .from("trips")
    .select("*, shipment:shipments(*)")
    .order("created_at", { ascending: false });
  if (error) {
    console.debug("getTripsWithShipments: error", error);
    throw error;
  }

  console.debug("getTripsWithShipments: raw response", data);
  const mapped = (data as TripWithShipment[]).map(mapTripWithShipment);
  console.debug("getTripsWithShipments: mapped", mapped);
  return mapped;
}

export async function getTripsWithShipmentsByStatus(status: TripStatus) {
  console.debug("getTripsWithShipmentsByStatus: request", { status });
  const { data, error } = await supabase
    .from("trips")
    .select("*, shipment:shipments(*)")
    .eq("status", status)
    .order("created_at", { ascending: false });
  if (error) {
    console.debug("getTripsWithShipmentsByStatus: error", { status, error });
    throw error;
  }

  console.debug("getTripsWithShipmentsByStatus: raw response", {
    status,
    data,
  });
  const mapped = (data as TripWithShipment[]).map(mapTripWithShipment);
  console.debug("getTripsWithShipmentsByStatus: mapped", { status, mapped });
  return mapped;
}

function mapTripWithShipment(row: TripWithShipment): Trip {
  return {
    id: row.id,
    name: row.shipment.shipment_name,
    productId: row.shipment.cargo_category,
    cargoKg: row.shipment.cargo_kg,
    durationHours: row.shipment.duration_hours,
    recommendedIceKg: row.recommended_ice_kg,
    iceRemainingKg: row.ice_remaining_kg,
    meltRateKgPerHr: row.melt_rate_kg_per_hr,
    safeDurationHours: row.safe_duration_hours,
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  };
}
