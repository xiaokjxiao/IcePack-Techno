import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronDown, ChevronUp, Package } from "lucide-react-native";
import { ShipmentCard, type ShipmentView } from "@/components/shipments/ShipmentCard";
import {
  useResponsiveFontSize,
  useResponsiveSpacing,
} from "@/hooks/use-responsive-size";
import type { Trip } from "@/lib/icepack/data";

import { getTripsWithAllShipments, type TripWithShipmentViews } from "@/lib/icepack/services";

type FilterStatus = "all" | "active" | "completed";

const FILTERS: { key: FilterStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
];

const STATUS_COLORS: Record<string, string> = {
  active: "#14b8a6",
  completed: "#22c55e",
  cancelled: "#ef4444",
  planned: "#06b6d4",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  completed: "Delivered",
  cancelled: "Cancelled",
  planned: "Planned",
};

function deriveTripStatus(shipments: ShipmentView[]): string {
  if (shipments.length === 0) return "planned";
  const allCompleted = shipments.every((s) => s.shipmentStatus === "completed");
  if (allCompleted) return "completed";
  const allCancelled = shipments.every((s) => s.shipmentStatus === "cancelled");
  if (allCancelled) return "cancelled";
  const anyActive = shipments.some((s) => s.shipmentStatus === "active");
  if (anyActive) return "active";
  return "planned";
}

function TripHeader({
  trip,
  shipments,
  isExpanded,
  onToggle,
}: {
  trip: Trip;
  shipments: ShipmentView[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const baseSize = useResponsiveFontSize("base");
  const smSize = useResponsiveFontSize("sm");
  const xsSize = useResponsiveFontSize("xs");
  const derivedStatus = deriveTripStatus(shipments);
  const statusColor = STATUS_COLORS[derivedStatus] ?? "#94a3b8";
  const statusLabel = STATUS_LABELS[derivedStatus] ?? derivedStatus;

  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.7}
      style={{
        backgroundColor: "white",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#e8eef3",
        shadowColor: "#0b2540",
        shadowOpacity: 0.04,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          backgroundColor: statusColor,
        }}
      />
      <View style={{ padding: 16, paddingLeft: 20 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ fontSize: baseSize, fontWeight: "700", color: "#0b2540" }} numberOfLines={1}>
              {trip.name}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 8,
                  backgroundColor: statusColor + "20",
                }}
              >
                <Text style={{ fontSize: xsSize, fontWeight: "600", color: statusColor, textTransform: "uppercase" }}>
                  {statusLabel}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                <Package size={11} color="#587a94" />
                <Text style={{ fontSize: xsSize, color: "#587a94" }}>
                  {shipments.length}
                </Text>
              </View>
              <Text style={{ fontSize: xsSize, color: "#9bb4c7" }}>
                {trip.durationHours}h
              </Text>
            </View>
          </View>
          {isExpanded ? (
            <ChevronUp size={18} color="#9bb4c7" strokeWidth={2} />
          ) : (
            <ChevronDown size={18} color="#9bb4c7" strokeWidth={2} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function TripsScreen() {
  const insets = useSafeAreaInsets();
  const titleSize = useResponsiveFontSize("2xl");
  const labelSize = useResponsiveFontSize("sm");
  const padding = useResponsiveSpacing("lg");

  const [loading, setLoading] = useState(true);
  const [tripData, setTripData] = useState<TripWithShipmentViews[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        try {
          const data = await getTripsWithAllShipments();
          setTripData(data);
        } catch (e) {
          console.error("TripsScreen: failed to load", e);
        } finally {
          setLoading(false);
        }
      })();
    }, []),
  );

  const counts = useMemo(() => {
    const active = tripData.filter((t) => t.trip.status === "active").length;
    const completed = tripData.filter((t) => t.trip.status === "completed").length;
    return { all: tripData.length, active, completed };
  }, [tripData]);

  const filteredTrips = useMemo(() => {
    if (filter === "all") return tripData;
    return tripData.filter((t) => t.trip.status === filter);
  }, [tripData, filter]);

  const toggleExpand = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

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
        <View style={{ flexDirection: "row", flexWrap: "wrap", paddingVertical: 8, gap: 8 }}>
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
                <Text style={{ fontSize: labelSize, fontWeight: "600", color: active ? "white" : "#587a94" }}>
                  {f.label}
                </Text>
                <View
                  style={{
                    paddingHorizontal: 5,
                    paddingVertical: 1,
                    borderRadius: 9,
                    backgroundColor: active ? "rgba(255,255,255,0.25)" : "rgba(88,122,148,0.12)",
                    minWidth: 20,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: labelSize * 0.75, fontWeight: "700", color: active ? "white" : "#587a94" }}>
                    {counts[f.key]}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {filteredTrips.length === 0 ? (
          <Text style={{ fontSize: labelSize, color: "rgba(0,0,0,0.4)", textAlign: "center", marginTop: 32 }}>
            No {filter === "all" ? "" : filter} trips found
          </Text>
        ) : (
          <View style={{ gap: 10, marginTop: 8 }}>
            {filteredTrips.map(({ trip, shipments }) => {
              const expanded = expandedIds.has(trip.id);
              return (
                <View key={trip.id}>
                  <TripHeader
                    trip={trip}
                    shipments={shipments}
                    isExpanded={expanded}
                    onToggle={() => toggleExpand(trip.id)}
                  />
                  {expanded && (
                    <View style={{ paddingLeft: 20, paddingTop: 8, gap: 8 }}>
                      {shipments.map((s) => (
                        <ShipmentCard key={s.id} shipment={s} />
                      ))}
                      <TouchableOpacity
                        onPress={() => router.push(`/trips/${trip.id}` as any)}
                        activeOpacity={0.7}
                        style={{ alignItems: "center", paddingVertical: 12 }}
                      >
                        <Text style={{ fontSize: labelSize, fontWeight: "600", color: "#1a8ad4" }}>View Trip Details →</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
