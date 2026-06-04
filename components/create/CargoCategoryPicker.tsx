import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useScreenDimensions, useBreakpointValue } from "@/hooks/use-screen-dimensions";
import type { CargoCategory, ProductCategory } from "@/lib/icepack/data";
import { ProductIcon } from "@/components/ui/ProductIcon";

const basisForColumns: Record<number, string> = {
  2: "basis-[48%]",
  3: "basis-[31%]",
  4: "basis-[23%]",
  5: "basis-[18%]",
  6: "basis-[15%]",
};

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
  const { isSmallDevice } = useScreenDimensions();

  const cols = useBreakpointValue({ base: 3, sm: 3, md: 4, lg: 5, xl: 6, default: 3 });
  const numColumns = isSmallDevice ? 2 : cols ?? 3;

  return (
    <View className="w-full px-2">
      <View className="flex-row flex-wrap gap-2 justify-center">
        {categories.map((p) => {
          const active = p.id === selectedId;
          return (
            <TouchableOpacity
              key={p.id}
              onPress={() => onSelect(p.id)}
              activeOpacity={0.75}
              className={[
                "flex-col items-center gap-1 px-2 py-3 rounded-xl",
                basisForColumns[numColumns] ?? "basis-[31%]",
                active
                  ? "bg-[#e3f2fd] text-[#1e3a8a]"
                  : "bg-[#f4f8fa] border border-[#e8eef3]",
              ].join(" ")}
            >
              <ProductIcon name={p.icon} size={numColumns >= 5 ? 22 : numColumns >= 4 ? 26 : 24} />
              <Text
                className={[
                  numColumns >= 5 ? "text-[10px]" : numColumns >= 4 ? "text-sm" : "text-xs",
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