import { Tabs } from "expo-router";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import "@/global.css";
import {
  useResponsiveFontSize,
  useResponsiveSpacing,
} from "@/hooks/use-responsive-size";
import { useScreenDimensions } from "@/hooks/use-screen-dimensions";

function useTabBarStyle() {
  const { isTablet, isSmallDevice, width } = useScreenDimensions();
  const labelFontSize = useResponsiveFontSize("xs");
  const paddingBottom = useResponsiveSpacing("sm");
  const paddingTop = useResponsiveSpacing("sm");

  // Responsive height calculation
  const baseHeight = 80;
  const tabletHeight = 88;
  const smallHeight = 72;
  const tabBarHeight = isTablet
    ? tabletHeight
    : isSmallDevice
      ? smallHeight
      : baseHeight;

  return {
    tabBarStyle: {
      backgroundColor: "#fff",
      borderTopColor: Colors.light.border,
      height: tabBarHeight + paddingBottom + paddingTop,
      paddingBottom: Math.round(paddingBottom),
      paddingTop: Math.round(paddingTop),
    },
    iconSize: isTablet ? 24 : 20,
    tabBarLabelStyle: {
      fontSize: labelFontSize,
      fontWeight: "600" as const,
      textTransform: "uppercase" as const,
      letterSpacing: 1,
    },
  };
}

export default function TabLayout() {
  const { tabBarStyle, iconSize, tabBarLabelStyle } = useTabBarStyle();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tint,
        tabBarInactiveTintColor: Colors.light.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle,
        tabBarLabelStyle,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Trips",
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol size={iconSize} name="map.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Monitor",
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol
              size={iconSize}
              name="gauge.with.dots.needle.33percent"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol size={iconSize} name="plus" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol size={iconSize} name="clock.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol size={iconSize} name="gearshape.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
