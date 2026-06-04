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
import { Layers } from "lucide-react-native";
import { ShipmentCard, type ShipmentView } from "@/components/shipments/ShipmentCard";
import { SearchFilterBar, type FilterOption } from "@/components/ui/SearchFilterBar";
import { SelectModeBanner } from "@/components/shipments/SelectModeBanner";
import { GroupTripModal } from "@/components/shipments/GroupTripModal";
import {
  useResponsiveFontSize,
  useResponsiveSpacing,
} from "@/hooks/use-responsive-size";
import {
  createGroupedTripFromShipments,
  getShipmentsWithTrips,
} from "@/lib/icepack/services";

export default function ShipmentsScreen() {
  const insets = useSafeAreaInsets();
  const titleSize = useResponsiveFontSize("2xl");
  const labelSize = useResponsiveFontSize("sm");
  const padding = useResponsiveSpacing("lg");

  const [loading, setLoading] = useState(true);
  const [allShipments, setAllShipments] = useState<ShipmentView[]>([]);
  const [filter, setFilter] = useState<string>("all");

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [groupName, setGroupName] = useState("");
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupLoading, setGroupLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredShipments = useMemo(
    () =>
      searchQuery.trim()
        ? filteredByStatus.filter((s) =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()),
          )
        : filteredByStatus,
    [filteredByStatus, searchQuery],
  );

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
        await createGroupedTripFromShipments(selected, name, startNow);
        setAllShipments([]);
        setSelectedIds(new Set());
        setSelectMode(false);
        setGroupName("");
        router.replace("/(tabs)/shipments");
      } catch (e) {
        console.error("ShipmentsScreen: group failed", e);
        Alert.alert("Error", e instanceof Error ? e.message : "Failed to create group trip");
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
              All Shipments
            </Text>
            <Text
              style={{
                fontSize: labelSize,
                color: "rgba(255,255,255,0.6)",
                marginTop: 4,
              }}
            >
              {allShipments.length} total —{" "}
              {allShipments.filter((s) => s.shipmentStatus === "active").length} active,{" "}
              {plannedShipments.length} planned,{" "}
              {allShipments.filter((s) => s.shipmentStatus === "completed").length} done
            </Text>
          </View>
          {!selectMode && (
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
          {selectMode && (
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

      {selectMode ? (
        <SelectModeBanner
          selectedCount={selectedIds.size}
          totalPlanned={plannedShipments.length}
          labelSize={labelSize}
        />
      ) : (
        <View style={{ paddingHorizontal: padding, paddingTop: 12 }}>
          <SearchFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search shipments..."
            options={filterOptions}
            filter={filter}
            onFilterChange={setFilter}
            labelSize={labelSize}
          />
        </View>
      )}

      {selectMode && selectedIds.size >= 2 && (
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
          <View style={{ alignItems: "center", marginTop: 48, paddingHorizontal: padding }}>
            <Text
              style={{
                fontSize: labelSize,
                color: "#9bb4c7",
                textAlign: "center",
              }}
            >
              {searchQuery.trim()
                ? `No shipments matching "${searchQuery}"`
                : `No ${filter === "all" ? "" : filter} shipments found`}
            </Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: padding, gap: 12, paddingTop: 8 }}>
            {filteredShipments.map((shipment) => (
              <ShipmentCard
                key={shipment.id}
                shipment={shipment}
                selectable={selectMode && shipment.isPlanned}
                selected={selectedIds.has(shipment.id)}
                onToggleSelect={
                  selectMode && shipment.isPlanned
                    ? handleToggleSelect
                    : undefined
                }
              />
            ))}
          </View>
        )}
      </ScrollView>

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
    </View>
  );
}
