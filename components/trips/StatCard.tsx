import {
  useResponsiveFontSize,
  useResponsiveSpacing,
} from "@/hooks/use-responsive-size";
import { Text, View } from "react-native";

export function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  const labelFontSize = useResponsiveFontSize("xs");
  const valueFontSize = useResponsiveFontSize("2xl");
  const padding = useResponsiveSpacing("md");
  const marginBottom = useResponsiveSpacing("sm");

  return (
    <View
      style={{
        padding,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: accent
          ? "rgba(239, 68, 68, 0.25)"
          : "rgba(255, 255, 255, 0.15)",
        backgroundColor: accent
          ? "rgba(239, 68, 68, 0.40)"
          : "rgba(255, 255, 255, 0.1)",
      }}
    >
      <Text
        className="uppercase tracking-wider text-white"
        style={{
          fontSize: labelFontSize,
          marginBottom,
          fontWeight: "500",
        }}
      >
        {label}
      </Text>
      <Text
        className="text-white"
        style={{
          fontSize: valueFontSize,
          fontWeight: "600",
        }}
      >
        {value}
      </Text>
    </View>
  );
}
