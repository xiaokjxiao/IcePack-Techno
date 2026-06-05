import { useResponsiveFontSize } from "@/hooks/use-responsive-size";
import { useScreenDimensions } from "@/hooks/use-screen-dimensions";
import {
  type Trip,
  formatHours,
  getProduct,
  liveStateFor,
} from "@/lib/icepack/data";
import { router } from "expo-router";
import { Check, Package } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

type RiskLevel = "safe" | "warning" | "critical";

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
  active: "#14b8a6",
  completed: "#22c55e",
  cancelled: "#ef4444",
  planned: "#06b6d4",
  safe: "#14b8a6",
  warning: "#f59e0b",
  critical: "#ef4444",
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
  let displayStatus = status;
  let bgColor = STATUS_BG_COLORS[status] ?? "#cffafe";
  let textColor = STATUS_TEXT_COLORS[status] ?? "#06b6d4";

  if (status === "active" && risk) {
    displayStatus = risk;
    bgColor = STATUS_BG_COLORS[risk] ?? "#cffafe";
    textColor = STATUS_TEXT_COLORS[risk] ?? "#06b6d4";
  }

  const label = (displayStatus === "active" && risk) 
    ? RISK_CONFIG[risk as RiskLevel]?.label 
    : STATUS_CONFIG[displayStatus]?.label;

  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: bgColor }}>
      <Text 
        style={{ 
          fontSize: fsXs, 
          fontWeight: "600", 
          color: textColor, 
          textTransform: "uppercase",
          letterSpacing: 0.5
        }}
      >
        {label}
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
  const fsXs = useResponsiveFontSize("xs");
  const fsSm = useResponsiveFontSize("sm");
  
  const valueColor =
    accent === "critical"
      ? "#ef4444"
      : accent === "warning"
        ? "#f59e0b"
        : accent === "ok"
          ? "#14b8a6"
          : accent === "muted"
            ? "#94a3b8"
            : "#0f1419";

  return (
    <View style={{ flex: 1 }}>
      <Text 
        style={{ 
          fontSize: fsXs, 
          color: "#94a3b8", 
          fontWeight: "600", 
          marginBottom: 2,
          textTransform: "uppercase",
          letterSpacing: 0.5
        }}
      >
        {label}
      </Text>
      <Text 
        style={{ 
          fontSize: isTablet ? fsSm * 1.1 : fsSm, 
          fontWeight: "700", 
          color: valueColor 
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function formatDateTime(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${date} · ${time}`;
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
  const fsBase = useResponsiveFontSize("base");
  const fsXs = useResponsiveFontSize("xs");
  const fsSm = useResponsiveFontSize("sm");
  const product = getProduct(trip.productId);
  const live = liveStateFor(trip);
  const isActive = trip.status === "active";
  const isPlanned = trip.status === "planned";

  const count = shipmentCount ?? 1;
  const startedText = formatDateTime(trip.startedAt);

  const borderStyle = selected
    ? { borderWidth: 2, borderColor: "#1a8ad4" }
    : { borderWidth: 1, borderColor: "#f0f4f8" };

  const headerRow = (
    <View style={{ marginBottom: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <Text 
              numberOfLines={1} 
              style={{ 
                fontSize: fsBase, 
                fontWeight: "600", 
                color: "#0f1419",
                flex: 1
              }}
            >
              {trip.name}
            </Text>
          </View>
          
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <Text style={{ fontSize: fsXs, color: "#64748b" }}>
              {product.label}
            </Text>
            {count > 1 && (
              <View 
                style={{ 
                  flexDirection: "row", 
                  alignItems: "center", 
                  gap: 4, 
                  paddingHorizontal: 8, 
                  paddingVertical: 4, 
                  borderRadius: 6, 
                  backgroundColor: "#dbeafe",
                  borderWidth: 0.5,
                  borderColor: "#bfdbfe"
                }}
              >
                <Package size={10} color="#0284c7" />
                <Text style={{ fontWeight: "600", color: "#0284c7", fontSize: fsXs }}>
                  {count}
                </Text>
              </View>
            )}
          </View>

          {startedText && (
            <Text 
              style={{ 
                fontSize: fsXs * 0.9, 
                color: "#64748b", 
                marginTop: 4
              }}
            >
              Departed: {startedText}
            </Text>
          )}
        </View>

        <StatusBadge status={trip.status} risk={isActive ? live.risk : undefined} />
      </View>
    </View>
  );

  const cellsRow = (
    <View style={{ flexDirection: "row", gap: 12, borderTopWidth: 1, borderTopColor: "#f0f4f8", paddingTop: 8 }}>
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
              ? "Planned"
              : trip.status === "completed"
                ? "Delivered"
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
  );

  const cardContent = (
    <View style={{ paddingVertical: isTablet ? 18 : 14, paddingHorizontal: isTablet ? 16 : 12 }}>
      {headerRow}
      {cellsRow}
    </View>
  );

  if (selectable) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onToggleSelect?.(trip.id)}
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
      onPress={() => router.push(`/trips/${trip.id}` as any)}
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
      {cardContent}
    </TouchableOpacity>
  );
}