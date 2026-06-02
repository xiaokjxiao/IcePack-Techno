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
    <View
      className={"flex-row justify-between items-center " + (isTablet ? "py-3" : "py-2")}
      style={{ borderBottomWidth: 1, borderBottomColor: "rgba(232, 238, 243, 0.6)" }}
    >
      <Text
        className={isTablet ? "text-base" : "text-sm"}
        style={{ color: "#0b2540" }}
      >
        {label}
      </Text>
      <Text
        className={"font-semibold " + (strong ? (isTablet ? "text-lg" : "text-base") : "")}
        style={{ color: accent ? "#14b8a6" : "#0b2540" }}
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
    <View
      className={"rounded-2xl " + (isTablet ? "p-6" : "p-5")}
      style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: "#e8eef3", shadowColor: "#0b2540", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
    >
      <View className="flex-row justify-between items-center mb-3">
        <Text
          className={(isTablet ? "text-sm" : "text-xs") + " font-semibold uppercase tracking-wider"}
          style={{ color: "#587a94" }}
        >
          Calculation Output
        </Text>
        <Text
          className={(isTablet ? "text-xs" : "text-[10px]") + " font-semibold uppercase tracking-wider"}
          style={{ color: "#1a8ad4" }}
        >
          Auto
        </Text>
      </View>

      <Row label="Recommended Ice" value={`${recommendedIceKg} kg`} strong />
      <Row label="Melt Rate" value={`${meltRateKgPerHr} kg/hr`} />
      <Row label="Safe Duration" value={`${safeDurationHours} hrs`} accent />
    </View>
  );
}