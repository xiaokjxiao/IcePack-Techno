import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
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
  const [sortBy, setSortBy] = useState<"date" | "name">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [sortOpen, setSortOpen] = useState(false);

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
                  onPress={() => setFilter(opt.key)}
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
