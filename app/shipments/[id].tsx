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
import { Play, CheckCircle2, XCircle } from "lucide-react-native";
import {
  useResponsiveFontSize,
  useResponsiveSpacing,
} from "@/hooks/use-responsive-size";
import { useScreenDimensions } from "@/hooks/use-screen-dimensions";
import type { Database } from "@/lib/database.types";
import {
  getProduct,
  getProfileFor,
  type TripStatus,
} from "@/lib/icepack/data";
import { ProductIcon } from "@/components/ui/ProductIcon";
import {
  getShipment,
  getTrip,
  updateTripStatus,
} from "@/lib/icepack/services";

type ShipmentRow = Database["public"]["Tables"]["shipments"]["Row"];
type TripRow = Database["public"]["Tables"]["trips"]["Row"];

function Info({
  label,
  value,
  strong,
  accent,
}: {
  label: string;
  value: string;
  strong?: boolean;
  accent?: boolean;
}) {
  const baseSize = useResponsiveFontSize("sm");
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: baseSize, color: "#0b2540" }}>{label}</Text>
      <Text
        style={{
          fontSize: strong ? baseSize * 1.1 : baseSize,
          fontWeight: "600",
          color: accent ? "#14b8a6" : strong ? "#0b2540" : "#0b2540",
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export default function ShipmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { isTablet } = useScreenDimensions();
  const titleSize = useResponsiveFontSize("2xl");
  const labelSize = useResponsiveFontSize("sm");
  const baseSize = useResponsiveFontSize("base");
  const padding = useResponsiveSpacing("lg");

  const [loading, setLoading] = useState(true);
  const [shipment, setShipment] = useState<ShipmentRow | null>(null);
  const [trip, setTrip] = useState<TripRow | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      (async () => {
        setLoading(true);
        try {
          const s = await getShipment(Number(id));
          setShipment(s);
          if (s.trip_id) {
            const t = await getTrip(s.trip_id);
            setTrip(t);
          }
        } catch (e) {
          console.error("ShipmentDetail: failed to load", e);
        } finally {
          setLoading(false);
        }
      })();
    }, [id]),
  );

  const handleStatusChange = useCallback(
    async (newStatus: TripStatus) => {
      if (!trip) return;
      setActionLoading(true);
      try {
        await updateTripStatus(trip.id, newStatus);
        setTrip((prev) => prev ? { ...prev, status: newStatus } : null);
      } catch (e) {
        Alert.alert("Error", "Failed to update status");
      } finally {
        setActionLoading(false);
      }
    },
    [trip],
  );

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#1a8ad4" />
      </View>
    );
  }

  if (!shipment) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text style={{ fontSize: labelSize, color: "#9bb4c7", textAlign: "center" }}>
          Shipment not found
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

  const product = getProduct(shipment.cargo_category);
  const profile = getProfileFor(shipment.cargo_category);

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      keyboardShouldPersistTaps="handled"
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
          style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}
        >
          <Text style={{ fontSize: labelSize, color: "rgba(255,255,255,0.7)", fontWeight: "500" }}>
            ← Back
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <ProductIcon name={product.icon} size={titleSize} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: titleSize, fontWeight: "700", color: "white" }} numberOfLines={1}>
              {shipment.shipment_name}
            </Text>
            <Text style={{ fontSize: labelSize, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
              {product.label}
            </Text>
          </View>
        </View>

        {trip && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginTop: 10,
            }}
          >
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 12,
                backgroundColor: trip.status === "active"
                  ? "rgba(20, 184, 166, 0.2)"
                  : trip.status === "planned"
                    ? "rgba(6, 182, 212, 0.2)"
                    : "rgba(148, 163, 184, 0.2)",
              }}
            >
              <Text
                style={{
                  fontSize: labelSize * 0.8,
                  fontWeight: "600",
                  color: trip.status === "active" ? "#5eead4" : trip.status === "planned" ? "#67e8f9" : "#cbd5e1",
                  textTransform: "uppercase",
                }}
              >
                {trip.status}
              </Text>
            </View>
            <Text style={{ fontSize: labelSize, color: "rgba(255,255,255,0.6)" }}>
              Trip: {trip.trip_name}
            </Text>
          </View>
        )}
      </LinearGradient>

      <View style={{ paddingHorizontal: padding, paddingTop: padding, gap: 16 }}>
        {/* Cargo Info */}
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 16,
            padding: isTablet ? 20 : 16,
            borderWidth: 1,
            borderColor: "#e8eef3",
            shadowColor: "#0b2540",
            shadowOpacity: 0.04,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 2,
          }}
        >
          <Text
            style={{
              fontSize: labelSize * 0.9,
              fontWeight: "600",
              color: "#587a94",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 12,
            }}
          >
            Cargo Info
          </Text>
          <View style={{ gap: 10 }}>
            <Info label="Cargo" value={`${shipment.cargo_kg} kg ${product.icon}`} />
            <Info label="Duration" value={`${shipment.duration_hours} hrs`} />

            {shipment.origin_location && (
              <Info label="Origin" value={shipment.origin_location} />
            )}
            {shipment.destination_location && (
              <Info label="Destination" value={shipment.destination_location} />
            )}
          </View>
        </View>

        {/* Storage Profile */}
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 16,
            padding: isTablet ? 20 : 16,
            borderWidth: 1,
            borderColor: "#e8eef3",
            shadowColor: "#0b2540",
            shadowOpacity: 0.04,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 2,
          }}
        >
          <Text
            style={{
              fontSize: labelSize * 0.9,
              fontWeight: "600",
              color: "#587a94",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 12,
            }}
          >
            Storage Profile
          </Text>
          <View style={{ gap: 10 }}>
            <Info label="Type" value={profile.label} />
            <Info label="Range" value={profile.range} />
            <Info label="Melt Factor" value={`${profile.iceFactor} kg/kg·day`} />
            <Text style={{ fontSize: labelSize * 0.85, color: "#9bb4c7", marginTop: 4 }}>
              {profile.note}
            </Text>
          </View>
        </View>

        {/* Ice Calculation */}
        {trip && (
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: isTablet ? 20 : 16,
              borderWidth: 1,
              borderColor: "#e8eef3",
              shadowColor: "#0b2540",
              shadowOpacity: 0.04,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 2,
            }}
          >
            <Text
              style={{
                fontSize: labelSize * 0.9,
                fontWeight: "600",
                color: "#587a94",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 12,
              }}
            >
              Ice Calculation
            </Text>
            <View style={{ gap: 10 }}>
              <Info label="Recommended Ice" value={`${trip.recommended_ice_kg} kg`} strong />
              <Info label="Melt Rate" value={`${trip.melt_rate_kg_per_hr} kg/hr`} />
              <Info label="Safe Duration" value={`${trip.safe_duration_hours} hrs`} accent />
              <Info label="Ice Remaining" value={`${trip.ice_remaining_kg} kg`} />
            </View>
          </View>
        )}

        {/* Notes */}
        {shipment.notes && (
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: isTablet ? 20 : 16,
              borderWidth: 1,
              borderColor: "#e8eef3",
            }}
          >
            <Text
              style={{
                fontSize: labelSize * 0.9,
                fontWeight: "600",
                color: "#587a94",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 8,
              }}
            >
              Notes
            </Text>
            <Text style={{ fontSize: baseSize, color: "#0b2540", lineHeight: baseSize * 1.5 }}>
              {shipment.notes}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={{ paddingBottom: 20, gap: 10 }}>
          {!trip && (
            <View
              style={{
                backgroundColor: "#f4f8fa",
                borderRadius: 12,
                padding: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#e8eef3",
              }}
            >
              <Text style={{ fontSize: labelSize, color: "#587a94", textAlign: "center" }}>
                This shipment is not linked to any trip. Group it from the Shipments list.
              </Text>
            </View>
          )}

          {trip?.status === "planned" && (
            <TouchableOpacity
              onPress={() => handleStatusChange("active")}
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

          {trip?.status === "active" && (
            <TouchableOpacity
              onPress={() => handleStatusChange("completed")}
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
          )}

          {trip && trip.status !== "completed" && trip.status !== "cancelled" && (
            <TouchableOpacity
              onPress={() => handleStatusChange("cancelled")}
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

          {trip?.status === "completed" && (
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
                Completed{trip.completed_at ? ` on ${new Date(trip.completed_at).toLocaleDateString()}` : ""}
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
