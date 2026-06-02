import React from "react";
import { View, Text } from "react-native";

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
  return (
    <View className="flex-row justify-between items-center py-2 border-b border-border/60 last:border-b-0">
      <Text className="text-sm text-sea-900">{label}</Text>
      <Text
        className={[
          "font-semibold",
          accent ? "text-ice-teal" : strong ? "text-base text-sea-950" : "text-sea-950",
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
  return (
    <View className="bg-white rounded-2xl p-5 border border-border shadow-card">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Calculation Output
        </Text>
        <Text className="text-[10px] font-semibold text-sea-600 uppercase tracking-wider">
          Auto
        </Text>
      </View>

      <Row label="Recommended Ice" value={`${recommendedIceKg} kg`} strong />
      <Row label="Melt Rate" value={`${meltRateKgPerHr} kg/hr`} />
      <Row label="Safe Duration" value={`${safeDurationHours} hrs`} accent />
    </View>
  );
}