import { useResponsiveFontSize } from "@/hooks/use-responsive-size";
import { useScreenDimensions } from "@/hooks/use-screen-dimensions";
import type { CargoCategory, RiskLevel, TripStatus } from "@/lib/icepack/data";
import { getProduct, liveStateFor } from "@/lib/icepack/data";
import { ProductIcon } from "@/components/ui/ProductIcon";
import { router } from "expo-router";
import { Check } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

export interface ShipmentView {
  id: number;
  name: string;
  productId: CargoCategory;
  cargoKg: number;
  durationHours: number;
  originLocation: string | null;
  destinationLocation: string | null;
  tripId: number | null;
  tripName: string | null;
  tripStatus: TripStatus | null;
  shipmentStatus: TripStatus;
  isPlanned: boolean;
  recommendedIceKg: number | null;
  iceRemainingKg: number | null;
  meltRateKgPerHr: number | null;
  safeDurationHours: number | null;
  startedAt: string | null;
}

const STATUS_BG_COLORS: Record<string, string> = {
  active: "#d1faf5",
  completed: "#dcfce7",
  cancelled: "#fee2e2",
  planned: "#cffafe",
  safe: "#d1faf5",
  warning: "#fef3c7",
  critical: "#fee2e2",
};

const STATUS_TEXT_COLORS: Record<string, string> = {
  active: "#0d9488",
  completed: "#16a34a",
  cancelled: "#dc2626",
  planned: "#0891b2",
  safe: "#0d9488",
  warning: "#d97706",
  critical: "#dc2626",
};

const STATUS_RAIL_COLORS: Record<string, string> = {
  active: "#14b8a6",
  completed: "#22c55e",
  cancelled: "#ef4444",
  planned: "#06b6d4",
};

const STATUS_CONFIG: Record<string, { label: string }> = {
  active: { label: "Active" },
  completed: { label: "Delivered" },
  cancelled: { label: "Cancelled" },
  planned: { label: "Planned" },
};

const RISK_CONFIG: Record<RiskLevel, { label: string }> = {
  safe: { label: "Safe" },
  warning: { label: "Warning" },
  critical: { label: "Critical" },
};

function StatusBadge({ status, risk }: { status: string; risk?: RiskLevel }) {
  const fsXs = useResponsiveFontSize("xs");

  if (status === "active" && risk) {
    const bg = STATUS_BG_COLORS[risk] ?? "#fee2e2";
    const tx = STATUS_TEXT_COLORS[risk] ?? "#dc2626";
    return (
      <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: bg }}>
        <Text style={{ fontSize: fsXs, fontWeight: "700", color: tx, textTransform: "uppercase", letterSpacing: 0.5 }}>
          {RISK_CONFIG[risk]?.label ?? risk}
        </Text>
      </View>
    );
  }
  const bg = STATUS_BG_COLORS[status] ?? "#cffafe";
  const tx = STATUS_TEXT_COLORS[status] ?? "#0891b2";
  const label = STATUS_CONFIG[status]?.label ?? status;
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: bg }}>
      <Text style={{ fontSize: fsXs, fontWeight: "700", color: tx, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </Text>
    </View>
  );
}

