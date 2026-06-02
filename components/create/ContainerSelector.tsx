import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
} from "react-native";
import { ChevronDown, Check } from "lucide-react-native";
import { useScreenDimensions } from "@/hooks/use-screen-dimensions";
import type { ContainerType } from "@/lib/icepack/data";

interface ContainerSelectorProps {
  containers: ContainerType[];
  selected: string;
  onSelect: (container: ContainerType) => void;
}

export function ContainerSelector({
  containers,
  selected,
  onSelect,
}: ContainerSelectorProps) {
  const [open, setOpen] = useState(false);
  const { isTablet } = useScreenDimensions();

  const handleSelect = (container: ContainerType) => {
    onSelect(container);
    setOpen(false);
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.75}
        className={
          "flex-row items-center justify-between bg-white border border-border rounded-xl " +
          (isTablet ? "px-5 py-4" : "px-4 py-3.5")
        }
      >
        <Text className={"text-sea-900 flex-1 " + (isTablet ? "text-base" : "text-sm")}>
          {selected}
        </Text>
        <ChevronDown size={16} className="text-muted-foreground" />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        {/* Backdrop */}
        <TouchableOpacity
          className="flex-1 bg-black/35"
          activeOpacity={1}
          onPress={() => setOpen(false)}
        />

        {/* Bottom sheet */}
        <SafeAreaView
          className={
            "bg-white rounded-t-3xl pb-8 " +
            (isTablet ? "px-8 max-h-[50%]" : "px-6 max-h-[60%]")
          }
        >
          {/* Handle */}
          <View className="w-9 h-1 bg-border rounded-full self-center mt-3 mb-4" />

          <Text className={"font-bold text-sea-950 mb-3 " + (isTablet ? "text-lg" : "text-base")}>
            Container Type
          </Text>

          <FlatList
            data={containers}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const isSelected = item === selected;
              return (
                <TouchableOpacity
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                  className={"flex-row items-center justify-between " + (isTablet ? "py-4" : "py-3.5")}
                >
                  <Text
                    className={[
                      isTablet ? "text-base" : "text-sm",
                      isSelected
                        ? "text-sea-600 font-semibold"
                        : "text-sea-900",
                    ].join(" ")}
                  >
                    {item}
                  </Text>
                  {isSelected && (
                    <Check size={16} className="text-sea-600" />
                  )}
                </TouchableOpacity>
              );
            }}
            ItemSeparatorComponent={() => (
              <View className="h-px bg-border/50" />
            )}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}