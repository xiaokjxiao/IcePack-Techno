import { StatCard } from "@/components/trips/StatCard";
import {
  useResponsiveFontSize,
  useResponsiveSpacing,
} from "@/hooks/use-responsive-size";
import { useScreenDimensions } from "@/hooks/use-screen-dimensions";
import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Header() {
  const insets = useSafeAreaInsets();
  const { isTablet, isLandscape } = useScreenDimensions();
  const titleFontSize = useResponsiveFontSize("3xl");
  const subtitleFontSize = useResponsiveFontSize("xs");
  const horizontalPadding = useResponsiveSpacing("lg");
  const verticalPadding = useResponsiveSpacing("lg");
  const gapSize = useResponsiveSpacing("md");

  const stats = {
    active: 3,
    planned: 2,
    completed: 8,
    critical: 1,
  };

  const statCards = [
    { label: "Active", value: String(stats.active).padStart(2, "0") },
    { label: "Completed", value: String(stats.completed).padStart(2, "0") },
    { label: "Planned", value: String(stats.planned).padStart(2, "0") },
    {
      label: "Critical",
      value: String(stats.critical).padStart(2, "0"),
      accent: true,
    },
  ];

  const isFourCol = isLandscape && !isTablet;
  const avatarSize = isTablet ? 48 : 40;
  const innerAvatarSize = isTablet ? 16 : 12;

  return (
    <LinearGradient
      colors={["#173E61", "#246EA2"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{
        paddingLeft: horizontalPadding,
        paddingRight: horizontalPadding,
        paddingBottom: verticalPadding,
        paddingTop: insets.top + 16,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: verticalPadding,
        }}
      >
        <View style={{ gap: 4 }}>
          <Text
            style={{
              fontSize: subtitleFontSize,
              fontWeight: "500",
              color: "rgba(255, 255, 255, 0.5)",
              textTransform: "uppercase",
              letterSpacing: 1.2,
            }}
          >
            Welcome aboard
          </Text>
          <Text
            style={{
              fontSize: titleFontSize,
              fontWeight: "700",
              color: "white",
            }}
          >
            Captain
          </Text>
        </View>
        <View
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.2)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: innerAvatarSize,
              height: innerAvatarSize,
              borderRadius: innerAvatarSize / 2,
              backgroundColor: "#06b6d4",
            }}
          />
        </View>
      </View>

      {isFourCol ? (
        <View style={{ flexDirection: "row", gap: gapSize }}>
          {statCards.map((card) => (
            <View key={card.label} style={{ flex: 1 }}>
              <StatCard
                label={card.label}
                value={card.value}
                accent={card.accent}
              />
            </View>
          ))}
        </View>
      ) : (
        <View style={{ flexDirection: "row", gap: gapSize }}>
          <View style={{ flex: 1, gap: gapSize }}>
            {statCards.slice(0, 2).map((card) => (
              <StatCard
                key={card.label}
                label={card.label}
                value={card.value}
                accent={card.accent}
              />
            ))}
          </View>
          <View style={{ flex: 1, gap: gapSize }}>
            {statCards.slice(2).map((card) => (
              <StatCard
                key={card.label}
                label={card.label}
                value={card.value}
                accent={card.accent}
              />
            ))}
          </View>
        </View>
      )}
    </LinearGradient>
  );
}
