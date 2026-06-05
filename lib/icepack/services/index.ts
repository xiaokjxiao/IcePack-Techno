export {
  getShipments,
  getShipment,
  createShipment,
  updateShipment,
  deleteShipment,
} from "@/lib/icepack/services/shipments";
export type {
  ShipmentRow,
  ShipmentInsert,
  ShipmentUpdate,
} from "@/lib/icepack/services/shipments";

export {
  getTrips,
  getPlannedTrips,
  getTrip,
  createTrip,
  updateTrip,
  updateTripStatus,
  deleteTrip,
} from "@/lib/icepack/services/trips";
export type {
  TripRow,
  TripInsert,
  TripUpdate,
} from "@/lib/icepack/services/trips";

export {
  updateShipmentStatus,
  updateShipmentTrip,
  completeTrip,
  cancelTrip,
  startTrip,
  startSoloShipment,
  getTripsWithShipments,
  getTripsWithAllShipments,
  getTripsWithShipmentsByStatus,
  getTripWithShipmentsById,
  getShipmentsByTripId,
  getShipmentsWithTrips,
  createGroupedTrip,
  createGroupedTripFromShipments,
} from "@/lib/icepack/services/cross";
export type {
  TripWithShipmentViews,
} from "@/lib/icepack/services/cross";
