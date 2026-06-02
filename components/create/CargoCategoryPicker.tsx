import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useScreenDimensions } from "@/hooks/use-screen-dimensions";

interface ProductCategory {
  id: string;
  icon: string;
  label: string;
  description: string;
  profile: string;
}

interface CargoCategoryPickerProps {
  categories: ProductCategory[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function CargoCategoryPicker({
  categories,
  selectedId,
  onSelect,
}: CargoCategoryPickerProps) {
  const selected = categories.find((p) => p.id === selectedId);
  const { isTablet } = useScreenDimensions();

  return (
    <View>
      <View className="flex-row flex-wrap gap-2">
        {categories.map((p) => {
          const active = p.id === selectedId;
          return (
            <TouchableOpacity
              key={p.id}
              onPress={() => onSelect(p.id)}
              activeOpacity={0.75}
              className={[
                "flex-col items-center gap-1 px-2 py-3 rounded-xl",
                isTablet ? "basis-[23%]" : "basis-[31%]",
                active
                  ? "bg-sea-600 ring-2 ring-sea-600 shadow-card"
                  : "bg-white ring-1 ring-border",
              ].join(" ")}
            >
              <Text className={isTablet ? "text-xl" : "text-lg"}>{p.icon}</Text>
              <Text
                className={[
                  isTablet ? "text-sm" : "text-xs",
                  "font-medium text-center leading-tight",
                  active ? "text-white" : "text-sea-900",
                ].join(" ")}
                numberOfLines={2}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {selected && (
        <Text className="text-xs text-muted-foreground mt-2">
          {selected.description}
        </Text>
      )}
    </View>
  );
}