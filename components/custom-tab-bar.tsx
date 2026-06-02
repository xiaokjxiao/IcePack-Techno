import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import { Link } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useScreenDimensions } from "@/hooks/use-screen-dimensions";

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const { isTablet, isSmallDevice } = useScreenDimensions();
  const dims = useResponsiveSizes();

  const tabRoutes = state.routes.filter((r) => r.name !== "create");
  const isCreateActive = state.routes[state.index]?.name === "create";

  const handleTabPress = (key: string, name: string) => {
    const event = navigation.emit({
      type: "tabPress",
      target: key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) {
      navigation.navigate(name);
    }
  };

  const fabGap = isTablet ? 48 : isSmallDevice ? 32 : 40;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View
        style={[
          styles.tabBar,
          {
            borderTopColor: colors.border,
            height: dims.barHeight,
            paddingBottom: dims.paddingBottom,
            paddingTop: dims.paddingTop,
          },
        ]}
      >
        {tabRoutes.map((route, index) => {
          const { options } = descriptors[route.key];
          const routeIndex = state.routes.findIndex((r) => r.key === route.key);
          const isFocused = state.index === routeIndex;
          const color = isFocused ? colors.tint : colors.tabIconDefault;

          return (
            <PlatformPressable
              key={route.key}
              onPress={() => handleTabPress(route.key, route.name)}
              onPressIn={() => {
                if (Platform.OS === "ios") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
              style={[
                styles.tabItem,
                index === 1 && { marginRight: fabGap },
                index === 2 && { marginLeft: fabGap },
              ]}
            >
              {options.tabBarIcon?.({ color })}
              <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>
                {options.title as string}
              </Text>
            </PlatformPressable>
          );
        })}

        <Link href="/create" asChild>
          <PlatformPressable
            style={[
              styles.fab,
              {
                backgroundColor: colors.tint,
                width: dims.fab,
                height: dims.fab,
                borderRadius: dims.fab / 2,
              },
              isCreateActive && styles.fabActive,
            ]}
            onPressIn={() => {
              if (Platform.OS === "ios") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
            }}
          >
            <IconSymbol name="plus" size={isTablet ? 28 : 24} color="#fff" />
          </PlatformPressable>
        </Link>
      </View>
    </View>
  );
}

function useResponsiveSizes() {
  const { isTablet, isSmallDevice } = useScreenDimensions();
  return {
    fab: isTablet ? 64 : isSmallDevice ? 48 : 56,
    barHeight: isTablet ? 88 : isSmallDevice ? 72 : 80,
    paddingBottom: isTablet ? 16 : 12,
    paddingTop: isTablet ? 10 : 8,
  };
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  fab: {
    position: "absolute",
    bottom: 28,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
    zIndex: 20,
    shadowColor: "#1a8ad4",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 16,
  },
  fabActive: {
    transform: [{ scale: 0.95 }],
  },
});
