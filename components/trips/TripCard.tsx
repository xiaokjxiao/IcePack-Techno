import { useResponsiveFontSize } from "@/hooks/use-responsive-size";
import { useScreenDimensions } from "@/hooks/use-screen-dimensions";
import {
  type Trip,
  formatHours,
  getProduct,
  liveStateFor,
} from "@/lib/icepack/data";
import { Link } from "expo-router";
import { Check } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

type RiskLevel = "safe" | "warning" | "critical";

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

export function TripCard({
  trip,
  selectable,
  selected,
  onToggleSelect,
}: {
  trip: Trip;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: number) => void;
}) {
  const { isTablet } = useScreenDimensions();
  const fsBase = useResponsiveFontSize("base") * 1.1;
  const fsXs = useResponsiveFontSize("xs") * 1.1;
  const product = getProduct(trip.productId);
  const live = liveStateFor(trip);
  console.debug("TripCard render", {
    tripId: trip.id,
    trip,
    productId: trip.productId,
    live,
  });
  const isActive = trip.status === "active";
  const isPlanned = trip.status === "planned";
  const railColor = isPlanned
    ? "bg-sea-300"
    : trip.status === "completed"
      ? "bg-muted"
      : RAIL_COLORS[live.risk];

  const baseClass = `relative overflow-hidden ${selected ? "border-2 border-sea-600" : "border border-black/5"} rounded-2xl`;

  const inner = (
    <>
      <View
        className={`absolute left-0 top-0 bottom-0 w-1 z-10 ${railColor}`}
      />
      {/* inner white card */}
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
                <Text className="text-base" style={{ fontSize: fsBase }}>
                  {product.icon}
                </Text>
                <Text
                  className="text-sea-950 font-semibold text-base shrink"
                  numberOfLines={1}
                  style={{ fontSize: fsBase }}
                >
                  {trip.name}
                </Text>
              </View>
              <View className="flex-row items-center gap-2 mt-0.5 flex-wrap">
                <Text
                  className="text-muted-foreground"
                  style={{ fontSize: fsXs }}
                >
                  {product.label}
                </Text>
                {trip.groupName && (
                  <View className="flex-row items-center gap-1 px-1.5 py-0.5 rounded-full bg-sea-100 border border-sea-200">
                    <View className="size-1.5 rounded-full bg-sea-600" />
                    <Text
                      className="font-semibold text-sea-700"
                      style={{ fontSize: fsXs }}
                    >
                      {trip.groupName}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            {!selectable &&
              (isActive ? (
                <RiskBadge level={live.risk} />
              ) : (
                <View className="px-2 py-0.5 rounded-full bg-muted">
                  <Text className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {trip.status}
                  </Text>
                </View>
              ))}
          </View>

          <View className="flex-row gap-2 border-t border-border pt-3">
            <Cell
              label="Ice Left"
              value={`${isActive ? live.iceRemainingKg : trip.iceRemainingKg}kg`}
            />
            <Cell
              label="Duration"
              value={
                isActive
                  ? formatHours(live.elapsedHours)
                  : `${trip.durationHours}h`
              }
            />
            <Cell
              label="Status"
              value={
                isActive
                  ? `${live.pctRemaining}%`
                  : isPlanned
                    ? "Ready"
                    : "Done"
              }
              accent={
                isActive && live.risk === "critical"
                  ? "critical"
                  : isActive && live.risk === "warning"
                    ? "warning"
                    : isActive
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
        onPress={() => onToggleSelect?.(trip.id)}
        className={baseClass}
      >
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
