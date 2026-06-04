import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, Link } from "expo-router";
import { ArrowRight } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatCard } from "@/components/trips/StatCard";
import { TripCard } from "@/components/trips/TripCard";
import { ShipmentCard, type ShipmentView } from "@/components/shipments/ShipmentCard";
import {
  useResponsiveFontSize,
  useResponsiveSpacing,
} from "@/hooks/use-responsive-size";
import { useScreenDimensions } from "@/hooks/use-screen-dimensions";
import type { Trip } from "@/lib/icepack/data";
import { liveStateFor } from "@/lib/icepack/data";
import { getShipmentsWithTrips } from "@/lib/icepack/services";

function toTrip(s: ShipmentView): Trip {
  return {
    id: s.tripId ?? s.id,
    shipmentId: s.id,
    name: s.tripName ?? s.name,
    productId: s.productId,
    cargoKg: s.cargoKg,
    durationHours: s.durationHours,
    recommendedIceKg: s.recommendedIceKg ?? 0,
    iceRemainingKg: s.iceRemainingKg ?? 0,
    meltRateKgPerHr: s.meltRateKgPerHr ?? 0,
    safeDurationHours: s.safeDurationHours ?? 0,
    status: s.tripStatus ?? "planned",
    startedAt: s.startedAt ?? null,
    completedAt: null,
    createdAt: "",
    notes: null,
  };
}

function isShipmentCritical(s: ShipmentView): boolean {
  if (s.tripStatus !== "active") return false;
  if (s.recommendedIceKg == null || s.iceRemainingKg == null || s.meltRateKgPerHr == null || s.safeDurationHours == null) return false;
  const trip = toTrip(s);
  const live = liveStateFor(trip);
  return live.risk === "critical";
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { isTablet, isLandscape } = useScreenDimensions();
  const titleFontSize = useResponsiveFontSize("3xl");
  const subtitleFontSize = useResponsiveFontSize("xs");
  const horizontalPadding = useResponsiveSpacing("lg");
  const verticalPadding = useResponsiveSpacing("lg");
  const gapSize = useResponsiveSpacing("md");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shipments, setShipments] = useState<ShipmentView[]>([]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setError(null);
      (async () => {
        try {
          const data = await getShipmentsWithTrips();
          setShipments(data);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Failed to load data");
        } finally {
          setLoading(false);
        }
      })();
    }, []),
  );

  const activeShipments = shipments.filter((s) => s.tripStatus === "active");
  const completedShipments = shipments.filter((s) => s.tripStatus === "completed");
  const plannedShipments = shipments.filter((s) => s.isPlanned);

  const criticalShipments = activeShipments.filter(isShipmentCritical);

  const stats = {
    active: activeShipments.length,
    critical: criticalShipments.length,
    completed: completedShipments.length,
    planned: plannedShipments.length,
  };

  const recentActive = activeShipments.slice(0, 5);

  const activeGrouped = useMemo(() => {
    const groups = new Map<number, ShipmentView[]>();
    const solo: ShipmentView[] = [];
    for (const s of recentActive) {
      if (s.tripId != null) {
        const arr = groups.get(s.tripId) || [];
        arr.push(s);
        groups.set(s.tripId, arr);
      } else {
        solo.push(s);
      }
    }
    const multi: [number, ShipmentView[]][] = [];
    for (const [tripId, shipments] of groups) {
      if (shipments.length >= 2) {
        multi.push([tripId, shipments]);
      } else {
        solo.push(...shipments);
      }
    }
    return { groups: multi, solo };
  }, [recentActive]);

  const statCards: { label: string; value: string; accent?: boolean }[] = [
    { label: "Active", value: String(stats.active).padStart(2, "0") },
    { label: "Critical", value: String(stats.critical).padStart(2, "0"), accent: stats.critical > 0 },
    { label: "Completed", value: String(stats.completed).padStart(2, "0") },
    { label: "Planned", value: String(stats.planned).padStart(2, "0") },
  ];

  const isFourCol = isLandscape && !isTablet;
  const avatarSize = isTablet ? 48 : 40;
  const innerAvatarSize = isTablet ? 16 : 12;

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
    >
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

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#1a8ad4"
          style={{ marginTop: 32 }}
        />
      ) : error ? (
        <Text
          style={{
            fontSize: subtitleFontSize,
            color: "#ef4444",
            marginTop: 24,
            paddingHorizontal: horizontalPadding,
          }}
        >
          {error}
        </Text>
      ) : (
        <View style={{ paddingHorizontal: horizontalPadding, paddingTop: verticalPadding }}>
          <View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  fontSize: gapSize,
                  fontWeight: "600",
                  color: "#0b2540",
                }}
              >
                Active Shipments
              </Text>
              <Link href="/trips" asChild>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: subtitleFontSize,
                      fontWeight: "600",
                      color: "#1a8ad4",
                    }}
                  >
                    View All
                  </Text>
                  <ArrowRight size={14} color="#1a8ad4" strokeWidth={2} />
                </TouchableOpacity>
              </Link>
            </View>
            {recentActive.length === 0 ? (
              <Text
                style={{
                  fontSize: subtitleFontSize,
                  color: "rgba(0,0,0,0.4)",
                  marginBottom: 16,
                }}
              >
                No active shipments
              </Text>
            ) : (
              <View style={{ gap: 12, marginBottom: 24 }}>
                {activeGrouped.groups.map(([tripId, groupShipments]) => (
                  <View
                    key={`group-${tripId}`}
                    className="rounded-2xl bg-sea-50 border border-sea-200"
                    style={{ padding: 10 }}
                  >
                    <Link href={`/trips/${tripId}` as any} asChild>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        className="flex-row items-center justify-between"
                        style={{ paddingHorizontal: 6, paddingBottom: 8 }}
                      >
                        <View className="flex-row items-center gap-2">
                          <View className="size-2 rounded-full bg-sea-600" />
                          <Text className="text-sea-900 font-semibold text-xs uppercase tracking-wider">
                            {groupShipments[0]?.tripName ?? `Trip #${tripId}`}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                          <Text className="text-[10px] font-semibold text-sea-700">
                            {groupShipments.length} shipments
                          </Text>
                          <ArrowRight size={10} color="#0369a1" strokeWidth={2.5} />
                        </View>
                      </TouchableOpacity>
                    </Link>
                    <View style={{ gap: 8 }}>
                      {groupShipments.map((s) => (
                        <ShipmentCard key={s.id} shipment={s} />
                      ))}
                    </View>
                  </View>
                ))}
                {activeGrouped.solo.map((s) => (
                  <TripCard key={s.id} trip={toTrip(s)} />
                ))}
              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}
