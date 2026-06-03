import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { TripCard } from "@/components/trips/TripCard";
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
} from "@/lib/icepack/services";

type ShipmentRow = Database["public"]["Tables"]["shipments"]["Row"];

function shipmentToTrip(s: ShipmentRow, tripData: Trip): Trip {
  return {
    ...tripData,
    id: tripData.id,
    shipmentId: s.id,
    name: s.shipment_name,
    productId: s.cargo_category,
    cargoKg: s.cargo_kg,
    durationHours: s.duration_hours,
  };
}

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { isTablet } = useScreenDimensions();
  const titleSize = useResponsiveFontSize("2xl");
  const labelSize = useResponsiveFontSize("sm");
  const padding = useResponsiveSpacing("lg");

  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [groupedTrips, setGroupedTrips] = useState<Trip[]>([]);

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
            const others = shipments
              .filter((s) => s.id !== mainTrip.shipmentId)
              .map((s) => shipmentToTrip(s, mainTrip));
            setGroupedTrips(others);
          } else {
            setGroupedTrips([]);
          }
        } catch (e) {
          console.error("TripDetailScreen: failed to load", e);
        } finally {
          setLoading(false);
        }
      })();
    }, [id]),
  );

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
          <Text style={{ fontSize: labelSize, color: "rgba(255,255,255,0.7)", fontWeight: "500" }}>
            ← Back
          </Text>
        </TouchableOpacity>
        <Text
          style={{ fontSize: titleSize, fontWeight: "700", color: "white" }}
        >
          {trip.name}
        </Text>
        {groupedTrips.length > 0 && (
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
                backgroundColor: "rgba(6, 182, 212, 0.2)",
              }}
            >
              <Text
                style={{
                  fontSize: labelSize * 0.85,
                  fontWeight: "600",
                  color: "#67e8f9",
                }}
              >
                Group Trip
              </Text>
            </View>
            <Text
              style={{
                fontSize: labelSize,
                color: "rgba(255,255,255,0.6)",
              }}
            >
              {groupedTrips.length + 1} shipments
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
        <TripCard trip={trip} />

        {groupedTrips.length > 0 && (
          <>
            <View
              style={{
                marginTop: 16,
                marginBottom: 8,
                paddingTop: 16,
                borderTopWidth: 1,
                borderTopColor: "#e8eef3",
              }}
            >
              <Text
                style={{
                  fontSize: titleSize * 0.7,
                  fontWeight: "600",
                  color: "#0b2540",
                }}
              >
                Grouped Shipments ({groupedTrips.length})
              </Text>
              <Text
                style={{
                  fontSize: labelSize,
                  color: "#587a94",
                  marginTop: 2,
                }}
              >
                All shipments in this group
              </Text>
            </View>
            {groupedTrips.map((t) => (
              <TripCard key={t.shipmentId} trip={t} />
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}
