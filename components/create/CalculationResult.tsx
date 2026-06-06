import { View, Text, TouchableOpacity } from "react-native";
import { Snowflake, Clock, Gauge, CheckCircle2 } from "lucide-react-native";
import { useScreenDimensions } from "@/hooks/use-screen-dimensions";
import type { IceDistribution, IceTypeKey } from "@/lib/icepack/data";

interface CalculationResultProps {
  recommendedIceKg: number;
  meltRateKgPerHr: number;
  safeDurationHours: number;
  iceDistribution: IceDistribution[];
  selectedIceTypeKey?: IceTypeKey | null;
  onSelectIceType?: (key: IceTypeKey) => void;
}

export function CalculationResult({
  iceDistribution,
  selectedIceTypeKey,
  onSelectIceType,
}: CalculationResultProps) {
  const { isTablet } = useScreenDimensions();
  const canSelect = !!onSelectIceType;

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
                  {d.iceType.characteristics}
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
                      {d.safeDurationHours} hrs safe
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}
