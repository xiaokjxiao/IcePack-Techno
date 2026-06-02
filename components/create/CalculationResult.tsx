import React from "react";
import { View, Text } from "react-native";
import { useScreenDimensions } from "@/hooks/use-screen-dimensions";

interface CalculationResultProps {
  recommendedIceKg: number;
  meltRateKgPerHr: number;
  safeDurationHours: number;
}

function Row({
  label,
  value,
  strong,
  accent,
}: {
  label: string;
  value: string;
  strong?: boolean;
  accent?: boolean;
}) {
  const { isTablet } = useScreenDimensions();
  return (
    <View className={"flex-row justify-between items-center border-b border-border/60 last:border-b-0 " + (isTablet ? "py-3" : "py-2")}>
      <Text className={(isTablet ? "text-base" : "text-sm") + " text-sea-900"}>{label}</Text>
      <Text
        className={[
          "font-semibold",
          accent ? "text-ice-teal" : strong ? (isTablet ? "text-lg" : "text-base") + " text-sea-950" : "text-sea-950",
        ].join(" ")}
      >
        {value}
      </Text>
    </View>
  );
}

export function CalculationResult({
  recommendedIceKg,
  meltRateKgPerHr,
  safeDurationHours,
}: CalculationResultProps) {
  const { isTablet } = useScreenDimensions();

  return (
    <View className={"bg-white rounded-2xl border border-border shadow-card " + (isTablet ? "p-6" : "p-5")}>
      <View className="flex-row justify-between items-center mb-3">
        <Text className={(isTablet ? "text-sm" : "text-xs") + " font-semibold text-muted-foreground uppercase tracking-wider"}>
          Calculation Output
        </Text>
        <Text className={(isTablet ? "text-xs" : "text-[10px]") + " font-semibold text-sea-600 uppercase tracking-wider"}>
          Auto
        </Text>
      </View>

      <Row label="Recommended Ice" value={`${recommendedIceKg} kg`} strong />
      <Row label="Melt Rate" value={`${meltRateKgPerHr} kg/hr`} />
      <Row label="Safe Duration" value={`${safeDurationHours} hrs`} accent />
    </View>
  );
}