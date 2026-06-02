import React from "react";
import { View, Text } from "react-native";
import { Thermometer } from "lucide-react-native";

interface StorageProfile {
  label: string;
  minTemp: number;
  maxTemp: number;
  meltFactor: number;
  description?: string;
}

interface TempRangeCardProps {
  profile: StorageProfile;
}

/**
 * Returns NativeWind-compatible class strings based on temperature range.
 * Using explicit strings (not dynamic construction) so NativeWind's static
 * analysis can include them in the generated stylesheet.
 */
function getTempClasses(minTemp: number): {
  card: string;
  iconWrap: string;
  iconColor: string;
  valueColor: string;
  badge: string;
} {
  if (minTemp <= -18) {
    // Frozen — blue
    return {
      card: "bg-blue-50 border-blue-200",
      iconWrap: "bg-blue-100",
      iconColor: "#3b82f6",
      valueColor: "text-blue-600",
      badge: "text-blue-600",
    };
  }
  if (minTemp <= 0) {
    // Chilled — cyan
    return {
      card: "bg-cyan-50 border-cyan-200",
      iconWrap: "bg-cyan-100",
      iconColor: "#06b6d4",
      valueColor: "text-cyan-600",
      badge: "text-cyan-600",
    };
  }
  // Cool — teal
  return {
    card: "bg-teal-50 border-teal-200",
    iconWrap: "bg-teal-100",
    iconColor: "#0d9488",
    valueColor: "text-teal-600",
    badge: "text-teal-600",
  };
}

function MetaStat({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName: string;
}) {
  return (
    <View className="items-center gap-0.5">
      <Text className={`text-base font-bold ${valueClassName}`}>{value}</Text>
      <Text className="text-[10px] text-muted-foreground uppercase tracking-wide">
        {label}
      </Text>
    </View>
  );
}

export function TempRangeCard({ profile }: TempRangeCardProps) {
  const cls = getTempClasses(profile.minTemp);

  return (
    <View className={`rounded-2xl p-4 border ${cls.card}`}>
      {/* Top row */}
      <View className="flex-row items-center gap-3">
        <View className={`w-9 h-9 rounded-xl items-center justify-center ${cls.iconWrap}`}>
          <Thermometer size={18} color={cls.iconColor} />
        </View>

        <View className="flex-1">
          <Text className="text-sm font-bold text-sea-950">{profile.label}</Text>
          {profile.description && (
            <Text className="text-xs text-muted-foreground mt-0.5">
              {profile.description}
            </Text>
          )}
        </View>

        <Text className={`text-xs font-bold ${cls.badge}`}>
          {profile.minTemp}° - {profile.maxTemp}°C
        </Text>
      </View>

      {/* Divider */}
      <View className="h-px bg-black/[0.07] my-3" />

      {/* Stats row */}
      <View className="flex-row justify-around">
        <MetaStat
          label="Melt Factor"
          value={`${profile.meltFactor}×`}
          valueClassName={cls.valueColor}
        />
        <MetaStat
          label="Min Temp"
          value={`${profile.minTemp}°C`}
          valueClassName={cls.valueColor}
        />
        <MetaStat
          label="Max Temp"
          value={`${profile.maxTemp}°C`}
          valueClassName={cls.valueColor}
        />
      </View>
    </View>
  );
}