import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { TripCard } from "@/components/trips/TripCard";
import {
  useResponsiveFontSize,
  useResponsiveSpacing,
} from "@/hooks/use-responsive-size";
import { useScreenDimensions } from "@/hooks/use-screen-dimensions";
import type { Trip, TripStatus } from "@/lib/icepack/data";
import {
  getTripsWithShipments,
  updateTripStatus,
} from "@/lib/icepack/services";

type FilterKey = "all" | TripStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "planned", label: "Planned" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

function countByStatus(trips: Trip[], status: TripStatus) {
  return trips.filter((t) => t.status === status).length;
}

export default function ShipmentsScreen() {
  const insets = useSafeAreaInsets();
  const { isTablet } = useScreenDimensions();
  const titleSize = useResponsiveFontSize("2xl");
  const labelSize = useResponsiveFontSize("sm");
  const padding = useResponsiveSpacing("lg");

  const [loading, setLoading] = useState(true);
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const trips = await getTripsWithShipments();
        console.debug("ShipmentsScreen: loaded", trips.length, "trips");
        setAllTrips(trips);
      } catch (e) {
        console.error("ShipmentsScreen: failed to load", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredTrips = useMemo(
    () =>
      filter === "all"
        ? allTrips
        : allTrips.filter((t) => t.status === filter),
    [allTrips, filter],
  );

  const handleStatusChange = useCallback(
    async (tripId: number, newStatus: TripStatus) => {
      setActionLoading(tripId);
      try {
        console.debug("ShipmentsScreen: updating trip", tripId, "to", newStatus);
        await updateTripStatus(tripId, newStatus);
        setAllTrips((prev) =>
          prev.map((t) =>
            t.id === tripId ? { ...t, status: newStatus } : t,
          ),
        );
      } catch (e) {
        console.error("ShipmentsScreen: update failed", e);
        Alert.alert("Error", "Failed to update shipment status");
      } finally {
        setActionLoading(null);
      }
    },
    [],
  );

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
        <Text
          style={{ fontSize: titleSize, fontWeight: "700", color: "white" }}
        >
          All Shipments
        </Text>
        <Text
          style={{
            fontSize: labelSize,
            color: "rgba(255,255,255,0.6)",
            marginTop: 4,
          }}
        >
          {allTrips.length} total — {countByStatus(allTrips, "active")} active,{" "}
          {countByStatus(allTrips, "planned")} planned,{" "}
          {countByStatus(allTrips, "completed")} completed
        </Text>
      </LinearGradient>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: padding,
          paddingVertical: 12,
          gap: 8,
        }}
      >
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.7}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: active ? "#1a8ad4" : "#f4f8fa",
                borderWidth: 1,
                borderColor: active ? "#1a8ad4" : "#e8eef3",
              }}
            >
              <Text
                style={{
                  fontSize: labelSize,
                  fontWeight: "600",
                  color: active ? "white" : "#587a94",
                }}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#1a8ad4"
          style={{ marginTop: 32 }}
        />
      ) : filteredTrips.length === 0 ? (
        <View style={{ alignItems: "center", marginTop: 48, paddingHorizontal: padding }}>
          <Text
            style={{
              fontSize: labelSize,
              color: "#9bb4c7",
              textAlign: "center",
            }}
          >
            No {filter === "all" ? "" : filter} shipments found
          </Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: padding, gap: 12, paddingTop: 8 }}>
          {filteredTrips.map((trip) => (
            <View key={trip.id}>
              <TripCard trip={trip} />
              {trip.status === "planned" && (
                <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                  <TouchableOpacity
                    onPress={() => handleStatusChange(trip.id, "active")}
                    disabled={actionLoading === trip.id}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      backgroundColor: actionLoading === trip.id ? "#94c5e8" : "#14b8a6",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "700", fontSize: labelSize }}>
                      {actionLoading === trip.id ? "..." : "Start Trip"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleStatusChange(trip.id, "cancelled")}
                    disabled={actionLoading === trip.id}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      backgroundColor: actionLoading === trip.id ? "#f5a5a5" : "#ef4444",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "700", fontSize: labelSize }}>
                      {actionLoading === trip.id ? "..." : "Cancel"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              {trip.status === "active" && (
                <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                  <TouchableOpacity
                    onPress={() => handleStatusChange(trip.id, "completed")}
                    disabled={actionLoading === trip.id}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      backgroundColor: actionLoading === trip.id ? "#94c5e8" : "#1a8ad4",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "700", fontSize: labelSize }}>
                      {actionLoading === trip.id ? "..." : "Complete"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleStatusChange(trip.id, "cancelled")}
                    disabled={actionLoading === trip.id}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      backgroundColor: actionLoading === trip.id ? "#f5a5a5" : "#ef4444",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "700", fontSize: labelSize }}>
                      {actionLoading === trip.id ? "..." : "Cancel"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
