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
import { Play, CheckCircle2, XCircle, Gauge, ChevronLeft, Trash2, Package, FileText, Thermometer } from "lucide-react-native";
import { EditableField } from "@/components/ui/EditableField";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast, ToastBanner } from "@/components/ui/toast";
import { useUserRole } from "@/hooks/use-user-role";
import {
  useResponsiveFontSize,
  useResponsiveSpacing,
} from "@/hooks/use-responsive-size";
import { useScreenDimensions } from "@/hooks/use-screen-dimensions";
import type { Database } from "@/lib/database.types";
import {
  getProduct,
  getProfileFor,
  calculateIceDistribution,
  type IceTypeKey,
  type TripStatus,
} from "@/lib/icepack/data";
import { ProductIcon } from "@/components/ui/ProductIcon";
import { CalculationResult } from "@/components/create/CalculationResult";
import {
  getShipment,
  getTrip,
  updateShipment,
  updateShipmentStatus,
  startSoloShipment,
  deleteShipment,
} from "@/lib/icepack/services";

type ShipmentRow = Database["public"]["Tables"]["shipments"]["Row"];
type TripRow = Database["public"]["Tables"]["trips"]["Row"];

function Info({
  label,
  value,
  strong,
  accent,
  alignTop,
}: {
  label: string;
  value: string;
  strong?: boolean;
  accent?: boolean;
  alignTop?: boolean;
}) {
  const baseSize = useResponsiveFontSize("sm");
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: alignTop ? "flex-start" : "center",
      }}
    >
      <Text style={{ fontSize: baseSize, color: "#0b2540" }}>{label}</Text>
      <Text
        style={{
          fontSize: strong ? baseSize * 1.1 : baseSize,
          fontWeight: "600",
          color: accent ? "#14b8a6" : strong ? "#0b2540" : "#0b2540",
          flexShrink: 1,
          textAlign: "right",
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export default function ShipmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { isTablet } = useScreenDimensions();
  const titleSize = useResponsiveFontSize("2xl");
  const labelSize = useResponsiveFontSize("sm");
  const baseSize = useResponsiveFontSize("base");
  const padding = useResponsiveSpacing("lg");

  const [loading, setLoading] = useState(true);
  const [shipment, setShipment] = useState<ShipmentRow | null>(null);
  const [trip, setTrip] = useState<TripRow | null>(null);
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
          const s = await getShipment(Number(id));
          setShipment(s);
          if (s.trip_id) {
            const t = await getTrip(s.trip_id);
            setTrip(t);
          }
        } catch (e) {
          console.error("ShipmentDetail: failed to load", e);
        } finally {
          setLoading(false);
        }
      })();
    }, [id]),
  );

  const handleStatusChange = useCallback(
    async (newStatus: TripStatus) => {
      if (!shipment) return;
      setActionLoading(true);
      try {
        if (!shipment.trip_id && newStatus === "active") {
          const newTrip = await startSoloShipment(shipment.id, shipment.shipment_name);
          setShipment((prev) => prev ? { ...prev, status: "active", trip_id: newTrip.id, is_planned: false } : null);
          setTrip(newTrip);
        } else {
          await updateShipmentStatus(shipment.id, newStatus);
          setShipment((prev) => prev ? { ...prev, status: newStatus } : null);
        }
      } catch (e) {
        console.error("Failed to update status", e);
      } finally {
        setActionLoading(false);
      }
    },
    [shipment],
  );

  const handleSaveName = useCallback(async (newName: string) => {
    if (!shipment) return;
    await updateShipment(shipment.id, { shipment_name: newName });
    setShipment((p) => p ? { ...p, shipment_name: newName } : null);
    showToast({ message: "Shipment name updated" });
  }, [shipment, showToast]);

  const executeDeleteShipment = useCallback(async () => {
    if (!shipment) return;
    console.log("[ShipmentDetail] Deleting shipment", shipment.id, shipment.shipment_name);
    try {
      await deleteShipment(shipment.id);
      console.log("[ShipmentDetail] Deleted shipment", shipment.id);
      showToast({ message: "Shipment deleted" });
      setTimeout(() => router.back(), 400);
    } catch (e) {
      console.error("[ShipmentDetail] Failed to delete shipment", shipment.id, e);
      showToast({ message: "Failed to delete shipment", variant: "error" });
    }
  }, [shipment, showToast]);

  const promptDelete = useCallback(() => {
    if (!shipment) return;
    setDialog({
      visible: true,
      title: "Delete Shipment",
      message: `Delete "${shipment.shipment_name}"? This cannot be undone.`,
      confirmLabel: "Delete",
      destructive: true,
      onConfirm: async () => {
        setDialog((d) => ({ ...d, visible: false }));
        await executeDeleteShipment();
      },
    });
  }, [shipment, executeDeleteShipment]);

  const promptComplete = useCallback(() => {
    if (!shipment) return;
    setDialog({
      visible: true,
      title: "Complete Shipment",
      message: `Mark "${shipment.shipment_name}" as delivered?`,
      confirmLabel: "Complete",
      destructive: false,
      onConfirm: async () => {
        setDialog((d) => ({ ...d, visible: false }));
        await handleStatusChange("completed");
      },
    });
  }, [shipment, handleStatusChange]);

  const promptCancel = useCallback(() => {
    if (!shipment) return;
    setDialog({
      visible: true,
      title: "Cancel Shipment",
      message: `Cancel "${shipment.shipment_name}"?`,
      confirmLabel: "Cancel",
      destructive: true,
      onConfirm: async () => {
        setDialog((d) => ({ ...d, visible: false }));
        await handleStatusChange("cancelled");
      },
    });
  }, [shipment, handleStatusChange]);

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
        <Text style={{ fontSize: labelSize, color: "#9bb4c7", textAlign: "center" }}>
          Shipment not found
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

  const product = getProduct(shipment.cargo_category);
  const profile = getProfileFor(shipment.cargo_category);

  return (
    <>
      <ScrollView
        className="flex-1 bg-white"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
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
            style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}
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

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <ProductIcon name={product.icon} size={titleSize} color="white" />
            <View style={{ flex: 1 }}>
              {isTracker ? (
                <Text style={{ fontSize: titleSize, fontWeight: "700", color: "white" }}>
                  {shipment.shipment_name}
                </Text>
              ) : (
                <EditableField
                  value={shipment.shipment_name}
                  onSave={handleSaveName}
                  fontSize={titleSize}
                />
              )}
              <Text style={{ fontSize: labelSize, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
                {product.label}
              </Text>
            </View>
          </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginTop: 10,
          }}
        >
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 3,
              borderRadius: 12,
              backgroundColor: shipment.status === "active"
                ? "rgba(20, 184, 166, 0.2)"
                : shipment.status === "planned"
                  ? "rgba(6, 182, 212, 0.2)"
                  : shipment.status === "completed"
                    ? "rgba(34, 197, 94, 0.2)"
                    : "rgba(148, 163, 184, 0.2)",
            }}
          >
            <Text
              style={{
                fontSize: labelSize * 0.8,
                fontWeight: "600",
                color: shipment.status === "active" ? "#5eead4" : shipment.status === "planned" ? "#67e8f9" : shipment.status === "completed" ? "#86efac" : "#cbd5e1",
                textTransform: "uppercase",
              }}
            >
              {shipment.status}
            </Text>
          </View>
          {trip && (
            <Text style={{ fontSize: labelSize, color: "rgba(255,255,255,0.6)" }}>
              Trip: {trip.trip_name}
            </Text>
          )}
        </View>
      </LinearGradient>

      <View style={{ paddingHorizontal: padding, paddingTop: padding, gap: 16 }}>
        {/* Cargo Info */}
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 16,
            padding: isTablet ? 20 : 16,
            borderWidth: 1,
            borderColor: "#e8eef3",
            shadowColor: "#0b2540",
            shadowOpacity: 0.04,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <Package size={16} color="#587a94" strokeWidth={1.5} />
            <Text
              style={{
                fontSize: labelSize * 0.9,
                fontWeight: "600",
                color: "#587a94",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Cargo Info
            </Text>
          </View>
          <View style={{ gap: 10 }}>
            <Info label="Cargo" value={`${shipment.cargo_kg} kg`} />
            <Info label="Duration" value={`${shipment.duration_hours} hrs`} />

            {shipment.origin_location && (
              <Info label="Origin" value={shipment.origin_location} alignTop />
            )}
            {shipment.destination_location && (
              <Info label="Destination" value={shipment.destination_location} alignTop />
            )}
          </View>
        </View>

        {/* Customs & Logistics */}
        {(shipment.hs_code || shipment.supplier_name || shipment.schedule || shipment.units_pallets) && (
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: isTablet ? 20 : 16,
              borderWidth: 1,
              borderColor: "#e8eef3",
              shadowColor: "#0b2540",
              shadowOpacity: 0.04,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 2,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <FileText size={16} color="#587a94" strokeWidth={1.5} />
              <Text
                style={{
                  fontSize: labelSize * 0.9,
                  fontWeight: "600",
                  color: "#587a94",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Customs & Logistics
              </Text>
            </View>
            <View style={{ gap: 10 }}>
              {shipment.hs_code && (
                <Info label="HS Code" value={shipment.hs_code} />
              )}
              {shipment.supplier_name && (
                <Info label="Supplier" value={shipment.supplier_name} />
              )}
              {shipment.schedule && (
                <Info
                  label="Schedule"
                  value={new Date(shipment.schedule).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                />
              )}
              {shipment.units_pallets != null && (
                <Info label="Units / Pallets" value={String(shipment.units_pallets)} />
              )}
            </View>
          </View>
        )}

        {/* Storage Profile */}
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 16,
            padding: isTablet ? 20 : 16,
            borderWidth: 1,
            borderColor: "#e8eef3",
            shadowColor: "#0b2540",
            shadowOpacity: 0.04,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <Thermometer size={16} color="#587a94" strokeWidth={1.5} />
            <Text
              style={{
                fontSize: labelSize * 0.9,
                fontWeight: "600",
                color: "#587a94",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Storage Profile
            </Text>
          </View>
          <View style={{ gap: 10 }}>
            <Info label="Type" value={profile.label} />
            <Info label="Range" value={profile.range} />
            <Info label="Melt Factor" value={`${profile.iceFactor} kg/kg·day`} />
            <Text style={{ fontSize: labelSize * 0.85, color: "#9bb4c7", marginTop: 4 }}>
              {profile.note}
            </Text>
          </View>
        </View>

        {/* Ice Calculation */}
        {shipment.recommended_ice_kg != null && (
          <CalculationResult
            recommendedIceKg={shipment.recommended_ice_kg}
            meltRateKgPerHr={shipment.melt_rate_kg_per_hr ?? 0}
            safeDurationHours={shipment.safe_duration_hours ?? 0}
            iceDistribution={calculateIceDistribution(
              shipment.cargo_kg ?? 0,
              shipment.duration_hours ?? 0,
              shipment.units_pallets ?? 0,
              shipment.cargo_category,
              profile,
            )}
            selectedIceTypeKey={shipment.ice_type as IceTypeKey | undefined ?? null}
          />
        )}

        {/* Notes */}
        {shipment.notes && (
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: isTablet ? 20 : 16,
              borderWidth: 1,
              borderColor: "#e8eef3",
            }}
          >
            <Text
              style={{
                fontSize: labelSize * 0.9,
                fontWeight: "600",
                color: "#587a94",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 8,
              }}
            >
              Notes
            </Text>
            <Text style={{ fontSize: baseSize, color: "#0b2540", lineHeight: baseSize * 1.5 }}>
              {shipment.notes}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={{ paddingBottom: 20, gap: 10 }}>
          {isTracker && shipment.status === "active" && (
            <TouchableOpacity
              onPress={() => router.push(`/monitor/${shipment.id}` as any)}
              activeOpacity={0.85}
              style={{
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: "#0b2540",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Gauge size={18} color="#14b8a6" strokeWidth={2} />
              <Text style={{ fontSize: labelSize, fontWeight: "700", color: "white" }}>
                Live Monitor
              </Text>
            </TouchableOpacity>
          )}

          {isTracker && shipment.status === "completed" && (
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
                Delivered
              </Text>
            </View>
          )}

          {isTracker && shipment.status === "cancelled" && (
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
              {!trip && (
                <View
                  style={{
                    backgroundColor: "#f4f8fa",
                    borderRadius: 12,
                    padding: 14,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: "#e8eef3",
                  }}
                >
                  <Text style={{ fontSize: labelSize, color: "#587a94", textAlign: "center" }}>
                    This shipment is not linked to any trip. Group it from the Shipments list.
                  </Text>
                </View>
              )}

              {shipment.status === "planned" && (
                <TouchableOpacity
                  onPress={() => handleStatusChange("active")}
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
                    {actionLoading ? "Starting..." : "Start Shipment"}
                  </Text>
                </TouchableOpacity>
              )}

              {shipment.status === "active" && (
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
                      {actionLoading ? "Completing..." : "Complete Shipment"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => router.push(`/monitor/${shipment.id}` as any)}
                    activeOpacity={0.85}
                    style={{
                      paddingVertical: 14,
                      borderRadius: 12,
                      backgroundColor: "#0b2540",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <Gauge size={18} color="#14b8a6" strokeWidth={2} />
                    <Text style={{ fontSize: labelSize, fontWeight: "700", color: "white" }}>
                      Live Monitor
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {shipment.status !== "completed" && shipment.status !== "cancelled" && (
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
                    Cancel Shipment
                  </Text>
                </TouchableOpacity>
              )}

              {shipment.status === "completed" && (
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
                    Delivered
                  </Text>
                </View>
              )}

              {shipment.status === "cancelled" && (
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
