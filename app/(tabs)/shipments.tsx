import { useCallback, useMemo, useState } from "react";
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
import { router, useFocusEffect } from "expo-router";
import { ArrowDownUp, Layers } from "lucide-react-native";
import { ShipmentCard, type ShipmentView } from "@/components/shipments/ShipmentCard";
import { SearchFilterBar, type FilterOption } from "@/components/ui/SearchFilterBar";
import { SortFilterModal } from "@/components/ui/SortFilterModal";
import { SelectModeBanner } from "@/components/shipments/SelectModeBanner";
import { GroupTripModal } from "@/components/shipments/GroupTripModal";
import { AssignTripModal } from "@/components/shipments/AssignTripModal";
import { useUserRole } from "@/hooks/use-user-role";
import {
  useResponsiveFontSize,
  useResponsiveSpacing,
} from "@/hooks/use-responsive-size";
import {
  createGroupedTripFromShipments,
  getPlannedTrips,
  getShipmentsWithTrips,
  updateShipmentTrip,
} from "@/lib/icepack/services";
import { withRetry, isNetworkError, getUserNetworkErrorMessage } from "@/lib/network";

export default function ShipmentsScreen() {
  const insets = useSafeAreaInsets();
  const titleSize = useResponsiveFontSize("2xl");
  const labelSize = useResponsiveFontSize("sm");
  const padding = useResponsiveSpacing("lg");

  const [loading, setLoading] = useState(true);
  const [allShipments, setAllShipments] = useState<ShipmentView[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "name">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [sortOpen, setSortOpen] = useState(false);

  const { isTracker } = useUserRole();

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [groupName, setGroupName] = useState("");
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupLoading, setGroupLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningShipmentId, setAssigningShipmentId] = useState<number | null>(null);
  const [plannedTrips, setPlannedTrips] = useState<{ id: number; trip_name: string }[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        try {
          const shipments = await getShipmentsWithTrips();
          setAllShipments(shipments);
        } catch (e) {
          console.error("ShipmentsScreen: failed to load", e);
        } finally {
          setLoading(false);
        }
      })();
    }, []),
  );

  const filteredByStatus = useMemo(
    () => {
      if (filter === "all") return allShipments;
      return allShipments.filter((s) => s.shipmentStatus === filter);
    },
    [allShipments, filter],
  );

  const filteredShipments = useMemo(() => {
    let result = searchQuery.trim()
      ? filteredByStatus.filter((s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : filteredByStatus;

    result = [...result].sort((a, b) => {
      const cmp = sortBy === "name"
        ? a.name.localeCompare(b.name)
        : a.id - b.id;
      return sortDir === "desc" ? -cmp : cmp;
    });
    return result;
  }, [filteredByStatus, searchQuery, sortBy, sortDir]);

  const plannedShipments = useMemo(
    () => allShipments.filter((s) => s.isPlanned),
    [allShipments],
  );

  const filterOptions = useMemo<FilterOption[]>(() => [
    { key: "all", label: "All", count: allShipments.length },
    { key: "active", label: "Active", count: allShipments.filter((s) => s.shipmentStatus === "active").length },
    { key: "planned", label: "Planned", count: plannedShipments.length },
    { key: "completed", label: "Completed", count: allShipments.filter((s) => s.shipmentStatus === "completed").length },
    { key: "cancelled", label: "Cancelled", count: allShipments.filter((s) => s.shipmentStatus === "cancelled").length },
  ], [allShipments, plannedShipments]);

  const handleToggleSelect = useCallback((shipmentId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(shipmentId)) {
        next.delete(shipmentId);
      } else {
        next.add(shipmentId);
      }
      return next;
    });
  }, []);

  const handleGroup = useCallback(async () => {
    if (selectedIds.size < 2) {
      Alert.alert("Select at least 2 shipments to group");
      return;
    }
    setShowGroupModal(true);
  }, [selectedIds]);

  const handleCreateGroupedTrip = useCallback(
    async (startNow: boolean) => {
      const name = groupName.trim();
      if (!name) {
        Alert.alert("Please enter a group name");
        return;
      }
      setGroupLoading(true);
      setShowGroupModal(false);
      try {
        const selected = allShipments.filter((s) => selectedIds.has(s.id));
        await withRetry(() => createGroupedTripFromShipments(selected, name, startNow));
        setAllShipments([]);
        setSelectedIds(new Set());
        setSelectMode(false);
        setGroupName("");
        router.replace("/(tabs)/shipments");
      } catch (e) {
        const msg = getUserNetworkErrorMessage(e);
        console.error("ShipmentsScreen: group failed", msg, "| raw:", String(e ?? ""));
        Alert.alert(isNetworkError(e) ? "No Internet Connection" : "Error", msg);
      } finally {
        setGroupLoading(false);
      }
    },
    [groupName, selectedIds, allShipments],
  );

  const handleCancelGroup = useCallback(() => {
    setShowGroupModal(false);
    setGroupName("");
  }, []);

  const handleOpenAssign = useCallback(async (shipmentId: number) => {
    setAssigningShipmentId(shipmentId);
    setSelectedTripId(null);
    setShowAssignModal(true);
    try {
      const trips = await getPlannedTrips();
      setPlannedTrips(trips.map((t) => ({ id: t.id, trip_name: t.trip_name })));
    } catch (e) {
      console.error("Failed to load planned trips", e);
      setPlannedTrips([]);
    }
  }, []);

  const handleAssignToTrip = useCallback(async () => {
    if (!assigningShipmentId || !selectedTripId) return;
    setAssignLoading(true);
    try {
      await updateShipmentTrip(assigningShipmentId, selectedTripId, true);
      setAllShipments([]);
      setShowAssignModal(false);
      setAssigningShipmentId(null);
      setSelectedTripId(null);
      router.replace("/(tabs)/shipments");
    } catch (e) {
      console.error("Failed to assign shipment to trip", e);
      Alert.alert("Error", "Failed to assign shipment to trip");
    } finally {
      setAssignLoading(false);
    }
  }, [assigningShipmentId, selectedTripId]);

  return (
    <View className="flex-1 bg-white">
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
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: titleSize, fontWeight: "700", color: "white" }}
            >
              Shipments
            </Text>
            <Text
              style={{
                fontSize: labelSize,
                color: "rgba(255,255,255,0.5)",
                marginTop: 4,
              }}
            >
              {allShipments.length} total ·{" "}
              {allShipments.filter((s) => s.shipmentStatus === "active").length} active ·{" "}
              {plannedShipments.length} planned ·{" "}
              {allShipments.filter((s) => s.shipmentStatus === "completed").length} completed
            </Text>
          </View>
          {!isTracker && !selectMode && (
            <TouchableOpacity
              onPress={() => {
                if (plannedShipments.length < 2) {
                  Alert.alert(
                    "Not enough planned shipments",
                    "You need at least 2 planned shipments to create a group trip. Create shipments with 'Save as Planned' first.",
                  );
                  return;
                }
                setSelectMode(true);
                setFilter("planned");
                setSearchQuery("");
              }}
              activeOpacity={0.7}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: "rgba(255,255,255,0.15)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.25)",
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Layers size={14} color="white" strokeWidth={2} />
              <Text
                style={{
                  fontSize: labelSize,
                  fontWeight: "600",
                  color: "white",
                }}
              >
                Group
              </Text>
            </TouchableOpacity>
          )}
          {!isTracker && selectMode && (
            <TouchableOpacity
              onPress={() => {
                setSelectMode(false);
                setSelectedIds(new Set());
              }}
              activeOpacity={0.7}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: "rgba(239, 68, 68, 0.2)",
                borderWidth: 1,
                borderColor: "rgba(239, 68, 68, 0.3)",
              }}
            >
              <Text
                style={{
                  fontSize: labelSize,
                  fontWeight: "600",
                  color: "#fca5a5",
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {!isTracker && selectMode ? (
        <SelectModeBanner
          selectedCount={selectedIds.size}
          totalPlanned={plannedShipments.length}
          labelSize={labelSize}
        />
      ) : (
        <View style={{ paddingHorizontal: padding, paddingTop: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <SearchFilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search shipments..."
                options={filterOptions}
                filter={filter}
                onFilterChange={setFilter}
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
        </View>
      )}

      <SortFilterModal
        visible={sortOpen}
        onClose={() => setSortOpen(false)}
        filter={filter}
        onFilterChange={setFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortDir={sortDir}
        onSortDirChange={setSortDir}
        filterOptions={filterOptions}
        labelSize={labelSize}
      />

      {!isTracker && selectMode && selectedIds.size >= 2 && (
        <TouchableOpacity
          onPress={handleGroup}
          activeOpacity={0.8}
          disabled={groupLoading}
          style={{
            marginHorizontal: padding,
            marginBottom: 12,
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: groupLoading ? "#94c5e8" : "#0b2540",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: labelSize,
              fontWeight: "700",
              color: "white",
            }}
          >
            {groupLoading ? "Grouping..." : `Create Trip (${selectedIds.size})`}
          </Text>
        </TouchableOpacity>
      )}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#1a8ad4"
            style={{ marginTop: 32 }}
          />
        ) : filteredShipments.length === 0 ? (
          <Text style={{ fontSize: labelSize, color: "rgba(0,0,0,0.4)", textAlign: "center", marginTop: 16, paddingHorizontal: padding }}>
            {searchQuery.trim()
              ? `No shipments matching "${searchQuery}"`
              : `No ${filter === "all" ? "" : filter} shipments found`}
          </Text>
        ) : (
          <View style={{ paddingHorizontal: padding, gap: 12, paddingTop: 8 }}>
            {filteredShipments.map((shipment) => (
              <ShipmentCard
                key={shipment.id}
                shipment={shipment}
                selectable={!isTracker && selectMode && shipment.isPlanned}
                selected={selectedIds.has(shipment.id)}
                onToggleSelect={
                  !isTracker && selectMode && shipment.isPlanned
                    ? handleToggleSelect
                    : undefined
                }
                onAssign={
                  !isTracker && !selectMode && shipment.isPlanned && !shipment.tripId
                    ? handleOpenAssign
                    : undefined
                }
              />
            ))}
          </View>
        )}
      </ScrollView>

      {!isTracker && (
        <>
          <GroupTripModal
            visible={showGroupModal}
            selectedCount={selectedIds.size}
            groupName={groupName}
            onGroupNameChange={setGroupName}
            groupLoading={groupLoading}
            onCreateStart={() => handleCreateGroupedTrip(true)}
            onSavePlanned={() => handleCreateGroupedTrip(false)}
            onCancel={handleCancelGroup}
            titleSize={titleSize}
            labelSize={labelSize}
          />

          <AssignTripModal
            visible={showAssignModal}
            onClose={() => setShowAssignModal(false)}
            plannedTrips={plannedTrips}
            selectedTripId={selectedTripId}
            onSelectTrip={setSelectedTripId}
            onAssign={handleAssignToTrip}
            assignLoading={assignLoading}
            labelSize={labelSize}
          />
        </>
      )}
    </View>
  );
}
