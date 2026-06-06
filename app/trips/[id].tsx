import { useCallback, useState } from "react";
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
import { Play, CheckCircle2, XCircle, ChevronLeft, Trash2 } from "lucide-react-native";
import { EditableField } from "@/components/ui/EditableField";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast, ToastBanner } from "@/components/ui/toast";
import { ShipmentCard, type ShipmentView } from "@/components/shipments/ShipmentCard";
import { useUserRole } from "@/hooks/use-user-role";
import {
  useResponsiveFontSize,
  useResponsiveSpacing,
} from "@/hooks/use-responsive-size";
import type { Database } from "@/lib/database.types";
import type { Trip } from "@/lib/icepack/data";
import {
  getTripWithShipmentsById,
  getShipmentsByTripId,
  startTrip,
  completeTrip,
  cancelTrip,
  deleteTrip,
  updateTrip,
} from "@/lib/icepack/services";

type ShipmentRow = Database["public"]["Tables"]["shipments"]["Row"];

function toShipmentView(s: ShipmentRow, trip: Trip): ShipmentView {
  return {
    id: s.id,
    name: s.shipment_name,
    productId: s.cargo_category,
    cargoKg: s.cargo_kg,
    durationHours: s.duration_hours,
    originLocation: s.origin_location,
    destinationLocation: s.destination_location,
    tripId: trip.id,
    tripName: trip.name,
    tripStatus: trip.status,
    shipmentStatus: s.status,
    isPlanned: s.is_planned ?? false,
    recommendedIceKg: s.recommended_ice_kg ?? null,
    iceRemainingKg: s.ice_remaining_kg ?? null,
    meltRateKgPerHr: s.melt_rate_kg_per_hr ?? null,
    safeDurationHours: s.safe_duration_hours ?? null,
    startedAt: trip.startedAt,
  };
}

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const titleSize = useResponsiveFontSize("2xl");
  const labelSize = useResponsiveFontSize("sm");
  const padding = useResponsiveSpacing("lg");

  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [allShipments, setAllShipments] = useState<ShipmentRow[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const { isTracker } = useUserRole();
  const { toast, show: showToast } = useToast();
  const [dialog, setDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    confirmLabel: string;
    destructive?: boolean;
  }>({ visible: false, title: "", message: "", onConfirm: () => {}, confirmLabel: "", destructive: false });

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      (async () => {
        setLoading(true);
        try {
          const mainTrip = await getTripWithShipmentsById(Number(id));
          setTrip(mainTrip);
          if (mainTrip?.id) {
            const shipments = await getShipmentsByTripId(mainTrip.id);
            setAllShipments(shipments);
          } else {
            setAllShipments([]);
          }
        } catch (e) {
          console.error("TripDetailScreen: failed to load", e);
        } finally {
          setLoading(false);
        }
      })();
    }, [id]),
  );

  const handleStartTrip = useCallback(async () => {
    if (!trip || actionLoading) return;
    setActionLoading(true);
    const prevTrip = trip;
    const prevShipments = allShipments;
    const now = new Date().toISOString();
    setTrip((p) => p ? { ...p, status: "active" as const, startedAt: now } : null);
    setAllShipments((prev) => prev.map((s) => ({ ...s, status: "active" as const })));
    try {
      await startTrip(trip.id);
    } catch (e) {
      setTrip(prevTrip);
      setAllShipments(prevShipments);
      console.error("Failed to start trip", e);
    } finally {
      setActionLoading(false);
    }
  }, [trip, allShipments, actionLoading]);

  const handleSaveName = useCallback(async (newName: string) => {
    if (!trip) return;
    await updateTrip(trip.id, { trip_name: newName });
    setTrip((p) => p ? { ...p, name: newName } : null);
    showToast({ message: "Trip name updated" });
  }, [trip, showToast]);

  const executeCompleteTrip = useCallback(async () => {
    if (!trip || actionLoading) return;
    setActionLoading(true);
    const prevTrip = trip;
    const prevShipments = allShipments;
    setTrip((p) => p ? { ...p, status: "completed" as const } : null);
    setAllShipments((prev) => prev.map((s) => ({ ...s, status: "completed" as const })));
    try {
      await completeTrip(trip.id);
    } catch (e) {
      setTrip(prevTrip);
      setAllShipments(prevShipments);
    } finally {
      setActionLoading(false);
    }
  }, [trip, allShipments, actionLoading]);

  const executeCancelTrip = useCallback(async () => {
    if (!trip || actionLoading) return;
    setActionLoading(true);
    const prevTrip = trip;
    const prevShipments = allShipments;
    setTrip((p) => p ? { ...p, status: "completed" as const } : null);
    setAllShipments((prev) => prev.map((s) => ({ ...s, status: "cancelled" as const })));
    try {
      await cancelTrip(trip.id);
    } catch (e) {
      setTrip(prevTrip);
      setAllShipments(prevShipments);
    } finally {
      setActionLoading(false);
    }
  }, [trip, allShipments, actionLoading]);

  const executeDeleteTrip = useCallback(async () => {
    if (!trip || actionLoading) return;
    console.log("[TripDetail] Deleting trip", trip.id, trip.name);
    try {
      await deleteTrip(trip.id);
      console.log("[TripDetail] Deleted trip", trip.id);
      showToast({ message: "Trip deleted" });
      setTimeout(() => router.back(), 400);
    } catch (e) {
      console.error("[TripDetail] Failed to delete trip", trip.id, e);
      showToast({ message: "Failed to delete trip", variant: "error" });
    }
  }, [trip, actionLoading, showToast]);

  const promptDelete = useCallback(() => {
    if (!trip) return;
    setDialog({
      visible: true,
      title: "Delete Trip",
      message: `Delete "${trip.name}" and all its shipments? This cannot be undone.`,
      confirmLabel: "Delete",
      destructive: true,
      onConfirm: async () => {
        setDialog((d) => ({ ...d, visible: false }));
        await executeDeleteTrip();
      },
    });
  }, [trip, executeDeleteTrip]);

  const promptComplete = useCallback(() => {
    if (!trip) return;
    setDialog({
      visible: true,
      title: "Complete Trip",
      message: `Mark "${trip.name}" as completed? All shipments will also be marked delivered.`,
      confirmLabel: "Complete",
      destructive: false,
      onConfirm: async () => {
        setDialog((d) => ({ ...d, visible: false }));
        await executeCompleteTrip();
      },
    });
  }, [trip, executeCompleteTrip]);

  const promptCancel = useCallback(() => {
    if (!trip) return;
    setDialog({
      visible: true,
      title: "Cancel Trip",
      message: `Cancel "${trip.name}"? All shipments in this trip will be cancelled.`,
      confirmLabel: "Cancel",
      destructive: true,
      onConfirm: async () => {
        setDialog((d) => ({ ...d, visible: false }));
        await executeCancelTrip();
      },
    });
  }, [trip, executeCancelTrip]);

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#1a8ad4" />
      </View>
    );
  }

  if (!trip) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text style={{ fontSize: labelSize, color: "#9bb4c7", textAlign: "center" }}>
          Trip not found
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 16, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: "#1a8ad4", borderRadius: 10 }}
        >
          <Text style={{ color: "white", fontWeight: "600", fontSize: labelSize }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        className="flex-1 bg-white"
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
    >
      <LinearGradient
        colors={["#173E61", "#246EA2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          paddingLeft: padding,
          paddingRight: padding,
          paddingBottom: padding,
          paddingTop: insets.top + 16,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <ChevronLeft size={labelSize + 4} color="rgba(255,255,255,0.7)" strokeWidth={2} />
            <Text style={{ fontSize: labelSize, color: "rgba(255,255,255,0.7)", fontWeight: "500" }}>
              Back
            </Text>
          </TouchableOpacity>
          {!isTracker && (
            <View style={{ flexDirection: "row", gap: 16 }}>
              <TouchableOpacity
                onPress={promptDelete}
                activeOpacity={0.7}
                style={{ padding: 4 }}
              >
                <Trash2 size={18} color="rgba(255,255,255,0.7)" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          )}
        </View>
        {isTracker ? (
          <Text style={{ fontSize: titleSize, fontWeight: "700", color: "white" }}>
            {trip.name}
          </Text>
        ) : (
          <EditableField
            value={trip.name}
            onSave={handleSaveName}
            fontSize={titleSize}
          />
        )}
        {allShipments.length > 1 && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginTop: 6,
            }}
          >
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 12,
              }}
            >
            </View>
            <Text
              style={{
                fontSize: labelSize,
                color: "rgba(255,255,255,0.6)",
              }}
            >
              {allShipments.length} shipments
            </Text>
          </View>
        )}
        <Text
          style={{
            fontSize: labelSize,
            color: "rgba(255,255,255,0.6)",
            marginTop: 4,
          }}
        >
          Status: {trip.status}
        </Text>
      </LinearGradient>

      <View style={{ paddingHorizontal: padding, paddingTop: padding, gap: 12 }}>
        {allShipments.map((s) => (
          <ShipmentCard key={s.id} shipment={toShipmentView(s, trip)} />
        ))}

        {/* Action Buttons */}
        <View style={{ paddingTop: 8, paddingBottom: 20, gap: 10 }}>
          {isTracker && trip.status === "completed" && (
            <View
              style={{
                backgroundColor: "#f0fdf4",
                borderRadius: 12,
                padding: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#bbf7d0",
              }}
            >
              <Text style={{ fontSize: labelSize, color: "#16a34a", fontWeight: "600" }}>
                Completed
              </Text>
            </View>
          )}

          {isTracker && trip.status === "cancelled" && (
            <View
              style={{
                backgroundColor: "#fef2f2",
                borderRadius: 12,
                padding: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#fecaca",
              }}
            >
              <Text style={{ fontSize: labelSize, color: "#dc2626", fontWeight: "600" }}>
                Cancelled
              </Text>
            </View>
          )}

          {!isTracker && (
            <>
              {trip.status === "planned" && (
                <TouchableOpacity
                  onPress={handleStartTrip}
                  disabled={actionLoading}
                  activeOpacity={0.85}
                  style={{
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: actionLoading ? "#94c5e8" : "#14b8a6",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Play size={18} color="white" strokeWidth={2} />
                  )}
                  <Text style={{ fontSize: labelSize, fontWeight: "700", color: "white" }}>
                    {actionLoading ? "Starting..." : "Start Trip"}
                  </Text>
                </TouchableOpacity>
              )}

              {trip.status === "active" && (
                <>
                  <TouchableOpacity
                    onPress={promptComplete}
                    disabled={actionLoading}
                    activeOpacity={0.85}
                    style={{
                      paddingVertical: 14,
                      borderRadius: 12,
                      backgroundColor: actionLoading ? "#94c5e8" : "#1a8ad4",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    {actionLoading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <CheckCircle2 size={18} color="white" strokeWidth={2} />
                    )}
                    <Text style={{ fontSize: labelSize, fontWeight: "700", color: "white" }}>
                      {actionLoading ? "Completing..." : "Complete Trip"}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {trip.status !== "completed" && trip.status !== "cancelled" && (
                <TouchableOpacity
                  onPress={promptCancel}
                  disabled={actionLoading}
                  activeOpacity={0.85}
                  style={{
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: "#fff",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    borderWidth: 1,
                    borderColor: "#e8eef3",
                  }}
                >
                  <XCircle size={18} color="#ef4444" strokeWidth={2} />
                  <Text style={{ fontSize: labelSize, fontWeight: "600", color: "#ef4444" }}>
                    Cancel Trip
                  </Text>
                </TouchableOpacity>
              )}

              {trip.status === "completed" && (
                <View
                  style={{
                    backgroundColor: "#f0fdf4",
                    borderRadius: 12,
                    padding: 14,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: "#bbf7d0",
                  }}
                >
                  <Text style={{ fontSize: labelSize, color: "#16a34a", fontWeight: "600" }}>
                    Completed
                  </Text>
                </View>
              )}

              {trip.status === "cancelled" && (
                <View
                  style={{
                    backgroundColor: "#fef2f2",
                    borderRadius: 12,
                    padding: 14,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: "#fecaca",
                  }}
                >
                  <Text style={{ fontSize: labelSize, color: "#dc2626", fontWeight: "600" }}>
                    Cancelled
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </ScrollView>

      <ConfirmDialog
      visible={dialog.visible}
      title={dialog.title}
      message={dialog.message}
      actions={[
        { label: dialog.confirmLabel, onPress: dialog.onConfirm, variant: dialog.destructive ? "destructive" : "default" },
        { label: "Go Back", onPress: () => {}, variant: "cancel" },
      ]}
      onClose={() => setDialog((d) => ({ ...d, visible: false }))}
    />

      <ToastBanner toast={toast} />
    </>
  );
}
