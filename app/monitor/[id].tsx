import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Line,
  Polyline,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import {
  useResponsiveFontSize,
  useResponsiveSpacing,
} from "@/hooks/use-responsive-size";
import { useScreenDimensions } from "@/hooks/use-screen-dimensions";
import type { Trip, RiskLevel } from "@/lib/icepack/data";
import {
  formatHours,
  getProduct,
  getProfileFor,
  liveStateFor,
} from "@/lib/icepack/data";
import { getShipment, getTrip } from "@/lib/icepack/services";
import type { Database } from "@/lib/database.types";

type ShipmentRow = Database["public"]["Tables"]["shipments"]["Row"];
type TripRow = Database["public"]["Tables"]["trips"]["Row"];

function buildTrip(shipment: ShipmentRow, tripRow: TripRow | null): Trip {
  return {
    id: shipment.id,
    shipmentId: shipment.id,
    name: tripRow?.trip_name ?? shipment.shipment_name,
    productId: shipment.cargo_category,
    cargoKg: shipment.cargo_kg,
    durationHours: shipment.duration_hours,
    recommendedIceKg: shipment.recommended_ice_kg ?? 0,
    iceRemainingKg: shipment.ice_remaining_kg ?? 0,
    meltRateKgPerHr: shipment.melt_rate_kg_per_hr ?? 0,
    safeDurationHours: shipment.safe_duration_hours ?? 0,
    status: tripRow?.status ?? "planned",
    startedAt: tripRow?.started_at ?? null,
    completedAt: tripRow?.completed_at ?? null,
    createdAt: shipment.created_at,
    notes: shipment.notes,
  };
}

function RiskBadgeInline({ level }: { level: RiskLevel }) {
  const labelSize = useResponsiveFontSize("xs") * 1.1;
  const config = {
    safe: { bg: "rgba(20,184,166,0.15)", text: "#14b8a6", label: "Safe" },
    warning: { bg: "rgba(245,158,11,0.15)", text: "#f59e0b", label: "Warning" },
    critical: { bg: "rgba(239,68,68,0.15)", text: "#ef4444", label: "Critical" },
  } as const;
  const c = config[level];
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: c.bg }}>
      <Text style={{ fontSize: labelSize, fontWeight: "600", color: c.text, textTransform: "uppercase" }}>
        {c.label}
      </Text>
    </View>
  );
}

function KpiCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "safe" | "warning" | "critical";
}) {
  const labelSize = useResponsiveFontSize("xs");
  const valueSize = useResponsiveFontSize("lg");
  const accentColor =
    accent === "critical" ? "#ef4444" : accent === "warning" ? "#f59e0b" : accent === "safe" ? "#14b8a6" : "#0b2540";
  return (
    <View style={{ flex: 1, backgroundColor: "white", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#e8eef3" }}>
      <Text style={{ fontSize: labelSize, fontWeight: "600", color: "#587a94", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
        {label}
      </Text>
      <Text style={{ fontSize: valueSize, fontWeight: "700", color: accentColor }}>{value}</Text>
      {hint && <Text style={{ fontSize: labelSize * 0.85, color: "#9bb4c7", marginTop: 2 }}>{hint}</Text>}
    </View>
  );
}

function IceProgress({
  iceRemainingKg,
  recommendedIceKg,
  pctRemaining,
  risk,
}: {
  iceRemainingKg: number;
  recommendedIceKg: number;
  pctRemaining: number;
  risk: RiskLevel;
}) {
  const labelSize = useResponsiveFontSize("sm");
  const barColor = risk === "critical" ? "#ef4444" : risk === "warning" ? "#f59e0b" : "#14b8a6";
  return (
    <View style={{ backgroundColor: "white", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#e8eef3", shadowColor: "#0b2540", shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
        <Text style={{ fontSize: labelSize, fontWeight: "600", color: "#0b2540" }}>Ice Monitoring</Text>
        <Text style={{ fontSize: labelSize * 0.8, color: "#9bb4c7" }}>{pctRemaining}%</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
        <Text style={{ fontSize: labelSize * 1.6, fontWeight: "700", color: "#0b2540" }}>{iceRemainingKg}</Text>
        <Text style={{ fontSize: labelSize * 0.85, color: "#9bb4c7" }}>/ {recommendedIceKg}kg</Text>
      </View>
      <View style={{ height: 10, backgroundColor: "#e8eef3", borderRadius: 999, overflow: "hidden" }}>
        <View style={{ height: "100%", width: `${Math.min(100, Math.max(0, pctRemaining))}%`, backgroundColor: barColor, borderRadius: 999 }} />
      </View>
    </View>
  );
}

function FreshnessGauge({ pct, risk }: { pct: number; risk: RiskLevel }) {
  const labelSize = useResponsiveFontSize("sm");
  const gaugeColor = risk === "critical" ? "#ef4444" : risk === "warning" ? "#f59e0b" : "#14b8a6";
  const riskLabel = risk === "critical" ? "High Risk" : risk === "warning" ? "Moderate" : "Good";
  const size = 100;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.min(100, Math.max(0, pct)) / 100) * circumference;
  return (
    <View style={{ backgroundColor: "white", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#e8eef3", shadowColor: "#0b2540", shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2, flexDirection: "row", alignItems: "center", gap: 16 }}>
      <View style={{ width: size, height: size }}>
        <Svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#e8eef3" strokeWidth={strokeWidth} fill="none" />
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke={gaugeColor} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeDasharray={`${dash} ${circumference}`} rotation="-90" origin={`${size / 2}, ${size / 2}`} />
        </Svg>
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: labelSize, fontWeight: "700", color: "#0b2540" }}>{pct}%</Text>
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: labelSize * 0.8, fontWeight: "600", color: "#587a94", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Freshness Score</Text>
        <Text style={{ fontSize: labelSize * 1.6, fontWeight: "700", color: "#0b2540" }}>{pct}<Text style={{ fontSize: labelSize }}>%</Text></Text>
        <Text style={{ fontSize: labelSize * 0.8, fontWeight: "600", color: gaugeColor, textTransform: "uppercase", marginTop: 4 }}>{riskLabel}</Text>
      </View>
    </View>
  );
}

function IceChart({ trip, live }: { trip: Trip; live: ReturnType<typeof liveStateFor> }) {
  const chartData = useMemo(() => {
    const total = trip.recommendedIceKg;
    const elapsed = live.elapsedHours;
    const safeDur = trip.safeDurationHours;
    const pts: { hour: number; actual: number; forecast: number }[] = [];
    const past = Math.max(1, Math.ceil(elapsed));
    for (let h = 0; h <= past; h++) {
      const v = Math.max(0, total - h * trip.meltRateKgPerHr);
      pts.push({ hour: h, actual: Math.round(v * 10) / 10, forecast: 0 });
    }
    const startV = pts[pts.length - 1]?.actual ?? total;
    const remainingHrs = Math.max(0, safeDur - past);
    for (let h = 1; h <= Math.min(remainingHrs, 8); h++) {
      const v = Math.max(0, startV - h * trip.meltRateKgPerHr);
      pts.push({ hour: past + h, actual: 0, forecast: Math.round(v * 10) / 10 });
    }
    return pts;
  }, [trip, live.elapsedHours]);

  const maxVal = trip.recommendedIceKg * 1.1;
  const chartW = 300;
  const chartH = 140;
  const padL = 36;
  const padR = 12;
  const padT = 8;
  const padB = 20;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;
  const totalPts = Math.max(1, chartData.length - 1);
  const toX = (h: number) => padL + (h / totalPts) * plotW;
  const toY = (v: number) => padT + plotH - (v / maxVal) * plotH;
  const actualPts = chartData.filter((d) => d.actual > 0).map((d) => `${toX(d.hour)},${toY(d.actual)}`).join(" ");
  const forecastPts = chartData.filter((d) => d.forecast > 0).map((d) => `${toX(d.hour)},${toY(d.forecast)}`).join(" ");
  const gridYs = [0, 0.25, 0.5, 0.75, 1];
  const labelYs = [0, 0.5, 1];

  return (
    <View style={{ backgroundColor: "white", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#e8eef3", shadowColor: "#0b2540", shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: "#0b2540" }}>Ice vs Time</Text>
        <Text style={{ fontSize: 10, color: "#9bb4c7" }}>Melt {trip.meltRateKgPerHr} kg/hr</Text>
      </View>
      <Svg viewBox={`0 0 ${chartW} ${chartH}`} width={chartW} height={chartH}>
        <Defs>
          <SvgLinearGradient id="chartIce" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#14b8a6" stopOpacity={0.3} />
            <Stop offset="1" stopColor="#14b8a6" stopOpacity={0} />
          </SvgLinearGradient>
        </Defs>
        {gridYs.map((pct) => {
          const y = toY(pct * maxVal);
          return <Line key={`g-${pct}`} x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="#e8eef3" strokeWidth={1} strokeDasharray="3,3" />;
        })}
        {labelYs.map((pct) => {
          const y = toY(pct * maxVal);
          const val = Math.round(pct * maxVal);
          return <SvgText key={`yl-${pct}`} x={padL - 6} y={y + 3} fontSize={8} fill="#9bb4c7" textAnchor="end">{val}</SvgText>;
        })}
        {actualPts ? <Polyline points={actualPts} fill="none" stroke="#14b8a6" strokeWidth={2} strokeLinejoin="round" /> : null}
        {forecastPts ? <Polyline points={forecastPts} fill="none" stroke="#14b8a6" strokeWidth={2} strokeDasharray="4,4" strokeLinejoin="round" opacity={0.6} /> : null}
      </Svg>
    </View>
  );
}

function Recommendation({ risk, trip, live }: { risk: RiskLevel; trip: Trip; live: ReturnType<typeof liveStateFor> }) {
  const labelSize = useResponsiveFontSize("sm");
  const config =
    risk === "critical"
      ? { title: "Return to Shore", body: "Ice level critical. Cargo integrity at risk within the next hour.", bg: "#ef4444", text: "white" }
      : risk === "warning"
        ? { title: "Monitor Closely", body: "Melt rate above target. Consider topping up ice at the next stop.", bg: "#f59e0b", text: "#0b2540" }
        : { title: "Continue Trip", body: `Conditions stable. Estimated ${formatHours(trip.safeDurationHours - live.elapsedHours)} of safe duration remaining.`, bg: "#0b2540", text: "white" };
  return (
    <View style={{ borderRadius: 16, padding: 16, backgroundColor: config.bg }}>
      <Text style={{ fontSize: labelSize * 0.8, fontWeight: "700", color: config.text, textTransform: "uppercase", letterSpacing: 1, opacity: 0.8, marginBottom: 4 }}>Recommendation</Text>
      <Text style={{ fontSize: labelSize * 1.1, fontWeight: "700", color: config.text, marginBottom: 4 }}>{config.title}</Text>
      <Text style={{ fontSize: labelSize * 0.9, color: config.text, opacity: 0.9, lineHeight: labelSize * 1.4 }}>{config.body}</Text>
    </View>
  );
}

export default function MonitorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { isTablet } = useScreenDimensions();
  const titleSize = useResponsiveFontSize("xl");
  const labelSize = useResponsiveFontSize("sm");
  const padding = useResponsiveSpacing("lg");

  const [loading, setLoading] = useState(true);
  const [shipment, setShipment] = useState<ShipmentRow | null>(null);
  const [tripRow, setTripRow] = useState<TripRow | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      (async () => {
        setLoading(true);
        try {
          const s = await getShipment(Number(id));
          setShipment(s);
          if (s.trip_id) {
            const t = await getTrip(s.trip_id);
            setTripRow(t);
          } else {
            setTripRow(null);
          }
        } catch (e) {
          console.error("MonitorScreen: failed to load", e);
        } finally {
          setLoading(false);
        }
      })();
    }, [id]),
  );

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#1a8ad4" />
      </View>
    );
  }

  if (!shipment) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text style={{ fontSize: labelSize, color: "#9bb4c7", textAlign: "center" }}>Shipment not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: "#1a8ad4", borderRadius: 10 }}>
          <Text style={{ color: "white", fontWeight: "600", fontSize: labelSize }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (shipment.recommended_ice_kg == null) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text style={{ fontSize: labelSize, color: "#9bb4c7", textAlign: "center" }}>No ice data for this shipment</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: "#1a8ad4", borderRadius: 10 }}>
          <Text style={{ color: "white", fontWeight: "600", fontSize: labelSize }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const trip = buildTrip(shipment, tripRow);
  const product = getProduct(trip.productId);
  const profile = getProfileFor(trip.productId);
  const live = liveStateFor(trip);
  const isActive = trip.status === "active";

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
      <LinearGradient
        colors={["#173E61", "#246EA2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ paddingLeft: padding, paddingRight: padding, paddingBottom: padding, paddingTop: insets.top + 16 }}
      >
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <Text style={{ fontSize: labelSize, color: "rgba(255,255,255,0.7)", fontWeight: "500" }}>← Back</Text>
          {isActive && <RiskBadgeInline level={live.risk} />}
        </TouchableOpacity>
        <Text style={{ fontSize: titleSize, fontWeight: "700", color: "white" }}>{shipment.shipment_name}</Text>
        <Text style={{ fontSize: labelSize, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
          {product.label} · {profile.label}
        </Text>
        {!isActive && (
          <Text style={{ fontSize: labelSize * 0.8, color: "rgba(255,255,255,0.5)", marginTop: 6, textTransform: "uppercase" }}>
            {trip.status}
          </Text>
        )}
      </LinearGradient>

      <View style={{ paddingHorizontal: padding, paddingTop: padding, gap: 14 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "white", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: "#e8eef3" }}>
          <View>
            <Text style={{ fontSize: labelSize * 0.7, fontWeight: "600", color: "#587a94", textTransform: "uppercase", letterSpacing: 0.5 }}>Temperature Range</Text>
            <Text style={{ fontSize: labelSize, fontWeight: "600", color: "#0b2540" }}>{profile.range}</Text>
          </View>
          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: "rgba(6, 182, 212, 0.1)" }}>
            <Text style={{ fontSize: labelSize * 0.7, fontWeight: "700", color: "#06b6d4", textTransform: "uppercase" }}>{profile.label}</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          <KpiCard label="Ice Left" value={`${live.iceRemainingKg}kg`} hint={`/ ${trip.recommendedIceKg}kg`} />
          <KpiCard label="Elapsed" value={formatHours(live.elapsedHours)} hint={`of ${trip.durationHours}h`} />
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          <KpiCard label="Initial Ice" value={`${trip.recommendedIceKg}kg`} />
          <KpiCard label="Risk" value={live.risk.toUpperCase()} accent={live.risk} />
        </View>

        <IceProgress iceRemainingKg={live.iceRemainingKg} recommendedIceKg={trip.recommendedIceKg} pctRemaining={live.pctRemaining} risk={live.risk} />
        <FreshnessGauge pct={live.freshness} risk={live.risk} />
        <IceChart trip={trip} live={live} />
        <Recommendation risk={live.risk} trip={trip} live={live} />

        {trip.id && tripRow && (
          <TouchableOpacity onPress={() => router.push(`/trips/${tripRow.id}` as any)} activeOpacity={0.7} style={{ alignItems: "center", paddingVertical: 16, paddingBottom: 24 }}>
            <Text style={{ fontSize: labelSize, fontWeight: "600", color: "#1a8ad4" }}>View Trip Details →</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}
