import {
  calculateIce,
  getProfileFor,
  type Trip,
  type TripStatus,
} from "@/lib/icepack/data";
import type { ShipmentView } from "@/components/shipments/ShipmentCard";
import { supabase } from "@/lib/supabase";
import { createTrip } from "@/lib/icepack/services/trips";
import type { ShipmentRow, ShipmentUpdate } from "@/lib/icepack/services/shipments";
import type { TripRow, TripUpdate } from "@/lib/icepack/services/trips";

type TripWithShipments = TripRow & { shipments: ShipmentRow[] };

// ---------- Helpers ----------

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

// ---------- Status transitions (shipment + trip coordination) ----------

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

    if (siblings && siblings.length > 0) {
      const allFinished = siblings.every(
        (s) => s.status === "completed" || s.status === "cancelled",
      );
      const anyActive = siblings.some((s) => s.status === "active");

      let derivedStatus: TripStatus;
      if (allFinished) derivedStatus = "completed";
      else if (anyActive) derivedStatus = "active";
      else derivedStatus = "planned";

      const { data: currentTrip } = await supabase
        .from("trips")
        .select("status, started_at")
        .eq("id", shipment.trip_id)
        .single();

      const now = new Date().toISOString();
      const patch: TripUpdate = { status: derivedStatus, updated_at: now };

      if (derivedStatus === "active" && currentTrip?.status !== "active" && !currentTrip?.started_at) {
        patch.started_at = now;
      }
      if (derivedStatus === "completed" && currentTrip?.status !== "completed") {
        patch.completed_at = now;
      }

      await supabase.from("trips").update(patch).eq("id", shipment.trip_id);
    }
  }
}

export async function updateShipmentTrip(shipmentId: number, tripId: number, isPlanned = false, status?: TripStatus) {
  const updateData: ShipmentUpdate = { trip_id: tripId, is_planned: isPlanned };
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

export async function completeTrip(id: number) {
  const now = new Date().toISOString();

  const { error: tripError } = await supabase.from("trips").update({ status: "completed", completed_at: now, updated_at: now }).eq("id", id);
  if (tripError) throw tripError;
  const { error: shipError } = await supabase.from("shipments").update({ status: "completed" }).eq("trip_id", id);
  if (shipError) throw shipError;
}

export async function cancelTrip(id: number) {
  const now = new Date().toISOString();

  const { error: tripError } = await supabase.from("trips").update({ status: "completed", completed_at: now, updated_at: now }).eq("id", id);
  if (tripError) throw tripError;
  const { error: shipError } = await supabase.from("shipments").update({ status: "cancelled" }).eq("trip_id", id);
  if (shipError) throw shipError;
}

export async function startTrip(id: number) {
  const now = new Date().toISOString();

  const { error: tripError } = await supabase.from("trips").update({ status: "active", started_at: now, updated_at: now }).eq("id", id);
  if (tripError) throw tripError;
  const { error: shipError } = await supabase.from("shipments").update({ status: "active" }).eq("trip_id", id);
  if (shipError) throw shipError;
}

export async function startSoloShipment(shipmentId: number, shipmentName: string) {
  const now = new Date().toISOString();
  const trip = await createTrip({
    trip_name: shipmentName,
    status: "active",
    started_at: now,
  });
  await updateShipmentTrip(shipmentId, trip.id, false, "active");
  return trip;
}

// ---------- Combined views ----------

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
        schedule: s.schedule ?? null,
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
    schedule: s.schedule ?? null,
  }));
}

// ---------- Grouping ----------

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
