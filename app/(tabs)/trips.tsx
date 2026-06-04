import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TouchableOpacity, View, LayoutAnimation, Platform } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowDownUp, ChevronDown, ChevronUp, Package, ArrowRight } from "lucide-react-native";
import { ShipmentCard, type ShipmentView } from "@/components/shipments/ShipmentCard";
import { SearchFilterBar, type FilterOption } from "@/components/ui/SearchFilterBar";
import {
  useResponsiveFontSize,
  useResponsiveSpacing,
} from "@/hooks/use-responsive-size";
import type { Trip } from "@/lib/icepack/data";
import { formatHours, liveStateFor } from "@/lib/icepack/data";
import { getTripsWithAllShipments, type TripWithShipmentViews } from "@/lib/icepack/services";

type FilterStatus = "all" | "active" | "completed" | "planned";

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

const STATUS_BG_COLORS: Record<string, string> = {
  active: "#d1faf5",
  completed: "#dcfce7",
  cancelled: "#fee2e2",
  planned: "#cffafe",
};

const STATUS_CARD_BG: Record<string, string> = {
  active: "rgba(20, 184, 166, 0.095)",
  completed: "rgba(34, 197, 94, 0.095)",
  cancelled: "rgba(239, 68, 68, 0.095)",
  planned: "rgba(6, 182, 212, 0.095)",
};

function deriveTripStatus(shipments: ShipmentView[]): string {
  if (shipments.length === 0) return "planned";
  const allFinished = shipments.every(
    (s) => s.shipmentStatus === "completed" || s.shipmentStatus === "cancelled",
  );
  if (allFinished) return "completed";
  const anyActive = shipments.some((s) => s.shipmentStatus === "active");
  if (anyActive) return "active";
  return "planned";
}

