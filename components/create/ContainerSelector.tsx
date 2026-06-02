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

interface ContainerSelectorProps {
  containers: string[];
  selected: string;
  onSelect: (container: string) => void;
}

export function ContainerSelector({
  containers,
  selected,
  onSelect,
}: ContainerSelectorProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (container: string) => {
    onSelect(container);
    setOpen(false);
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.75}
        className="flex-row items-center justify-between bg-white border border-border rounded-xl px-4 py-3.5"
      >
        <Text className="text-sm text-sea-900 flex-1">{selected}</Text>
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
        <SafeAreaView className="bg-white rounded-t-3xl px-6 pb-8 max-h-[60%]">
          {/* Handle */}
          <View className="w-9 h-1 bg-border rounded-full self-center mt-3 mb-4" />

          <Text className="text-base font-bold text-sea-950 mb-3">
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
                  className="flex-row items-center justify-between py-3.5"
                >
                  <Text
                    className={[
                      "text-sm",
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