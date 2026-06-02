import { Link } from "expo-router";
import { View, Text, TouchableOpacity } from "react-native";
import { Check } from "lucide-react-native";
import {
  type Trip,
  getProduct,
  liveStateFor,
  formatHours,
} from "@/lib/icepack/data";
import { useScreenDimensions } from "@/hooks/use-screen-dimensions";

type RiskLevel = "safe" | "warning" | "critical";

const RAIL_COLORS: Record<RiskLevel, string> = {
  safe: "bg-safe",
  warning: "bg-warning",
  critical: "bg-critical",
};

function RiskBadge({ level }: { level: RiskLevel }) {
  const config = {
    safe: { bg: "bg-safe/15", text: "text-safe", label: "Safe" },
    warning: { bg: "bg-warning/15", text: "text-warning", label: "Warning" },
    critical: { bg: "bg-critical/15", text: "text-critical", label: "Critical" },
  } as const;
  const c = config[level];
  return (
    <View className={`px-2 py-0.5 rounded-full ${c.bg}`}>
      <Text className={`text-[10px] font-semibold uppercase tracking-wide ${c.text}`}>
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
  accent?: "ok" | "critical";
}) {
  const { isTablet } = useScreenDimensions();
  const valueColor =
    accent === "critical"
      ? "text-critical"
      : accent === "ok"
        ? "text-ice-teal"
        : "text-sea-900";

  return (
    <View className="flex-1">
      <Text className={"text-muted-foreground uppercase tracking-wider " + (isTablet ? "text-xs" : "text-[10px]")}>
        {label}
      </Text>
      <Text className={"font-semibold " + (isTablet ? "text-base" : "text-sm") + " " + valueColor}>{value}</Text>
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
  onToggleSelect?: (id: string) => void;
}) {
  const { isTablet } = useScreenDimensions();
  const product = getProduct(trip.productId);
  const live = liveStateFor(trip);
  const isActive = trip.status === "active";
  const isPlanned = trip.status === "planned";
  const railColor = isPlanned
    ? "bg-sea-300"
    : trip.status === "completed"
      ? "bg-muted"
      : RAIL_COLORS[live.risk];

  const baseClass = `bg-card rounded-2xl relative overflow-hidden ${
    isTablet ? "p-5" : "p-4"
  } ${selected ? "border-2 border-sea-600" : "border border-black/5"}`;

  const inner = (
    <>
      <View className={`absolute left-0 top-0 bottom-0 w-1 ${railColor}`} />
      {selectable && (
        <View
          className={`absolute top-3 right-3 size-6 rounded-full items-center justify-center ${
            selected
              ? "bg-sea-600"
              : "border-2 border-sea-300"
          }`}
        >
          {selected && <Check size={14} color="white" strokeWidth={3} />}
        </View>
      )}
      <View className="flex-row justify-between items-start mb-3">
        <View className="shrink">
          <View className="flex-row items-center gap-2">
            <Text className="text-base">{product.icon}</Text>
            <Text className="text-sea-950 font-semibold text-base shrink" numberOfLines={1}>
              {trip.name}
            </Text>
          </View>
          <View className="flex-row items-center gap-2 mt-0.5 flex-wrap">
            <Text className="text-muted-foreground text-xs">{product.label}</Text>
            {trip.groupName && (
              <View className="flex-row items-center gap-1 px-1.5 py-0.5 rounded-full bg-sea-100 border border-sea-200">
                <View className="size-1.5 rounded-full bg-sea-600" />
                <Text className="text-[10px] font-semibold text-sea-700">{trip.groupName}</Text>
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
        <Cell label="Ice Left" value={`${isActive ? live.iceRemainingKg : trip.iceRemainingKg}kg`} />
        <Cell
          label="Duration"
          value={isActive ? formatHours(live.elapsedHours) : `${trip.durationHours}h`}
        />
        <Cell
          label="Status"
          value={isActive ? `${live.pctRemaining}%` : isPlanned ? "Ready" : "Done"}
          accent={isActive && live.risk === "critical" ? "critical" : isActive ? "ok" : undefined}
        />
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
