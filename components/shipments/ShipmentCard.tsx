import { useResponsiveFontSize } from "@/hooks/use-responsive-size";
import { useScreenDimensions } from "@/hooks/use-screen-dimensions";
import type { CargoCategory, TripStatus } from "@/lib/icepack/data";
import { getProduct } from "@/lib/icepack/data";
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
}

const RAIL_COLORS: Record<string, string> = {
  active: "bg-[#14b8a6]",
  planned: "bg-[#06b6d4]",
  completed: "bg-[#94a3b8]",
  cancelled: "bg-[#94a3b8]",
  none: "bg-[#cbd5e1]",
};

function Cell({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "ok" | "warning" | "critical" | "muted";
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
          : accent === "muted"
            ? "text-[#94a3b8]"
            : "text-[#0b2540]";

  return (
    <View className="flex-1">
      <Text
        className="text-muted-foreground uppercase tracking-wider"
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

  const statusKey = shipment.tripStatus ?? "none";
  const railColor = RAIL_COLORS[statusKey] ?? RAIL_COLORS.none;

  const baseClass = `relative overflow-hidden ${selected ? "border-2 border-sea-600" : "border border-black/5"} rounded-2xl`;

  const statusLabel =
    shipment.tripStatus === "active"
      ? "Active"
      : shipment.tripStatus === "planned"
        ? "Planned"
        : shipment.tripStatus === "completed"
          ? "Done"
          : shipment.tripStatus === "cancelled"
            ? "Cancelled"
            : shipment.isPlanned
              ? "Planned"
              : "No Trip";

  const statusAccent =
    shipment.tripStatus === "active"
      ? ("ok" as const)
      : shipment.tripStatus === "planned"
        ? ("ok" as const)
        : shipment.tripStatus === "completed"
          ? ("muted" as const)
          : shipment.tripStatus === "cancelled"
            ? ("warning" as const)
            : shipment.isPlanned
              ? ("ok" as const)
              : ("muted" as const);

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
                {shipment.tripName && (
                  <View className="flex-row items-center gap-1 px-1.5 py-0.5 rounded-full bg-sea-100 border border-sea-200">
                    <View className="size-1.5 rounded-full bg-sea-600" />
                    <Text
                      className="font-semibold text-sea-700"
                      style={{ fontSize: fsXs }}
                    >
                      {shipment.tripName}
                    </Text>
                  </View>
                )}
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
            {!selectable && (
              <View className="px-2 py-0.5 rounded-full bg-muted">
                <Text className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {statusLabel}
                </Text>
              </View>
            )}
          </View>

          <View className="flex-row gap-2 border-t border-border pt-3">
            <Cell label="Cargo" value={`${shipment.cargoKg}kg`} />
            <Cell label="Duration" value={`${shipment.durationHours}h`} />
            <Cell label="Status" value={statusLabel} accent={statusAccent} />
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
