import React from "react";
import { View, Text } from "react-native";
import { Container } from "lucide-react-native";
import { type ContainerProfile, type StorageProfileKey } from "@/lib/icepack/data";
import { useScreenDimensions } from "@/hooks/use-screen-dimensions";

interface ContainerRecommendationCardProps {
  container: ContainerProfile;
  profile: StorageProfileKey;
}

function getProfileColors(profile: StorageProfileKey) {
  switch (profile) {
    case "deep":
      return {
        bg: "bg-blue-50",
        border: "border-blue-200",
        iconBg: "bg-blue-100",
        icon: "#3b82f6",
        heading: "text-blue-700",
        name: "text-blue-900",
        desc: "text-blue-600",
      };
    case "freezer":
      return {
        bg: "bg-cyan-50",
        border: "border-cyan-200",
        iconBg: "bg-cyan-100",
        icon: "#06b6d4",
        heading: "text-cyan-700",
        name: "text-cyan-900",
        desc: "text-cyan-600",
      };
    case "chilled":
      return {
        bg: "bg-teal-50",
        border: "border-teal-200",
        iconBg: "bg-teal-100",
        icon: "#0d9488",
        heading: "text-teal-700",
        name: "text-teal-900",
        desc: "text-teal-600",
      };
    case "ac":
    default:
      return {
        bg: "bg-stone-50",
        border: "border-stone-200",
        iconBg: "bg-stone-200",
        icon: "#78716c",
        heading: "text-stone-700",
        name: "text-stone-900",
        desc: "text-stone-500",
      };
  }
}

export function ContainerRecommendationCard({ container, profile }: ContainerRecommendationCardProps) {
  const { isTablet } = useScreenDimensions();
  const c = getProfileColors(profile);

  return (
    <View className={`rounded-2xl border ${isTablet ? "p-5" : "p-4"} ${c.bg} ${c.border}`}>
      <View className="flex-row items-center gap-3">
        <View className={`rounded-xl items-center justify-center ${c.iconBg} ${isTablet ? "w-11 h-11" : "w-9 h-9"}`}>
          <Container size={isTablet ? 22 : 18} color={c.icon} />
        </View>
        <View className="flex-1">
          <Text className={`font-bold ${isTablet ? "text-base" : "text-sm"} ${c.heading}`}>
            Recommended Container
          </Text>
          <Text className={`font-semibold mt-1 ${isTablet ? "text-lg" : "text-base"} ${c.name}`}>
            {container.name}
          </Text>
          <Text className={`${isTablet ? "text-sm" : "text-xs"} mt-0.5 ${c.desc}`}>
            {container.description}
          </Text>
        </View>
      </View>
    </View>
  );
}
