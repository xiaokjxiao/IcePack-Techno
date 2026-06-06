import { useEffect, useState } from "react";
import { Tabs } from "expo-router";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { getCurrentUserRole } from "@/lib/auth";
import type { UserRole } from "@/lib/auth";
import "@/global.css";
import {
  useResponsiveFontSize,
  useResponsiveSpacing,
} from "@/hooks/use-responsive-size";
import { useScreenDimensions } from "@/hooks/use-screen-dimensions";

function useTabBarStyle() {
  const { isTablet, isSmallDevice} = useScreenDimensions();
  const labelFontSize = useResponsiveFontSize("xs");
  const paddingBottom = useResponsiveSpacing("sm");
  const paddingTop = useResponsiveSpacing("sm");

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
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    getCurrentUserRole().then(setRole);
  }, []);

  return <TabLayoutInner role={role} />;
}

function TabLayoutInner({ role }: { role: UserRole | null }) {
  const { tabBarStyle, iconSize, tabBarLabelStyle } = useTabBarStyle();
  const isTracker = role === "tracker";

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
          title: "Home",
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol size={iconSize} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: "Trips",
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol size={iconSize} name="map.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          href: isTracker ? null : undefined,
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol size={iconSize} name="plus" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shipments"
        options={{
          title: "Shipments",
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol size={iconSize} name="shippingbox.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol size={iconSize} name="person.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
