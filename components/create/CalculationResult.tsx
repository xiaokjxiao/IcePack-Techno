import { View, Text, TouchableOpacity } from "react-native";
import { Snowflake, Clock, Gauge, CheckCircle2, Thermometer } from "lucide-react-native";
import { useScreenDimensions } from "@/hooks/use-screen-dimensions";
import type { IceDistribution, IceTypeKey } from "@/lib/icepack/data";

interface CalculationResultProps {
  recommendedIceKg: number;
  meltRateKgPerHr: number;
  safeDurationHours: number;
  iceDistribution: IceDistribution[];
  selectedIceTypeKey?: IceTypeKey | null;
  onSelectIceType?: (key: IceTypeKey) => void;
  ambientTempC?: number | null;
  ambientHumidityPct?: number | null;
  targetTempC?: number | null;
}

export function CalculationResult({
  recommendedIceKg,
  meltRateKgPerHr,
  safeDurationHours,
  iceDistribution,
  selectedIceTypeKey,
  onSelectIceType,
  ambientTempC,
  ambientHumidityPct,
  targetTempC,
}: CalculationResultProps) {
  const { isTablet } = useScreenDimensions();
  const canSelect = !!onSelectIceType;
  const hasWeather = ambientTempC != null;
  const selectedLabel = selectedIceTypeKey
    ? iceDistribution.find((d) => d.iceType.key === selectedIceTypeKey)?.iceType.label ?? ""
    : "";

  const fmtDuration = (hours: number): string => {
    if (hours <= 0) return "—";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  return (
    <View
      style={{
        backgroundColor: "white",
        borderRadius: 16,
        padding: isTablet ? 20 : 16,
        borderWidth: 1,
        borderColor: "#e8eef3",
        shadowColor: "#0b2540",
        shadowOpacity: 0.04,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
        <Snowflake size={16} color="#587a94" strokeWidth={1.5} />
        <Text
          style={{
            fontSize: (isTablet ? 14 : 13) * 0.9,
            fontWeight: "600",
            color: "#587a94",
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          Ice Calculation
        </Text>
        {canSelect && (
          <Text style={{ fontSize: 10, color: "#9bb4c7", marginLeft: 4 }}>
            (tap to select)
          </Text>
        )}
      </View>

      {hasWeather && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: "#f0f9ff",
            borderRadius: 8,
            padding: 8,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: "#bae6fd",
          }}
        >
          <Thermometer size={13} color="#0369a1" strokeWidth={1.5} />
          <Text style={{ fontSize: isTablet ? 12 : 11, color: "#0369a1", fontWeight: "500" }}>
            Ambient {ambientTempC}°C → target {targetTempC ?? "—"}°C
            {ambientHumidityPct != null ? ` · ${ambientHumidityPct}% humidity` : ""}
          </Text>
          <View style={{ flex: 1 }} />
        </View>
      )}

      {selectedIceTypeKey && recommendedIceKg > 0 && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            backgroundColor: "#f0fdf4",
            borderRadius: 10,
            padding: 12,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: "#bbf7d0",
          }}
        >
          <CheckCircle2 size={16} color="#16a34a" strokeWidth={2} />
          <Text style={{ fontSize: isTablet ? 13 : 12, color: "#166534", fontWeight: "600" }}>
            {selectedLabel}
          </Text>
          <View style={{ width: 1, height: 12, backgroundColor: "#bbf7d0" }} />
          <Text style={{ fontSize: isTablet ? 13 : 12, color: "#166534", fontWeight: "700" }}>
            {recommendedIceKg} kg
          </Text>
          <View style={{ width: 1, height: 12, backgroundColor: "#bbf7d0" }} />
          <Text style={{ fontSize: isTablet ? 12 : 11, color: "#15803d" }}>
            {meltRateKgPerHr} kg/hr
          </Text>
          <View style={{ width: 1, height: 12, backgroundColor: "#bbf7d0" }} />
          <Text style={{ fontSize: isTablet ? 12 : 11, color: "#15803d", fontWeight: "500" }}>
            {fmtDuration(safeDurationHours)} safe
          </Text>
        </View>
      )}

      {iceDistribution.length > 0 && (
        <View style={{ gap: 10 }}>
          {iceDistribution.map((d) => {
            const isSelected = selectedIceTypeKey === d.iceType.key;
            return (
              <TouchableOpacity
                key={d.iceType.key}
                onPress={canSelect ? () => onSelectIceType!(d.iceType.key) : undefined}
                activeOpacity={canSelect ? 0.7 : 1}
                disabled={!canSelect}
                style={{
                  backgroundColor: isSelected ? "#dbeafe" : "#f0f9ff",
                  borderRadius: 12,
                  padding: 14,
                  gap: 8,
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected ? "#3b82f6" : "#dbeafe",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        backgroundColor: isSelected ? "#3b82f6" : "#dbeafe",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      {isSelected ? (
                        <CheckCircle2 size={18} color="white" strokeWidth={2} />
                      ) : (
                        <Snowflake size={18} color="#3b82f6" strokeWidth={2} />
                      )}
                    </View>
                    <Text style={{ fontSize: isTablet ? 16 : 15, fontWeight: "700", color: "#12283b" }}>
                      {d.iceType.label}
                    </Text>
                  </View>
                  <Text style={{ fontSize: isTablet ? 16 : 15, fontWeight: "700", color: "#1a8ad4" }}>
                    {d.amountKg} kg
                  </Text>
                </View>

                <Text style={{ fontSize: isTablet ? 13 : 12, color: "#587a94" }}>
                  {d.iceType.commonlyUsedFor}
                </Text>

                <View style={{ flexDirection: "row", gap: 20 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Gauge size={13} color="#9bb4c7" strokeWidth={1.5} />
                    <Text style={{ fontSize: isTablet ? 12 : 11, color: "#587a94", fontWeight: "500" }}>
                      {d.meltRateKgPerHr} kg/hr
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Clock size={13} color="#9bb4c7" strokeWidth={1.5} />
                    <Text style={{ fontSize: isTablet ? 12 : 11, color: "#587a94", fontWeight: "500" }}>
                      {fmtDuration(d.safeDurationHours)} safe
                    </Text>
                  </View>
                  <View style={{ flex: 1 }} />
                  <Text style={{ fontSize: isTablet ? 10 : 9, color: "#9bb4c7" }}>
                    {d.iceType.meltRateRange}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}
