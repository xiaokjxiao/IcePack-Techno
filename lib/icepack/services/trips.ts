import type { Database } from "@/lib/database.types";
import {
  type TripStatus,
} from "@/lib/icepack/data";
import { supabase } from "@/lib/supabase";

export type TripRow = Database["public"]["Tables"]["trips"]["Row"];
export type TripInsert = Database["public"]["Tables"]["trips"]["Insert"];
export type TripUpdate = Database["public"]["Tables"]["trips"]["Update"];

export async function getTrips() {
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as TripRow[];
}

export async function getPlannedTrips() {
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("status", "planned")
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
