import { useResponsiveFontSize } from "@/hooks/use-responsive-size";
import { useScreenDimensions } from "@/hooks/use-screen-dimensions";
import type { CargoCategory, RiskLevel, TripStatus } from "@/lib/icepack/data";
import { getProduct, liveStateFor } from "@/lib/icepack/data";
import { ProductIcon } from "@/components/ui/ProductIcon";
import { Link } from "expo-router";
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
  isPlanned: boolean;
  recommendedIceKg: number | null;
  iceRemainingKg: number | null;
  meltRateKgPerHr: number | null;
  safeDurationHours: number | null;
  startedAt: string | null;
}

const RAIL_COLORS: Record<RiskLevel, string> = {
  safe: "bg-[#14b8a6]",
  warning: "bg-[#f59e0b]",
  critical: "bg-[#ef4444]",
};

function RiskBadge({ level }: { level: RiskLevel }) {
  const fsXs = useResponsiveFontSize("xs") * 1.1;
  const config = {
    safe: { bg: "bg-[#14b8a6]/15", text: "text-[#14b8a6]", label: "Safe" },
    warning: {
      bg: "bg-[#f59e0b]/15",
      text: "text-[#f59e0b]",
      label: "Warning",
    },
    critical: {
      bg: "bg-[#ef4444]/15",
      text: "text-[#ef4444]",
      label: "Critical",
    },
  } as const;
  const c = config[level];
  return (
    <View className={`px-2 py-0.5 rounded-full ${c.bg}`}>
      <Text
        className={`font-semibold uppercase tracking-wide ${c.text}`}
        style={{ fontSize: fsXs }}
      >
        {c.label}
      </Text>
    </View>
  );
}

function Cell({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "ok" | "warning" | "critical";
}) {
  const { isTablet } = useScreenDimensions();
  const fsXs = useResponsiveFontSize("xs") * 1.1;
  const fsSm = useResponsiveFontSize("sm") * 1.1;
  const valueColor =
    accent === "critical"
      ? "text-[#ef4444]"
      : accent === "warning"
        ? "text-[#f59e0b]"
        : accent === "ok"
          ? "text-[#14b8a6]"
          : "text-[#0b2540]";

  return (
    <View className="flex-1">
      <Text
        className={"text-muted-foreground uppercase tracking-wider"}
        style={{ fontSize: fsXs }}
      >
        {label}
      </Text>
      <Text
        className={"font-semibold " + valueColor}
        style={{ fontSize: isTablet ? fsSm * 1.1 : fsSm }}
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
  const fsBase = useResponsiveFontSize("base") * 1.1;
  const fsXs = useResponsiveFontSize("xs") * 1.1;
  const product = getProduct(shipment.productId);

  const hasTrip =
    shipment.tripStatus != null &&
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
        status: shipment.tripStatus!,
        groupName: null,
        startedAt: shipment.startedAt ?? null,
        completedAt: null,
        createdAt: null,
        notes: null,
      } as unknown as import("@/lib/icepack/data").Trip)
    : null;

  const live = trip ? liveStateFor(trip) : null;
  const isActive = shipment.tripStatus === "active";
  const isPlanned =
    shipment.tripStatus === "planned" || shipment.isPlanned;

  const railColor = isPlanned
    ? "bg-sea-300"
    : shipment.tripStatus === "completed"
      ? "bg-muted"
      : shipment.tripStatus === "cancelled"
        ? "bg-muted"
        : isActive && live
          ? RAIL_COLORS[live.risk]
          : "bg-muted";

  const baseClass = `relative overflow-hidden ${selected ? "border-2 border-sea-600" : "border border-black/5"} rounded-2xl`;

  const inner = (
    <>
      <View
        className={`absolute left-0 top-0 bottom-0 w-1 z-10 ${railColor}`}
      />
      <View className="rounded-2xl bg-white" style={{ overflow: "hidden" }}>
        <View
          className={`${isTablet ? "p-5" : "p-4"}`}
          style={{
            shadowColor: "#0b2540",
            shadowOpacity: 0.06,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 8 },
            elevation: 3,
            backgroundColor: "white",
          }}
        >
          {selectable && (
            <View
              className={`absolute top-3 right-3 size-6 rounded-full items-center justify-center ${
                selected ? "bg-sea-600" : "border-2 border-sea-300"
              }`}
            >
              {selected && <Check size={14} color="white" strokeWidth={3} />}
            </View>
          )}
          <View className="flex-row justify-between items-start mb-3">
            <View className="shrink">
              <View className="flex-row items-center gap-2">
                <ProductIcon name={product.icon} size={fsBase} />
                <Text
                  className="text-sea-950 font-semibold text-base shrink"
                  numberOfLines={1}
                  style={{ fontSize: fsBase }}
                >
                  {shipment.name}
                </Text>
              </View>
              <View className="flex-row items-center gap-2 mt-0.5 flex-wrap">
                <Text
                  className="text-muted-foreground"
                  style={{ fontSize: fsXs }}
                >
                  {product.label}
                </Text>
              </View>
              {(shipment.originLocation || shipment.destinationLocation) && (
                <Text
                  className="text-muted-foreground mt-1"
                  style={{ fontSize: fsXs * 0.9 }}
                  numberOfLines={1}
                >
                  {shipment.originLocation ?? "?"} → {shipment.destinationLocation ?? "?"}
                </Text>
              )}
            </View>
            {!selectable &&
              (isActive && live ? (
                <RiskBadge level={live.risk} />
              ) : (
                <View className="px-2 py-0.5 rounded-full bg-muted">
                  <Text className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {shipment.tripStatus === "completed"
                      ? "Done"
                      : shipment.tripStatus === "cancelled"
                        ? "Cancelled"
                        : shipment.isPlanned
                          ? "Planned"
                          : "No Trip"}
                  </Text>
                </View>
              ))}
          </View>

          <View className="flex-row gap-2 border-t border-border pt-3">
            <Cell
              label="Ice Left"
              value={`${isActive && live ? live.iceRemainingKg : shipment.iceRemainingKg ?? "--"}kg`}
            />
            <Cell label="Duration" value={`${shipment.durationHours}h`} />
            <Cell
              label="Status"
              value={
                isActive && live
                  ? `${live.pctRemaining}%`
                  : shipment.tripStatus === "planned" || shipment.isPlanned
                    ? "Ready"
                    : shipment.tripStatus === "completed"
                      ? "Done"
                      : "--"
              }
              accent={
                isActive && live && live.risk === "critical"
                  ? "critical"
                  : isActive && live && live.risk === "warning"
                    ? "warning"
                    : isActive && live
                      ? "ok"
                      : undefined
              }
            />
          </View>
        </View>
      </View>
    </>
  );

  if (selectable) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onToggleSelect?.(shipment.id)}
        className={baseClass}
      >
        {inner}
      </TouchableOpacity>
    );
  }

  return (
    <Link href={`/shipments/${shipment.id}` as any} asChild>
      <TouchableOpacity activeOpacity={0.85} className={baseClass}>
        {inner}
      </TouchableOpacity>
    </Link>
  );
}
