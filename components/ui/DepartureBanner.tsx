import React from "react";
import { TouchableOpacity, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Send } from "lucide-react-native";
import { useScreenDimensions } from "@/hooks/use-screen-dimensions";

interface DepartureEntry {
  name: string;
  time: string;
  shipmentId: number;
  tripId: number | null;
}

interface DepartureBannerProps {
  entries: DepartureEntry[];
}

function timeToMinutes(time: string): number {
  const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ap = match[3].toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

function closestEntry(entries: DepartureEntry[]): DepartureEntry {
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  return entries.reduce((best, e) => {
    const bestDiff = timeToMinutes(best.time) - currentMin;
    const eDiff = timeToMinutes(e.time) - currentMin;
    if (eDiff < 0) return best;
    if (bestDiff < 0) return e;
    return eDiff < bestDiff ? e : best;
  });
}

function relativeLabel(time: string): string | null {
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const targetMin = timeToMinutes(time);
  const diff = targetMin - currentMin;
  if (diff <= 0) return "now";
  if (diff < 60) return `in ${diff}m`;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m > 0 ? `in ${h}h ${m}m` : `in ${h}h`;
}

export function DepartureBanner({ entries }: DepartureBannerProps) {
  const { isTablet } = useScreenDimensions();
  const textSize = isTablet ? "text-sm" : "text-xs";
  const count = entries.length;
  if (count === 0) return null;

  const closest = closestEntry(entries);
  const rel = relativeLabel(closest.time);
  const navId = closest.tripId ?? closest.shipmentId;
  const navRoute = closest.tripId != null ? `/trips/${navId}` : `/shipments/${navId}`;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push(navRoute as any)}
      className="mx-4 rounded-2xl overflow-hidden"
    >
      <LinearGradient
        colors={["#f59e0b", "#d97706"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className={isTablet ? "px-5 py-4" : "px-4 py-3.5"}
      >
        <View className="flex-row items-center gap-3">
          <View
            className="bg-white/20 rounded-full items-center justify-center"
            style={{ width: isTablet ? 38 : 30, height: isTablet ? 38 : 30 }}
          >
            <Send size={isTablet ? 20 : 15} color="#fff" style={{ marginLeft: -1 }} />
          </View>

          <View className="flex-1">
            <Text className={`font-bold text-white ${isTablet ? "text-base" : "text-sm"}`}>
              {count === 1 ? "Departing Today" : `${count} Departures Today`}
            </Text>
            <Text className={`text-white/80 mt-0.5 ${textSize}`} numberOfLines={1}>
              {closest.name} at {closest.time}
              {rel && <Text className="text-white/50"> · {rel}</Text>}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}