export function TripHeader({
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
  const statusBgColor = STATUS_BG_COLORS[derivedStatus] ?? "#f1f5f9";
  const statusLabel = STATUS_LABELS[derivedStatus] ?? derivedStatus;

  function formatTimeLabel(iso: string | null, prefix: string): string | null {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    return `${prefix}: ${date} \u00B7 ${time}`;
  }

  let statusTimeText: string | null = null;
  if (derivedStatus === "active" && trip.startedAt) {
    statusTimeText = formatTimeLabel(trip.startedAt, "Departed");
  } else if (derivedStatus === "completed" && (trip.completedAt || trip.startedAt)) {
    statusTimeText = formatTimeLabel(trip.completedAt ?? trip.startedAt, "Delivered");
  } else if (derivedStatus === "cancelled" && (trip.completedAt || trip.startedAt)) {
    statusTimeText = formatTimeLabel(trip.completedAt ?? trip.startedAt, "Cancelled");
  }

  const durationText = derivedStatus === "active"
    ? formatHours(liveStateFor(trip).elapsedHours)
    : `${trip.durationHours}h`;

  const handleToggle = () => {
    if (Platform.OS !== "web") {
      LayoutAnimation.configureNext(
        LayoutAnimation.Presets.easeInEaseOut
      );
    }
    onToggle();
  };

  return (
    <View style={{ marginBottom: 0 }}>
      {/* Main Card Header */}
      <TouchableOpacity
        onPress={handleToggle}
        activeOpacity={0.7}
        style={{
          backgroundColor: STATUS_CARD_BG[derivedStatus] ?? "white",
          borderRadius: 12,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          borderBottomLeftRadius: isExpanded ? 0 : 12,
          borderBottomRightRadius: isExpanded ? 0 : 12,
          borderWidth: 1,
          borderColor: "#f0f4f8",
          shadowColor: "#0b2540",
          shadowOpacity: 0.05,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: isExpanded ? 0 : 1,
        }}
      >
        <View style={{ paddingVertical: 14, paddingHorizontal: 12, gap: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={{ fontSize: baseSize, fontWeight: "700", color: "#0f1419", marginBottom: 2 }} numberOfLines={1}>
                {trip.name}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ fontSize: smSize, color: "#64748b" }}>
                  Shipment
                </Text>
                <View
                  style={{
                    paddingHorizontal: 5,
                    paddingVertical: 2,
                    borderRadius: 5,
                    backgroundColor: "#dbeafe",
                  }}
                >
                  <Text style={{ fontSize: xsSize, fontWeight: "600", color: "#0284c7" }}>
                    {shipments.length}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                backgroundColor: statusBgColor,
              }}
            >
              <Text style={{ fontSize: xsSize, fontWeight: "600", color: statusColor, textTransform: "uppercase" }}>
                {statusLabel}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: xsSize, color: "#94a3b8", fontWeight: "600", marginBottom: 2, textTransform: "uppercase" }}>
                Items
              </Text>
              <Text style={{ fontSize: smSize, fontWeight: "700", color: "#0f1419" }}>
                {shipments.length}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: xsSize, color: "#94a3b8", fontWeight: "600", marginBottom: 2, textTransform: "uppercase" }}>
                Duration
              </Text>
              <Text style={{ fontSize: smSize, fontWeight: "700", color: "#0f1419" }}>
                {durationText}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: xsSize, color: "#94a3b8", fontWeight: "600", marginBottom: 2, textTransform: "uppercase" }}>
                Progress
              </Text>
              <Text style={{ fontSize: smSize, fontWeight: "700", color: statusColor }}>
                {Math.round((shipments.filter(s => s.shipmentStatus === "completed").length / shipments.length) * 100 || 0)}%
              </Text>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: "#f0f4f8" }} />

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              {statusTimeText ? (
                <Text style={{ fontSize: xsSize, color: "#64748b" }}>
                  {statusTimeText}
                </Text>
              ) : (
                <Text style={{ fontSize: xsSize, color: "#cbd5e1" }}>
                  {derivedStatus === "planned" ? "Scheduled" : "In progress"}
                </Text>
              )}
            </View>
            <View style={{ marginLeft: 8 }}>
              {isExpanded ? (
                <ChevronUp size={18} color="#cbd5e1" strokeWidth={2} />
              ) : (
                <ChevronDown size={18} color="#cbd5e1" strokeWidth={2} />
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded && (
        <View
          style={{
            backgroundColor: "#fafbfc",
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
            borderWidth: 1,
            borderTopWidth: 0,
            borderColor: "#f0f4f8",
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 16,
            shadowColor: "#0b2540",
            shadowOpacity: 0.05,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 1,
          }}
        >
          {/* Shipments List Header */}
          {shipments.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: xsSize, fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Items in this trip
              </Text>
            </View>
          )}

          {/* Shipments Cards */}
          <View style={{ gap: 10, marginBottom: 12 }}>
            {shipments.map((s) => (
              <ShipmentCard key={s.id} shipment={s} />
            ))}
          </View>

          {/* Empty State */}
          {shipments.length === 0 && (
            <View style={{ alignItems: "center", paddingVertical: 24 }}>
              <Package size={32} color="#cbd5e1" strokeWidth={1.5} />
              <Text style={{ fontSize: smSize, color: "#cbd5e1", marginTop: 8, fontWeight: "500" }}>
                No items yet
              </Text>
            </View>
          )}

          {/* View Details Button */}
          <TouchableOpacity
            onPress={() => router.push(`/trips/${trip.id}` as any)}
            activeOpacity={0.65}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 8,
              backgroundColor: "#f0f4f8",
              borderWidth: 1,
              borderColor: "#e2e8f0",
            }}
          >
            <Text style={{ fontSize: smSize, fontWeight: "600", color: "#1a8ad4" }}>
              View Trip Details
            </Text>
            <ArrowRight size={16} color="#1a8ad4" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      )}
    </View>
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
  const [sortBy, setSortBy] = useState<"date" | "name">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [sortOpen, setSortOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

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
    const planned = tripData.filter((t) => t.trip.status === "planned").length;
    return { all: tripData.length, active, completed, planned };
  }, [tripData]);

  const filteredTrips = useMemo(() => {
    let result = filter === "all" ? tripData : tripData.filter((t) => t.trip.status === filter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => t.trip.name.toLowerCase().includes(q));
    }
    result = [...result].sort((a, b) => {
      const cmp = sortBy === "name"
        ? a.trip.name.localeCompare(b.trip.name)
        : new Date(a.trip.createdAt).getTime() - new Date(b.trip.createdAt).getTime();
      return sortDir === "desc" ? -cmp : cmp;
    });
    return result;
  }, [tripData, filter, searchQuery, sortBy, sortDir]);

  const toggleExpand = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const filterOptions = useMemo<FilterOption[]>(() => [
    { key: "all", label: "All", count: counts.all },
    { key: "active", label: "Active", count: counts.active },
    { key: "completed", label: "Completed", count: counts.completed },
    { key: "planned", label: "Planned", count: counts.planned },
  ], [counts]);

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
          {counts.all} total · {counts.active} active · {counts.completed} completed · {counts.planned} planned
        </Text>
      </LinearGradient>

      <View style={{ paddingHorizontal: padding, paddingTop: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <SearchFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search trips..."
              options={filterOptions}
              filter={filter}
              onFilterChange={(key) => setFilter(key as FilterStatus)}
              labelSize={labelSize}
              hideFilter
            />
          </View>
          <TouchableOpacity
            onPress={() => setSortOpen(true)}
            activeOpacity={0.7}
            style={{
              padding: 10,
              borderRadius: 12,
              backgroundColor: sortOpen || filter !== "all" ? "#dbeafe" : "#f4f8fa",
              borderWidth: 1,
              borderColor: sortOpen || filter !== "all" ? "#bfdbfe" : "#e8eef3",
            }}
          >
            <ArrowDownUp size={16} color={sortOpen || filter !== "all" ? "#1a8ad4" : "#587a94"} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <Modal visible={sortOpen} transparent animationType="fade" onRequestClose={() => setSortOpen(false)}>
          <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.2)", justifyContent: "center", alignItems: "center" }} onPress={() => setSortOpen(false)}>
            <Pressable
              style={{
                backgroundColor: "white",
                borderRadius: 16,
                width: 240,
                paddingVertical: 8,
                shadowColor: "#0b2540",
                shadowOpacity: 0.15,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 8 },
                elevation: 8,
              }}
            >
              <Text style={{ fontSize: labelSize * 0.75, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
                Status
              </Text>
              {filterOptions.map((opt) => {
                const isActive = filter === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setFilter(opt.key as FilterStatus)}
                    activeOpacity={0.6}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: labelSize,
                        fontWeight: isActive ? "700" : "500",
                        color: isActive ? "#1a8ad4" : "#0b2540",
                      }}
                    >
                      {opt.label}
                    </Text>
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 8,
                        backgroundColor: isActive ? "rgba(26,138,212,0.12)" : "rgba(88,122,148,0.08)",
                        minWidth: 24,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: labelSize * 0.75, fontWeight: "700", color: isActive ? "#1a8ad4" : "#587a94" }}>
                        {opt.count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              <View style={{ height: 1, backgroundColor: "#f0f4f8", marginVertical: 8 }} />

              <Text style={{ fontSize: labelSize * 0.75, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, paddingHorizontal: 16, paddingBottom: 4 }}>
                Sort
              </Text>
              {([
                { key: "date" as const, label: "Newest", altLabel: "Oldest" },
                { key: "name" as const, label: "A–Z", altLabel: "Z–A" },
              ]).map(({ key, label, altLabel }) => {
                const active = sortBy === key;
                const displayLabel = active ? (sortDir === "asc" ? altLabel : label) : label;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => {
                      if (active) {
                        setSortDir((d) => d === "asc" ? "desc" : "asc");
                      } else {
                        setSortBy(key);
                        setSortDir(key === "name" ? "asc" : "desc");
                      }
                    }}
                    activeOpacity={0.6}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: labelSize,
                        fontWeight: active ? "700" : "500",
                        color: active ? "#1a8ad4" : "#0b2540",
                      }}
                    >
                      {displayLabel}
                    </Text>
                    {active && (
                      <ArrowDownUp size={14} color="#1a8ad4" strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </Pressable>
          </Pressable>
        </Modal>

        {filteredTrips.length === 0 ? (
          <Text style={{ fontSize: labelSize, color: "rgba(0,0,0,0.4)", textAlign: "center", marginTop: 16 }}>
            {searchQuery.trim()
              ? `No trips matching "${searchQuery}"`
              : filter === "all"
                ? "No trips found"
                : `No ${filter} trips found`}
          </Text>
        ) : (
          <View style={{ gap: 12, marginTop: 8 }}>
            {filteredTrips.map(({ trip, shipments }) => {
              const expanded = expandedIds.has(trip.id);
              return (
                <TripHeader
                  key={trip.id}
                  trip={trip}
                  shipments={shipments}
                  isExpanded={expanded}
                  onToggle={() => toggleExpand(trip.id)}
                />
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