function Cell({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  const { isTablet } = useScreenDimensions();
  const fsXs = useResponsiveFontSize("xs");
  const fsSm = useResponsiveFontSize("sm");

  return (
    <View style={{ flex: 1 }}>
      <Text
        style={{
          fontSize: fsXs,
          color: "#94a3b8",
          fontWeight: "600",
          marginBottom: 4,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: isTablet ? fsSm * 1.1 : fsSm,
          fontWeight: "700",
          color: valueColor ?? "#0f1419",
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export function ShipmentCard({
  shipment,
  selectable,
  selected,
  onToggleSelect,
}: {
  shipment: ShipmentView;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: number) => void;
}) {
  const { isTablet } = useScreenDimensions();
  const fsBase = useResponsiveFontSize("base");
  const fsXs = useResponsiveFontSize("xs");
  const product = getProduct(shipment.productId);

  const hasTrip =
    shipment.shipmentStatus != null &&
    shipment.recommendedIceKg != null &&
    shipment.iceRemainingKg != null &&
    shipment.meltRateKgPerHr != null &&
    shipment.safeDurationHours != null;

  const trip = hasTrip
    ? ({
        id: shipment.tripId ?? shipment.id,
        shipmentId: shipment.id,
        name: shipment.tripName ?? shipment.name,
        productId: shipment.productId,
        cargoKg: shipment.cargoKg,
        durationHours: shipment.durationHours,
        recommendedIceKg: shipment.recommendedIceKg!,
        iceRemainingKg: shipment.iceRemainingKg!,
        meltRateKgPerHr: shipment.meltRateKgPerHr!,
        safeDurationHours: shipment.safeDurationHours!,
        status: shipment.shipmentStatus!,
        groupName: null,
        startedAt: shipment.startedAt ?? null,
        completedAt: null,
        createdAt: null,
        notes: null,
      } as unknown as import("@/lib/icepack/data").Trip)
    : null;

  const live = trip ? liveStateFor(trip) : null;
  const isActive = shipment.shipmentStatus === "active";
  const isCancelled = shipment.shipmentStatus === "cancelled";
  const isCompleted = shipment.shipmentStatus === "completed";
  const isPlanned = shipment.shipmentStatus === "planned" || shipment.isPlanned;

  const status = isActive ? "active" : isCompleted ? "completed" : isCancelled ? "cancelled" : "planned";
  const railColor = STATUS_RAIL_COLORS[status] ?? "#06b6d4";

  const icePct =
    isActive && live
      ? live.pctRemaining
      : isCancelled && hasTrip
        ? Math.round((shipment.iceRemainingKg! / shipment.recommendedIceKg!) * 100)
        : null;

  let iceColor: string | undefined;
  if (icePct != null) {
    if (icePct <= 25) iceColor = "#dc2626";
    else if (icePct <= 50) iceColor = "#d97706";
    else iceColor = "#0d9488";
  }

  const statusCellColor =
    isCancelled
      ? "#dc2626"
      : isActive && live && live.risk === "critical"
        ? "#dc2626"
        : isActive && live && live.risk === "warning"
          ? "#d97706"
          : isActive && live
            ? "#0d9488"
            : isCompleted
              ? "#64748b"
              : undefined;

  const showRoute = shipment.originLocation || shipment.destinationLocation;

  const cardContent = (
    <>
      {/* Left rail */}
      <View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, backgroundColor: railColor }} />

      <View style={{ padding: isTablet ? 18 : 14, paddingLeft: isTablet ? 22 : 18 }}>
        {/* Header */}
        <View style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <ProductIcon name={product.icon} size={fsBase} />
                <Text
                  numberOfLines={1}
                  style={{ fontSize: fsBase, fontWeight: "700", color: "#0f1419", flex: 1 }}
                >
                  {shipment.name}
                </Text>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <Text style={{ fontSize: fsXs, color: "#64748b", fontWeight: "500" }}>
                  {product.label}
                </Text>
                {shipment.tripName && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                      backgroundColor: "#dbeafe",
                      borderWidth: 0.5,
                      borderColor: "#bfdbfe",
                    }}
                  >
                    <Text style={{ fontWeight: "600", color: "#0284c7", fontSize: fsXs }}>
                      {shipment.tripName}
                    </Text>
                  </View>
                )}
              </View>

              {showRoute && (
                <Text
                  numberOfLines={1}
                  style={{ fontSize: fsXs * 0.9, color: "#94a3b8", marginTop: 4 }}
                >
                  {shipment.originLocation ?? "?"} → {shipment.destinationLocation ?? "?"}
                </Text>
              )}
            </View>

            <StatusBadge status={shipment.shipmentStatus} risk={isActive && live ? live.risk : undefined} />
          </View>
        </View>

        {/* Cells */}
        <View style={{ flexDirection: "row", gap: 16, borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 12 }}>
          <Cell
            label="Ice Left"
            value={`${isActive && live ? live.iceRemainingKg : shipment.iceRemainingKg ?? "--"} kg`}
            valueColor={iceColor}
          />
          <Cell
            label="Duration"
            value={
              isCancelled && live
                ? `${live.elapsedHours} h`
                : `${shipment.durationHours} h`
            }
          />
          <Cell
            label="Status"
            value={
              isActive && live
                ? `${live.pctRemaining}%`
                : isCancelled && hasTrip
                  ? `${icePct}%`
                  : isPlanned
                    ? "Ready"
                    : isCompleted
                      ? "Delivered"
                      : "--"
            }
            valueColor={statusCellColor}
          />
        </View>
      </View>
    </>
  );

  const borderStyle = selected
    ? { borderWidth: 2, borderColor: "#1a8ad4" }
    : { borderWidth: 1, borderColor: "#e2e8f0" };

  if (selectable) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onToggleSelect?.(shipment.id)}
        style={{
          backgroundColor: "white",
          borderRadius: 12,
          overflow: "hidden",
          shadowColor: "#0b2540",
          shadowOpacity: 0.05,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 1,
          ...borderStyle,
        }}
      >
        <View style={{ position: "absolute", top: 12, right: 12, zIndex: 10 }}>
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: selected ? "#1a8ad4" : "transparent",
              borderWidth: 2,
              borderColor: selected ? "#1a8ad4" : "#cbd5e1",
            }}
          >
            {selected && <Check size={14} color="white" strokeWidth={3} />}
          </View>
        </View>
        {cardContent}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/shipments/${shipment.id}` as any)}
      style={{
        backgroundColor: "white",
        borderRadius: 12,
        overflow: "hidden",
        shadowColor: "#0b2540",
        shadowOpacity: 0.04,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
        ...borderStyle,
      }}
    >
      {cardContent}
    </TouchableOpacity>
  );
}
