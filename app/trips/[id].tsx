import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Play, CheckCircle2, XCircle, ChevronLeft } from "lucide-react-native";
import { ShipmentCard, type ShipmentView } from "@/components/shipments/ShipmentCard";
import {
  useResponsiveFontSize,
  useResponsiveSpacing,
} from "@/hooks/use-responsive-size";
import { useScreenDimensions } from "@/hooks/use-screen-dimensions";
import type { Database } from "@/lib/database.types";
import type { Trip } from "@/lib/icepack/data";
import {
  getTripWithShipmentsById,
  getShipmentsByTripId,
  startTrip,
  completeTrip,
  cancelTrip,
} from "@/lib/icepack/services";

type ShipmentRow = Database["public"]["Tables"]["shipments"]["Row"];

function toShipmentView(s: ShipmentRow, trip: Trip): ShipmentView {
  return {
    id: s.id,
    name: s.shipment_name,
    productId: s.cargo_category,
    cargoKg: s.cargo_kg,
    durationHours: s.duration_hours,
    originLocation: s.origin_location,
    destinationLocation: s.destination_location,
    tripId: trip.id,
    tripName: trip.name,
    tripStatus: trip.status,
    shipmentStatus: s.status,
    isPlanned: s.is_planned ?? false,
    recommendedIceKg: s.recommended_ice_kg ?? null,
    iceRemainingKg: s.ice_remaining_kg ?? null,
    meltRateKgPerHr: s.melt_rate_kg_per_hr ?? null,
    safeDurationHours: s.safe_duration_hours ?? null,
    startedAt: trip.startedAt,
  };
}

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const titleSize = useResponsiveFontSize("2xl");
  const labelSize = useResponsiveFontSize("sm");
  const padding = useResponsiveSpacing("lg");

  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [allShipments, setAllShipments] = useState<ShipmentRow[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      (async () => {
        setLoading(true);
        try {
          const mainTrip = await getTripWithShipmentsById(Number(id));
          setTrip(mainTrip);
          if (mainTrip?.id) {
            const shipments = await getShipmentsByTripId(mainTrip.id);
            setAllShipments(shipments);
          } else {
            setAllShipments([]);
          }
        } catch (e) {
          console.error("TripDetailScreen: failed to load", e);
        } finally {
          setLoading(false);
        }
      })();
    }, [id]),
  );

  const handleStartTrip = useCallback(async () => {
    if (!trip || actionLoading) return;
    setActionLoading(true);
    const prevTrip = trip;
    const prevShipments = allShipments;
    const now = new Date().toISOString();
    setTrip((p) => p ? { ...p, status: "active" as const, startedAt: now } : null);
    setAllShipments((prev) => prev.map((s) => ({ ...s, status: "active" as const })));
    try {
      await startTrip(trip.id);
    } catch (e) {
      setTrip(prevTrip);
      setAllShipments(prevShipments);
      Alert.alert("Error", "Failed to start trip");
    } finally {
      setActionLoading(false);
    }
  }, [trip, allShipments, actionLoading]);

  const handleCompleteTrip = useCallback(async () => {
    if (!trip || actionLoading) return;
    console.log("[handleCompleteTrip] Starting complete for trip", trip.id, trip.name);
    setActionLoading(true);
    const prevTrip = trip;
    const prevShipments = allShipments;
    setTrip((p) => p ? { ...p, status: "completed" as const } : null);
    setAllShipments((prev) => prev.map((s) => ({ ...s, status: "completed" as const })));
    try {
      await completeTrip(trip.id);
      console.log("[handleCompleteTrip] Success - trip", trip.id, "marked completed");
    } catch (e) {
      console.error("[handleCompleteTrip] Failed for trip", trip.id, e);
      setTrip(prevTrip);
      setAllShipments(prevShipments);
      Alert.alert("Error", "Failed to complete trip");
    } finally {
      setActionLoading(false);
    }
  }, [trip, allShipments, actionLoading]);

  const handleCancelTrip = useCallback(async () => {
    if (!trip || actionLoading) return;
    console.log("[handleCancelTrip] Starting cancel for trip", trip.id, trip.name);
    setActionLoading(true);
    const prevTrip = trip;
    const prevShipments = allShipments;
    setTrip((p) => p ? { ...p, status: "completed" as const } : null);
    setAllShipments((prev) => prev.map((s) => ({ ...s, status: "cancelled" as const })));
    try {
      await cancelTrip(trip.id);
      console.log("[handleCancelTrip] Success - trip", trip.id, "cancelled");
    } catch (e) {
      console.error("[handleCancelTrip] Failed for trip", trip.id, e);
      setTrip(prevTrip);
      setAllShipments(prevShipments);
      Alert.alert("Error", "Failed to cancel trip");
    } finally {
      setActionLoading(false);
    }
  }, [trip, allShipments, actionLoading]);

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#1a8ad4" />
      </View>
    );
  }

  if (!trip) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text style={{ fontSize: labelSize, color: "#9bb4c7", textAlign: "center" }}>
          Trip not found
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 16, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: "#1a8ad4", borderRadius: 10 }}
        >
          <Text style={{ color: "white", fontWeight: "600", fontSize: labelSize }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
    >
      <LinearGradient
        colors={["#173E61", "#246EA2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          paddingLeft: padding,
          paddingRight: padding,
          paddingBottom: padding,
          paddingTop: insets.top + 16,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <ChevronLeft size={labelSize + 4} color="rgba(255,255,255,0.7)" strokeWidth={2} />
          <Text style={{ fontSize: labelSize, color: "rgba(255,255,255,0.7)", fontWeight: "500" }}>
            Back
          </Text>
        </TouchableOpacity>
        <Text
          style={{ fontSize: titleSize, fontWeight: "700", color: "white" }}
        >
          {trip.name}
        </Text>
        {allShipments.length > 1 && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginTop: 6,
            }}
          >
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 12,
              }}
            >
            </View>
            <Text
              style={{
                fontSize: labelSize,
                color: "rgba(255,255,255,0.6)",
              }}
            >
              {allShipments.length} shipments
            </Text>
          </View>
        )}
        <Text
          style={{
            fontSize: labelSize,
            color: "rgba(255,255,255,0.6)",
            marginTop: 4,
          }}
        >
          Status: {trip.status}
        </Text>
      </LinearGradient>

      <View style={{ paddingHorizontal: padding, paddingTop: padding, gap: 12 }}>
        {allShipments.map((s) => (
          <ShipmentCard key={s.id} shipment={toShipmentView(s, trip)} />
        ))}

        {/* Action Buttons */}
        <View style={{ paddingTop: 8, paddingBottom: 20, gap: 10 }}>
          {trip.status === "planned" && (
            <TouchableOpacity
              onPress={handleStartTrip}
              disabled={actionLoading}
              activeOpacity={0.85}
              style={{
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: actionLoading ? "#94c5e8" : "#14b8a6",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Play size={18} color="white" strokeWidth={2} />
              )}
              <Text style={{ fontSize: labelSize, fontWeight: "700", color: "white" }}>
                {actionLoading ? "Starting..." : "Start Trip"}
              </Text>
            </TouchableOpacity>
          )}

          {trip.status === "active" && (
            <>
              <TouchableOpacity
                onPress={handleCompleteTrip}
                disabled={actionLoading}
                activeOpacity={0.85}
                style={{
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: actionLoading ? "#94c5e8" : "#1a8ad4",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <CheckCircle2 size={18} color="white" strokeWidth={2} />
                )}
                <Text style={{ fontSize: labelSize, fontWeight: "700", color: "white" }}>
                  {actionLoading ? "Completing..." : "Complete Trip"}
                </Text>
              </TouchableOpacity>

            </>
          )}

          {trip.status !== "completed" && trip.status !== "cancelled" && (
            <TouchableOpacity
              onPress={handleCancelTrip}
              disabled={actionLoading}
              activeOpacity={0.85}
              style={{
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: "#fff",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                borderWidth: 1,
                borderColor: "#e8eef3",
              }}
            >
              <XCircle size={18} color="#ef4444" strokeWidth={2} />
              <Text style={{ fontSize: labelSize, fontWeight: "600", color: "#ef4444" }}>
                Cancel Trip
              </Text>
            </TouchableOpacity>
          )}

          {trip.status === "completed" && (
            <View
              style={{
                backgroundColor: "#f0fdf4",
                borderRadius: 12,
                padding: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#bbf7d0",
              }}
            >
              <Text style={{ fontSize: labelSize, color: "#16a34a", fontWeight: "600" }}>
                Completed
              </Text>
            </View>
          )}

          {trip.status === "cancelled" && (
            <View
              style={{
                backgroundColor: "#fef2f2",
                borderRadius: 12,
                padding: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#fecaca",
              }}
            >
              <Text style={{ fontSize: labelSize, color: "#dc2626", fontWeight: "600" }}>
                Cancelled
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
