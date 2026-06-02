import React from "react";
import { View, Text } from "react-native";
import { Thermometer } from "lucide-react-native";
import { useScreenDimensions } from "@/hooks/use-screen-dimensions";

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

function getTempClasses(minTemp: number): {
  card: string;
  iconWrap: string;
  iconColor: string;
  valueColor: string;
  badge: string;
} {
  if (minTemp <= -18) {
    return {
      card: "bg-blue-50 border-blue-200",
      iconWrap: "bg-blue-100",
      iconColor: "#3b82f6",
      valueColor: "text-blue-600",
      badge: "text-blue-600",
    };
  }
  if (minTemp <= 0) {
    return {
      card: "bg-cyan-50 border-cyan-200",
      iconWrap: "bg-cyan-100",
      iconColor: "#06b6d4",
      valueColor: "text-cyan-600",
      badge: "text-cyan-600",
    };
  }
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
  const { isTablet } = useScreenDimensions();
  return (
    <View className="items-center gap-0.5">
      <Text className={"font-bold " + valueClassName}>{value}</Text>
      <Text className={"text-muted-foreground uppercase tracking-wide " + (isTablet ? "text-xs" : "text-[10px]")}>
        {label}
      </Text>
    </View>
  );
}

export function TempRangeCard({ profile }: TempRangeCardProps) {
  const cls = getTempClasses(profile.minTemp);
  const { isTablet } = useScreenDimensions();

  return (
    <View className={`rounded-2xl border ${isTablet ? "p-5" : "p-4"} ${cls.card}`}>
      {/* Top row */}
      <View className="flex-row items-center gap-3">
        <View className={(isTablet ? "w-11 h-11" : "w-9 h-9") + " rounded-xl items-center justify-center " + cls.iconWrap}>
          <Thermometer size={isTablet ? 22 : 18} color={cls.iconColor} />
        </View>

        <View className="flex-1">
          <Text className={"font-bold text-sea-950 " + (isTablet ? "text-base" : "text-sm")}>{profile.label}</Text>
          {profile.description && (
            <Text className={(isTablet ? "text-sm" : "text-xs") + " text-muted-foreground mt-0.5"}>
              {profile.description}
            </Text>
          )}
        </View>

        <Text className={"font-bold " + (isTablet ? "text-sm" : "text-xs") + " " + cls.badge}>
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