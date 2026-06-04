import type { Database } from "@/lib/database.types";
import {
  calculateIce,
  getProfileFor,
  type Trip,
  type TripStatus,
} from "@/lib/icepack/data";
import type { ShipmentView } from "@/components/shipments/ShipmentCard";
import { supabase } from "@/lib/supabase";

type ShipmentRow = Database["public"]["Tables"]["shipments"]["Row"];
type ShipmentInsert = Database["public"]["Tables"]["shipments"]["Insert"];
type ShipmentUpdate = Database["public"]["Tables"]["shipments"]["Update"];

type TripRow = Database["public"]["Tables"]["trips"]["Row"];
type TripInsert = Database["public"]["Tables"]["trips"]["Insert"];
type TripUpdate = Database["public"]["Tables"]["trips"]["Update"];

type TripWithShipments = TripRow & { shipments: ShipmentRow[] };

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
  const { data, error } = await supabase
    .from("shipments")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
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

export async function updateShipmentStatus(id: number, status: TripStatus) {
  const { data: shipment } = await supabase
    .from("shipments")
    .update({ status })
    .eq("id", id)
    .select("trip_id")
    .single();

  if (shipment?.trip_id) {
    const { data: siblings } = await supabase
      .from("shipments")
      .select("status")
      .eq("trip_id", shipment.trip_id);

    if (siblings && siblings.length > 0 && siblings.every((s) => s.status === status)) {
      const now = new Date().toISOString();
      const patch: Record<string, unknown> = { status, updated_at: now };
      if (status === "completed" || status === "cancelled") {
        patch.completed_at = now;
      } else if (status === "active") {
        patch.started_at = now;
      }
      await supabase.from("trips").update(patch).eq("id", shipment.trip_id);
    }
  }
}

// ---------- Trip services ----------

