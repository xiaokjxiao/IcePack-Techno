import { useState } from "react";
import {
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ChevronDown, Search, X } from "lucide-react-native";

export type FilterOption = { key: string; label: string; count: number };

export function SearchFilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  options,
  filter,
  onFilterChange,
  labelSize,
  hideFilter,
}: {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchPlaceholder: string;
  options: FilterOption[];
  filter: string;
  onFilterChange: (key: string) => void;
  labelSize: number;
  hideFilter?: boolean;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const selected = options.find((o) => o.key === filter);
  const selectedLabel = selected ? selected.label : "All";

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#f4f8fa",
          borderRadius: 12,
          paddingHorizontal: 12,
          height: 40,
          borderWidth: 1,
          borderColor: "#e8eef3",
        }}
      >
        <Search size={16} color="#9bb4c7" strokeWidth={2} />
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder={searchPlaceholder}
          placeholderTextColor="#9bb4c7"
          style={{
            flex: 1,
            fontSize: labelSize,
            color: "#0b2540",
            marginLeft: 8,
            paddingVertical: 0,
          }}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange("")} activeOpacity={0.7}>
            <X size={14} color="#9bb4c7" strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>
      {!hideFilter && (
        <>
          <TouchableOpacity
            onPress={() => setDropdownOpen(true)}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#f4f8fa",
              borderRadius: 12,
              paddingHorizontal: 12,
              height: 40,
              gap: 4,
              borderWidth: 1,
              borderColor: "#e8eef3",
            }}
          >
            <Text style={{ fontSize: labelSize, fontWeight: "600", color: "#0b2540" }}>
              {selectedLabel}
            </Text>
            <ChevronDown size={14} color="#587a94" strokeWidth={2} />
          </TouchableOpacity>

          <Modal visible={dropdownOpen} transparent animationType="fade">
            <Pressable
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.3)",
                justifyContent: "center",
                alignItems: "center",
              }}
              onPress={() => setDropdownOpen(false)}
            >
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
                {options.map((opt) => {
                  const isActive = filter === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      onPress={() => {
                        onFilterChange(opt.key);
                        setDropdownOpen(false);
                      }}
                      activeOpacity={0.6}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingHorizontal: 16,
                        paddingVertical: 12,
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
                          backgroundColor: isActive
                            ? "rgba(26,138,212,0.12)"
                            : "rgba(88,122,148,0.08)",
                          minWidth: 24,
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: labelSize * 0.75,
                            fontWeight: "700",
                            color: isActive ? "#1a8ad4" : "#587a94",
                          }}
                        >
                          {opt.count}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </Pressable>
            </Pressable>
          </Modal>
        </>
      )}
    </View>
  );
}
