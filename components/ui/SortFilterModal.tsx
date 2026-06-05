import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import { ArrowDownUp } from "lucide-react-native";
import type { FilterOption } from "@/components/ui/SearchFilterBar";

interface SortFilterModalProps {
  visible: boolean;
  onClose: () => void;
  filter: string;
  onFilterChange: (key: string) => void;
  sortBy: "date" | "name";
  onSortByChange: (key: "date" | "name") => void;
  sortDir: "asc" | "desc";
  onSortDirChange: (dir: "asc" | "desc") => void;
  filterOptions: FilterOption[];
  labelSize: number;
}

export function SortFilterModal({
  visible,
  onClose,
  filter,
  onFilterChange,
  sortBy,
  onSortByChange,
  sortDir,
  onSortDirChange,
  filterOptions,
  labelSize,
}: SortFilterModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.2)", justifyContent: "center", alignItems: "center" }} onPress={onClose}>
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
                onPress={() => onFilterChange(opt.key)}
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
                    onSortDirChange(sortDir === "asc" ? "desc" : "asc");
                  } else {
                    onSortByChange(key);
                    onSortDirChange(key === "name" ? "asc" : "desc");
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
  );
}
