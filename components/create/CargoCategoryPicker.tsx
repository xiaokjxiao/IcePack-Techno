import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useScreenDimensions } from "@/hooks/use-screen-dimensions";
import type { CargoCategory, ProductCategory } from "@/lib/icepack/data";
import { ProductIcon } from "@/components/ui/ProductIcon";

interface CargoCategoryPickerProps {
  categories: ProductCategory[];
  selectedId: string;
  onSelect: (id: CargoCategory) => void;
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
                  ? "bg-[#e3f2fd] text-[#1e3a8a]"
                  : "bg-[#f4f8fa] border border-[#e8eef3]",
              ].join(" ")}
            >
              <ProductIcon name={p.icon} size={isTablet ? 28 : 24} />
              <Text
                className={[
                  isTablet ? "text-sm" : "text-xs",
                  "font-medium text-center leading-tight",
                  active ? "text-[#1e3a8a]" : "text-[#0b2540]",
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