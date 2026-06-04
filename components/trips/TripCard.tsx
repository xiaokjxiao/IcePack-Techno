import { useResponsiveFontSize } from "@/hooks/use-responsive-size";
import { useScreenDimensions } from "@/hooks/use-screen-dimensions";
import {
  type Trip,
  formatHours,
  getProduct,
  liveStateFor,
} from "@/lib/icepack/data";
import { ProductIcon } from "@/components/ui/ProductIcon";
import { Link } from "expo-router";
import { Check, Package } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

type RiskLevel = "safe" | "warning" | "critical";

const RAIL_COLORS: Record<string, string> = {
  active: "bg-[#14b8a6]",
  completed: "bg-[#22c55e]",
  cancelled: "bg-[#ef4444]",
  planned: "bg-[#06b6d4]",
  safe: "bg-[#14b8a6]",
  warning: "bg-[#f59e0b]",
  critical: "bg-[#ef4444]",
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: "bg-[#14b8a6]/15", text: "text-[#14b8a6]", label: "Active" },
  completed: { bg: "bg-[#22c55e]/15", text: "text-[#22c55e]", label: "Done" },
  cancelled: { bg: "bg-[#ef4444]/15", text: "text-[#ef4444]", label: "Cancelled" },
  planned: { bg: "bg-[#06b6d4]/15", text: "text-[#06b6d4]", label: "Planned" },
};

const RISK_CONFIG: Record<RiskLevel, { bg: string; text: string; label: string }> = {
  safe: { bg: "bg-[#14b8a6]/15", text: "text-[#14b8a6]", label: "Safe" },
  warning: { bg: "bg-[#f59e0b]/15", text: "text-[#f59e0b]", label: "Warning" },
  critical: { bg: "bg-[#ef4444]/15", text: "text-[#ef4444]", label: "Critical" },
};

function StatusBadge({ status, risk }: { status: string; risk?: RiskLevel }) {
  const fsXs = useResponsiveFontSize("xs") * 1.1;
  if (status === "active" && risk) {
    const c = RISK_CONFIG[risk];
    return (
      <View className={`px-2 py-0.5 rounded-full ${c.bg}`}>
        <Text className={`font-semibold uppercase tracking-wide ${c.text}`} style={{ fontSize: fsXs }}>
          {c.label}
        </Text>
      </View>
    );
  }
  const c = STATUS_CONFIG[status] ?? STATUS_CONFIG.planned;
  return (
    <View className={`px-2 py-0.5 rounded-full ${c.bg}`}>
      <Text className={`font-semibold uppercase tracking-wide ${c.text}`} style={{ fontSize: fsXs }}>
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
      <Text className={"text-muted-foreground uppercase tracking-wider"} style={{ fontSize: fsXs }}>
        {label}
      </Text>
      <Text className={"font-semibold " + valueColor} style={{ fontSize: isTablet ? fsSm * 1.1 : fsSm }}>
        {value}
      </Text>
    </View>
  );
}

export function TripCard({
  trip,
  selectable,
  selected,
  onToggleSelect,
  shipmentCount,
}: {
  trip: Trip;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: number) => void;
  shipmentCount?: number;
}) {
  const { isTablet } = useScreenDimensions();
  const fsBase = useResponsiveFontSize("base") * 1.1;
  const fsXs = useResponsiveFontSize("xs") * 1.1;
  const product = getProduct(trip.productId);
  const live = liveStateFor(trip);
  const isActive = trip.status === "active";
  const isPlanned = trip.status === "planned";

  const railColor = isActive && live
    ? RAIL_COLORS[live.risk]
    : RAIL_COLORS[trip.status] ?? RAIL_COLORS.planned;

  const baseClass = `relative overflow-hidden ${selected ? "border-2 border-sea-600" : "border border-black/5"} rounded-2xl`;

  const count = shipmentCount ?? 1;

  const inner = (
    <>
      <View className={`absolute left-0 top-0 bottom-0 w-1 z-10 ${railColor}`} />
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
            <View className="shrink mr-2">
              <View className="flex-row items-center gap-2">
                <ProductIcon name={product.icon} size={fsBase} />
                <Text className="text-sea-950 font-semibold text-base shrink" numberOfLines={1} style={{ fontSize: fsBase }}>
                  {trip.name}
                </Text>
              </View>
              <View className="flex-row items-center gap-2 mt-0.5 flex-wrap">
                <Text className="text-muted-foreground" style={{ fontSize: fsXs }}>
                  {product.label}
                </Text>
                {count > 1 && (
                  <View className="flex-row items-center gap-1 px-1.5 py-0.5 rounded-full bg-sea-100 border border-sea-200">
                    <Package size={10} color="#0369a1" />
                    <Text className="font-semibold text-sea-700" style={{ fontSize: fsXs }}>
                      {count}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            {!selectable && (
              <StatusBadge status={trip.status} risk={isActive ? live.risk : undefined} />
            )}
          </View>

          <View className="flex-row gap-2 border-t border-border pt-3">
            <Cell
              label="Duration"
              value={isActive ? formatHours(live.elapsedHours) : `${trip.durationHours}h`}
            />
            <Cell
              label="Status"
              value={
                isActive
                  ? `${live.pctRemaining}%`
                  : isPlanned
                    ? "Ready"
                    : trip.status === "completed"
                      ? "Done"
                      : trip.status === "cancelled"
                        ? "Cancelled"
                        : "--"
              }
              accent={
                isActive && live.risk === "critical"
                  ? "critical"
                  : isActive && live.risk === "warning"
                    ? "warning"
                    : isActive
                      ? "ok"
                      : trip.status === "cancelled"
                        ? "critical"
                        : trip.status === "completed"
                          ? "muted"
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
      <TouchableOpacity activeOpacity={0.85} onPress={() => onToggleSelect?.(trip.id)} className={baseClass}>
        {inner}
      </TouchableOpacity>
    );
  }

  return (
    <Link href={`/trips/${trip.id}` as any} asChild>
      <TouchableOpacity activeOpacity={0.85} className={baseClass}>
        {inner}
      </TouchableOpacity>
    </Link>
  );
}
