import type { Database } from "@/lib/database.types";
import { supabase } from "@/lib/supabase";

export type ShipmentRow = Database["public"]["Tables"]["shipments"]["Row"];
export type ShipmentInsert = Database["public"]["Tables"]["shipments"]["Insert"];
export type ShipmentUpdate = Database["public"]["Tables"]["shipments"]["Update"];

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
