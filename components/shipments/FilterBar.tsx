import { Text, TouchableOpacity, View } from "react-native";
import type { TripStatus } from "@/lib/icepack/data";
import type { ShipmentView } from "@/components/shipments/ShipmentCard";

export type FilterKey = "all" | TripStatus;

export const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "planned", label: "Planned" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

export function filterCount(shipments: ShipmentView[], key: FilterKey): number {
  if (key === "all") return shipments.length;
  if (key === "planned") return shipments.filter((s) => s.isPlanned).length;
  return shipments.filter((s) => s.tripStatus === key).length;
}

export function FilterBar({
  shipments,
  filter,
  labelSize,
  onFilterChange,
}: {
  shipments: ShipmentView[];
  filter: FilterKey;
  labelSize: number;
  onFilterChange: (key: FilterKey) => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
      }}
    >
      {FILTERS.map((f) => {
        const active = filter === f.key;
        const count = filterCount(shipments, f.key);
        return (
          <TouchableOpacity
            key={f.key}
            onPress={() => onFilterChange(f.key)}
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
                {count}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
