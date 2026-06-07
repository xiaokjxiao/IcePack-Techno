import { LayoutAnimation, Platform, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { ChevronDown, ChevronUp, Package, ArrowRight } from "lucide-react-native";
import { ShipmentCard, type ShipmentView } from "@/components/shipments/ShipmentCard";
import { useResponsiveFontSize } from "@/hooks/use-responsive-size";
import type { Trip } from "@/lib/icepack/data";
import { formatHours, liveStateFor } from "@/lib/icepack/data";

const STATUS_COLORS: Record<string, string> = {
  active: "#14b8a6",
  completed: "#22c55e",
  cancelled: "#ef4444",
  planned: "#06b6d4",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  completed: "Delivered",
  cancelled: "Cancelled",
  planned: "Planned",
};

const STATUS_BG_COLORS: Record<string, string> = {
  active: "#d1faf5",
  completed: "#dcfce7",
  cancelled: "#fee2e2",
  planned: "#cffafe",
};

function deriveTripStatus(shipments: ShipmentView[]): string {
  if (shipments.length === 0) return "planned";
  const allFinished = shipments.every(
    (s) => s.shipmentStatus === "completed" || s.shipmentStatus === "cancelled",
  );
  if (allFinished) return "completed";
  const anyActive = shipments.some((s) => s.shipmentStatus === "active");
  if (anyActive) return "active";
  return "planned";
}

export function TripHeader({
  trip,
  shipments,
  isExpanded,
  onToggle,
}: {
  trip: Trip;
  shipments: ShipmentView[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const baseSize = useResponsiveFontSize("base");
  const smSize = useResponsiveFontSize("sm");
  const xsSize = useResponsiveFontSize("xs");
  const derivedStatus = deriveTripStatus(shipments);
  const statusColor = STATUS_COLORS[derivedStatus] ?? "#94a3b8";
  const statusBgColor = STATUS_BG_COLORS[derivedStatus] ?? "#f1f5f9";
  const statusLabel = STATUS_LABELS[derivedStatus] ?? derivedStatus;

  function formatTimeLabel(iso: string | null, prefix: string): string | null {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    return `${prefix}: ${date} \u00B7 ${time}`;
  }

  let statusTimeText: string | null = null;
  if (derivedStatus === "active" && trip.startedAt) {
    statusTimeText = formatTimeLabel(trip.startedAt, "Departed");
  } else if (derivedStatus === "completed" && (trip.completedAt || trip.startedAt)) {
    statusTimeText = formatTimeLabel(trip.completedAt ?? trip.startedAt, "Delivered");
  } else if (derivedStatus === "cancelled" && (trip.completedAt || trip.startedAt)) {
    statusTimeText = formatTimeLabel(trip.completedAt ?? trip.startedAt, "Cancelled");
  }

  const durationText = derivedStatus === "active"
    ? formatHours(liveStateFor(trip).elapsedHours)
    : formatHours(trip.durationHours);

  const handleToggle = () => {
    if (Platform.OS !== "web") {
      LayoutAnimation.configureNext(
        LayoutAnimation.Presets.easeInEaseOut
      );
    }
    onToggle();
  };

  return (
    <View style={{ marginBottom: 0 }}>
      <TouchableOpacity
        onPress={handleToggle}
        activeOpacity={0.7}
        style={{
          backgroundColor: "white",
          borderRadius: 12,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          borderBottomLeftRadius: isExpanded ? 0 : 12,
          borderBottomRightRadius: isExpanded ? 0 : 12,
          borderWidth: 1.5,
          borderColor: statusColor + "80",
          borderLeftWidth: 4,
          shadowColor: "#0b2540",
          shadowOpacity: 0.05,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: isExpanded ? 0 : 1,
        }}
      >
        <View style={{ paddingVertical: 10, paddingHorizontal: 12, gap: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={{ fontSize: baseSize, fontWeight: "700", color: "#0f1419", marginBottom: 2 }} numberOfLines={1}>
                {trip.name}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: statusColor,
                  }}
                />
                <Text style={{ fontSize: smSize, color: "#64748b" }}>
                  {shipments.length} {shipments.length === 1 ? "shipment" : "shipments"}
                </Text>
              </View>
            </View>

            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 6,
                backgroundColor: statusBgColor,
              }}
            >
              <Text style={{ fontSize: xsSize, fontWeight: "700", color: statusColor, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {statusLabel}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: xsSize, color: "#94a3b8", fontWeight: "600", marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.3 }}>
                Items
              </Text>
              <Text style={{ fontSize: smSize, fontWeight: "700", color: "#0f1419" }}>
                {shipments.length}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: xsSize, color: "#94a3b8", fontWeight: "600", marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.3 }}>
                Duration
              </Text>
              <Text style={{ fontSize: smSize, fontWeight: "700", color: "#0f1419" }}>
                {durationText}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: xsSize, color: "#94a3b8", fontWeight: "600", marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.3 }}>
                Progress
              </Text>
              <Text style={{ fontSize: smSize, fontWeight: "700", color: statusColor }}>
                {Math.round((shipments.filter(s => s.shipmentStatus === "completed").length / shipments.length) * 100 || 0)}%
              </Text>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: statusColor + "20" }} />

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              {statusTimeText ? (
                <Text style={{ fontSize: xsSize, color: "#64748b" }}>
                  {statusTimeText}
                </Text>
              ) : (
                <Text style={{ fontSize: xsSize, color: "#cbd5e1" }}>
                  {derivedStatus === "planned" ? "Scheduled" : "In progress"}
                </Text>
              )}
            </View>
            <View style={{ marginLeft: 8 }}>
              {isExpanded ? (
                <ChevronUp size={18} color={statusColor} strokeWidth={2} />
              ) : (
                <ChevronDown size={18} color={statusColor} strokeWidth={2} />
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View
          style={{
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
            borderWidth: 1.5,
            borderTopWidth: 0,
            borderColor: statusColor + "80",
            borderLeftWidth: 4,
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 12,
            shadowColor: "#0b2540",
            shadowOpacity: 0.05,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 1,
          }}
        >
          {shipments.length > 0 && (
            <View style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: xsSize, fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Shipments in this trip
              </Text>
            </View>
          )}

          {shipments.length > 0 && (
            <View style={{ gap: 8, marginBottom: 8 }}>
              {shipments.map((s) => (
                <ShipmentCard key={s.id} shipment={s} />
              ))}
            </View>
          )}

          {shipments.length === 0 && (
            <View style={{ alignItems: "center", paddingVertical: 16 }}>
              <Package size={28} color="#cbd5e1" strokeWidth={1.5} />
              <Text style={{ fontSize: smSize, color: "#cbd5e1", marginTop: 6, fontWeight: "500" }}>
                No items yet
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={() => router.push(`/trips/${trip.id}` as any)}
            activeOpacity={0.65}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 8,
              backgroundColor: statusBgColor,
              borderWidth: 1,
              borderColor: statusColor + "30",
            }}
          >
            <Text style={{ fontSize: smSize, fontWeight: "600", color: statusColor }}>
              View Trip Details
            </Text>
            <ArrowRight size={16} color={statusColor} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
