import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { TripCard } from "@/components/trips/TripCard";
import {
  useResponsiveFontSize,
  useResponsiveSpacing,
} from "@/hooks/use-responsive-size";
import { useScreenDimensions } from "@/hooks/use-screen-dimensions";
import type { Trip } from "@/lib/icepack/data";
import { getTripsWithShipments } from "@/lib/icepack/services";

type TripStatus = "all" | "active" | "completed";

const FILTERS: { key: TripStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
];

export default function TripsScreen() {
  const insets = useSafeAreaInsets();
  const titleSize = useResponsiveFontSize("2xl");
  const labelSize = useResponsiveFontSize("sm");
  const padding = useResponsiveSpacing("lg");

  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filter, setFilter] = useState<TripStatus>("all");

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        try {
          const data = await getTripsWithShipments();
          setTrips(data);
        } catch (e) {
          console.error("TripsScreen: failed to load", e);
        } finally {
          setLoading(false);
        }
      })();
    }, []),
  );

  const counts = useMemo(() => {
    const active = trips.filter((t) => t.status === "active").length;
    const completed = trips.filter((t) => t.status === "completed").length;
    return { all: trips.length, active, completed };
  }, [trips]);

  const filteredTrips = useMemo(() => {
    if (filter === "all") return trips;
    return trips.filter((t) => t.status === filter);
  }, [trips, filter]);

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#1a8ad4" />
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
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <Text style={{ fontSize: titleSize, fontWeight: "700", color: "white" }}>
          Trips
        </Text>
        <Text style={{ fontSize: labelSize, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
          {counts.all} total · {counts.active} active · {counts.completed} completed
        </Text>
      </LinearGradient>

      <View style={{ paddingHorizontal: padding, paddingTop: 16 }}>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            paddingVertical: 8,
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
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 18,
                  backgroundColor: active ? "#1a8ad4" : "#f4f8fa",
                  borderWidth: 1,
                  borderColor: active ? "#1a8ad4" : "#e8eef3",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
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
                <View
                  style={{
                    paddingHorizontal: 5,
                    paddingVertical: 1,
                    borderRadius: 9,
                    backgroundColor: active
                      ? "rgba(255,255,255,0.25)"
                      : "rgba(88,122,148,0.12)",
                    minWidth: 20,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: labelSize * 0.75,
                      fontWeight: "700",
                      color: active ? "white" : "#587a94",
                    }}
                  >
                    {counts[f.key]}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {filteredTrips.length === 0 ? (
          <Text
            style={{
              fontSize: labelSize,
              color: "rgba(0,0,0,0.4)",
              textAlign: "center",
              marginTop: 32,
            }}
          >
            No {filter === "all" ? "" : filter} trips found
          </Text>
        ) : (
          <View style={{ gap: 12, marginTop: 8 }}>
            {filteredTrips.map((t) => (
              <TripCard key={t.id} trip={t} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
