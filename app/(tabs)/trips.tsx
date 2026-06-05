import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowDownUp } from "lucide-react-native";
import { TripHeader } from "@/components/trips/TripHeader";
import { SearchFilterBar, type FilterOption } from "@/components/ui/SearchFilterBar";
import { SortFilterModal } from "@/components/ui/SortFilterModal";
import {
  useResponsiveFontSize,
  useResponsiveSpacing,
} from "@/hooks/use-responsive-size";
import { getTripsWithAllShipments, type TripWithShipmentViews } from "@/lib/icepack/services";

type FilterStatus = "all" | "active" | "completed" | "planned";

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

        <SortFilterModal
          visible={sortOpen}
          onClose={() => setSortOpen(false)}
          filter={filter}
          onFilterChange={(key) => setFilter(key as FilterStatus)}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortDir={sortDir}
          onSortDirChange={setSortDir}
          filterOptions={filterOptions}
          labelSize={labelSize}
        />

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