export async function getTrips() {
  const { data, error } = await supabase
    .from("trips")
    .select("*")
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
  const { data, error } = await supabase
    .from("trips")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
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

export async function completeTrip(id: number) {
  const now = new Date().toISOString();

  await supabase.from("trips").update({ status: "completed", completed_at: now, updated_at: now }).eq("id", id);
  await supabase.from("shipments").update({ status: "completed" }).eq("trip_id", id);
}

export async function cancelTrip(id: number) {
  const now = new Date().toISOString();

  await supabase.from("trips").update({ status: "cancelled", completed_at: now, updated_at: now }).eq("id", id);
  await supabase.from("shipments").update({ status: "cancelled" }).eq("trip_id", id);
}

export async function startTrip(id: number) {
  const now = new Date().toISOString();

  await supabase.from("trips").update({ status: "active", started_at: now, updated_at: now }).eq("id", id);
  await supabase.from("shipments").update({ status: "active" }).eq("trip_id", id);
}

// ---------- Combined view ----------

function mapTripWithShipment(row: TripWithShipments, shipment: ShipmentRow): Trip {
  return {
    id: row.id,
    shipmentId: shipment.id,
    name: row.trip_name || shipment.shipment_name,
    productId: shipment.cargo_category,
    cargoKg: shipment.cargo_kg,
    durationHours: shipment.duration_hours,
    recommendedIceKg: shipment.recommended_ice_kg ?? 0,
    iceRemainingKg: shipment.ice_remaining_kg ?? 0,
    meltRateKgPerHr: shipment.melt_rate_kg_per_hr ?? 0,
    safeDurationHours: shipment.safe_duration_hours ?? 0,
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    notes: shipment.notes,
  };
}

export async function getTripsWithShipments() {
  const [{ data: trips }, { data: allShipments }] = await Promise.all([
    supabase.from("trips").select("*").order("created_at", { ascending: false }),
    supabase.from("shipments").select("*"),
  ]);

  if (trips?.length) {
    const shipmentsMap = new Map<number, ShipmentRow[]>();
    for (const s of (allShipments ?? [])) {
      if (s.trip_id != null) {
        const arr = shipmentsMap.get(s.trip_id) || [];
        arr.push(s);
        shipmentsMap.set(s.trip_id, arr);
      }
    }
    return trips.map((t) => {
      const tripShipments = shipmentsMap.get(t.id) ?? [];
      const shipment = tripShipments[0];
      return shipment ? mapTripWithShipment(t as TripWithShipments, shipment) : null;
    }).filter(Boolean) as Trip[];
  }
  return [] as Trip[];
}

export interface TripWithShipmentViews {
  trip: Trip;
  shipments: ShipmentView[];
}

export async function getTripsWithAllShipments(): Promise<TripWithShipmentViews[]> {
  const [{ data: trips }, { data: allShipments }] = await Promise.all([
    supabase.from("trips").select("*").order("created_at", { ascending: false }),
    supabase.from("shipments").select("*"),
  ]);

  if (!trips?.length) return [];

  const shipmentsMap = new Map<number, ShipmentRow[]>();
  for (const s of (allShipments ?? [])) {
    if (s.trip_id != null) {
      const arr = shipmentsMap.get(s.trip_id) || [];
      arr.push(s);
      shipmentsMap.set(s.trip_id, arr);
    }
  }

  return trips
    .map((t) => {
      const tripShipments = shipmentsMap.get(t.id) ?? [];
      const primary = tripShipments[0];
      if (!primary) return null;
      const trip = mapTripWithShipment(t as TripWithShipments, primary);
      const shipments: ShipmentView[] = tripShipments.map((s) => ({
        id: s.id,
        name: s.shipment_name,
        productId: s.cargo_category,
        cargoKg: s.cargo_kg,
        durationHours: s.duration_hours,
        originLocation: s.origin_location,
        destinationLocation: s.destination_location,
        tripId: trip.id,
        tripName: t.trip_name,
        tripStatus: t.status,
        shipmentStatus: s.status,
        isPlanned: s.is_planned ?? false,
        recommendedIceKg: s.recommended_ice_kg ?? null,
        iceRemainingKg: s.ice_remaining_kg ?? null,
        meltRateKgPerHr: s.melt_rate_kg_per_hr ?? null,
        safeDurationHours: s.safe_duration_hours ?? null,
        startedAt: t.started_at,
      }));
      return { trip, shipments };
    })
    .filter(Boolean) as TripWithShipmentViews[];
}

export async function getTripsWithShipmentsByStatus(status: TripStatus) {
  const { data: trips, error } = await supabase
    .from("trips")
    .select("*, shipments(*)")
    .eq("status", status)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (trips as unknown as TripWithShipments[]).map((t) => {
    const shipment = t.shipments?.[0];
    return shipment ? mapTripWithShipment(t, shipment) : null;
  }).filter(Boolean) as Trip[];
}

export async function getTripWithShipmentsById(tripId: number): Promise<Trip | null> {
  const { data, error } = await supabase
    .from("trips")
    .select("*, shipments(*)")
    .eq("id", tripId)
    .single();
  if (error) return null;
  const row = data as unknown as TripWithShipments;
  const shipment = row.shipments?.[0];
  return shipment ? mapTripWithShipment(row, shipment) : null;
}

export async function updateShipmentTrip(shipmentId: number, tripId: number, isPlanned = false, status?: TripStatus) {
  const updateData: Record<string, unknown> = { trip_id: tripId, is_planned: isPlanned };
  if (status) {
    updateData.status = status;
  }
  const { error } = await supabase
    .from("shipments")
    .update(updateData)
    .eq("id", shipmentId);
  if (error) {
    console.error("updateShipmentTrip failed:", error);
    throw error;
  }
  console.log("updateShipmentTrip OK: shipment", shipmentId, "-> trip", tripId, "isPlanned:", isPlanned);
}

export async function getShipmentsByTripId(tripId: number): Promise<ShipmentRow[]> {
  const { data, error } = await supabase
    .from("shipments")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as ShipmentRow[];
}

export async function getShipmentsWithTrips() {
  const { data: shipments, error } = await supabase
    .from("shipments")
    .select("*, trip:trips(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (shipments as (ShipmentRow & { trip: TripRow | null })[]).map((s) => ({
    id: s.id,
    name: s.shipment_name,
    productId: s.cargo_category,
    cargoKg: s.cargo_kg,
    durationHours: s.duration_hours,
    originLocation: s.origin_location,
    destinationLocation: s.destination_location,
    tripId: s.trip_id,
    tripName: s.trip?.trip_name ?? null,
    tripStatus: s.trip?.status ?? null,
    shipmentStatus: s.status,
    isPlanned: s.is_planned ?? false,
    recommendedIceKg: s.recommended_ice_kg ?? null,
    iceRemainingKg: s.ice_remaining_kg ?? null,
    meltRateKgPerHr: s.melt_rate_kg_per_hr ?? null,
    safeDurationHours: s.safe_duration_hours ?? null,
    startedAt: s.trip?.started_at ?? null,
  }));
}

export async function createGroupedTrip(
  selectedTrips: Trip[],
  groupName: string,
  startNow: boolean,
) {
  const newTrip = await createTrip({
    trip_name: groupName,
    status: startNow ? "active" : "planned",
    started_at: startNow ? new Date().toISOString() : null,
  });

  for (const trip of selectedTrips) {
    await updateShipmentTrip(trip.shipmentId, newTrip.id, !startNow, startNow ? "active" : "planned");
  }

  return newTrip;
}

export async function createGroupedTripFromShipments(
  selectedShipments: ShipmentView[],
  groupName: string,
  startNow: boolean,
) {
  const newTrip = await createTrip({
    trip_name: groupName,
    status: startNow ? "active" : "planned",
    started_at: startNow ? new Date().toISOString() : null,
  });

  console.log("createGroupedTripFromShipments: new trip", newTrip.id, newTrip.trip_name);

  for (const s of selectedShipments) {
    const profile = getProfileFor(s.productId);
    const calc = calculateIce(s.cargoKg, s.durationHours, profile);
    await supabase
      .from("shipments")
      .update({
        trip_id: newTrip.id,
        is_planned: !startNow,
        status: startNow ? "active" : "planned",
        recommended_ice_kg: calc.recommendedIceKg,
        ice_remaining_kg: calc.recommendedIceKg,
        melt_rate_kg_per_hr: calc.meltRateKgPerHr,
        safe_duration_hours: calc.safeDurationHours,
      })
      .eq("id", s.id);
  }

  console.log("createGroupedTripFromShipments: done, updated", selectedShipments.length, "shipments");
  return newTrip;
}
