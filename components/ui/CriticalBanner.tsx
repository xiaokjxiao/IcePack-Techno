import React from "react";
import { TouchableOpacity, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { AlertCircle, ArrowRight } from "lucide-react-native";
import { useScreenDimensions } from "@/hooks/use-screen-dimensions";

interface CriticalBannerProps {
  count: number;
  firstName: string;
}

export function CriticalBanner({ count, firstName }: CriticalBannerProps) {
  const { isTablet } = useScreenDimensions();
  const textSize = isTablet ? "text-sm" : "text-xs";

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push("/(tabs)/shipments")}
      className="mx-4 rounded-2xl overflow-hidden"
    >
      <LinearGradient
        colors={["#dc2626", "#b91c1c"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className={isTablet ? "px-5 py-4" : "px-4 py-3"}
      >
        <View className="flex-row items-center gap-3">
          <View className="bg-white/20 rounded-full items-center justify-center" style={{ width: isTablet ? 36 : 28, height: isTablet ? 36 : 28 }}>
            <AlertCircle size={isTablet ? 20 : 16} color="#fff" />
          </View>
          <View className="flex-1">
            <Text className={`font-bold text-white ${isTablet ? "text-base" : "text-sm"}`}>
              {count === 1
                ? "Shipment in Critical Condition"
                : `${count} Shipments in Critical Condition`}
            </Text>
            <Text className={`text-white/80 mt-0.5 ${textSize}`} numberOfLines={1}>
              {count === 1
                ? `${firstName} — ice levels dangerously low`
                : `${firstName} and others need attention`}
            </Text>
          </View>
          <View className="flex-row items-center gap-1 bg-white/15 rounded-lg px-2.5 py-1.5">
            <Text className={`font-semibold text-white ${textSize}`}>View</Text>
            <ArrowRight size={isTablet ? 14 : 12} color="#fff" strokeWidth={2.5} />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}
