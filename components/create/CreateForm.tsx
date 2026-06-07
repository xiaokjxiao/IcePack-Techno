import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";

import { router } from "expo-router";
import { CargoCategoryPicker } from "@/components/create/CargoCategoryPicker";
import { CalculationResult } from "@/components/create/CalculationResult";
import { SchedulePicker } from "@/components/create/SchedulePicker";
import { TempRangeCard } from "@/components/create/TempRangeCard";
import { ContainerRecommendationCard } from "@/components/create/ContainerRecommendationCard";
import { CreateButtons } from "@/components/create/CreateButtons";
import {
  PRODUCT_CATEGORIES,
  ICE_TYPES,
  calculateIce,
  calculateIceDistribution,
  calculateIceForType,
  getProfileFor,
  type IceTypeKey,
} from "@/lib/icepack/data";
import { createShipment, createTrip } from "@/lib/icepack/services";
import { getTravelTimeHours, getRoutingModes, getDefaultRoutingMode } from "@/lib/routing";
import { withRetry, isNetworkError, getUserNetworkErrorMessage } from "@/lib/network";
import type { PhotonFeature } from "@/lib/photon";

import { useResponsiveFontSize } from "@/hooks/use-responsive-size";
import { useScreenDimensions } from "@/hooks/use-screen-dimensions";
import { LocationAutocomplete } from "@/components/ui/LocationAutocomplete";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react-native";

const STEPS = [
  { num: 1, label: "Product Details" },
  { num: 2, label: "Route & Schedule" },
  { num: 3, label: "Quantity & Temp" },
];

type StepErrors = Record<string, boolean>;

const STEP1_REQUIRED = ["shipmentName"];
const STEP2_REQUIRED = ["originLocation", "destinationLocation"];
const STEP3_REQUIRED = ["weightPerContainer", "containerCount", "durationHours"];

export function CreateForm() {
  const { isTablet } = useScreenDimensions();
  const labelSize = useResponsiveFontSize("sm");
  const inputSize = useResponsiveFontSize("base");

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<StepErrors>({});

  const [productId, setProductId] = useState(PRODUCT_CATEGORIES[0].id);
  const [shipmentName, setShipmentName] = useState("");
  const [weightPerContainer, setWeightPerContainer] = useState("");
  const [containerCount, setContainerCount] = useState("");
  const [durationHours, setDurationHours] = useState("");
  const [originLocation, setOriginLocation] = useState("");
  const [destinationLocation, setDestinationLocation] = useState("");
  const [notes, setNotes] = useState("");

  const [hsCode, setHsCode] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedIceTypeKey, setSelectedIceTypeKey] = useState<IceTypeKey | null>(null);

  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isComputingRoute, setIsComputingRoute] = useState(false);
  const [routeError, setRouteError] = useState(false);
  const routeAbortRef = useRef<AbortController | null>(null);

  const [routingMode, setRoutingMode] = useState(() => getDefaultRoutingMode());

  const profile = getProfileFor(productId);

  useEffect(() => {
    if (!originCoords || !destCoords) return;

    if (routeAbortRef.current) {
      routeAbortRef.current.abort();
    }
    const controller = new AbortController();
    routeAbortRef.current = controller;

    let cancelled = false;
    setIsComputingRoute(true);
    setRouteError(false);

    (async () => {
      try {
        const hours = await getTravelTimeHours(
          originCoords.lat, originCoords.lng,
          destCoords.lat, destCoords.lng,
          controller.signal,
          routingMode,
        );
        if (cancelled) return;
        setDurationHours(String(hours));
        setRouteError(false);
      } catch {
        if (cancelled) return;
        setRouteError(true);
      } finally {
        if (!cancelled) {
          setIsComputingRoute(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [originCoords, destCoords, routingMode]);

  const displayName = shipmentName || "None";

  const totalCargoKg = useMemo(
    () => (Number(weightPerContainer) || 0) * (Number(containerCount) || 0),
    [weightPerContainer, containerCount],
  );

  const calc = useMemo(
    () => calculateIce(totalCargoKg, Number(durationHours) || 0, profile),
    [totalCargoKg, durationHours, profile],
  );

  const finalIceCalc = useMemo(() => {
    if (selectedIceTypeKey) {
      const iceType = ICE_TYPES[selectedIceTypeKey];
      const { amountKg, meltRateKgPerHr, safeDurationHours } = calculateIceForType(
        totalCargoKg, Number(durationHours) || 0, Number(containerCount) || 0, iceType, profile,
      );
      return { recommendedIceKg: amountKg, meltRateKgPerHr, safeDurationHours };
    }
    return calc;
  }, [selectedIceTypeKey, totalCargoKg, durationHours, containerCount, profile, calc]);

  const iceDistribution = useMemo(
    () => calculateIceDistribution(totalCargoKg, Number(durationHours) || 0, Number(containerCount) || 0, productId, profile),
    [totalCargoKg, durationHours, containerCount, productId, profile],
  );

  const canSubmit = totalCargoKg > 0 && Number(durationHours) > 0;
  const [isCreating, setIsCreating] = useState(false);

  const fieldValues: Record<string, string> = {
    shipmentName,
    originLocation,
    destinationLocation,
    weightPerContainer,
    containerCount,
    durationHours,
  };

  const validateStep = (stepNum: number): boolean => {
    const required =
      stepNum === 1 ? STEP1_REQUIRED :
      stepNum === 2 ? STEP2_REQUIRED :
      STEP3_REQUIRED;

    const newErrors: StepErrors = {};
    let valid = true;
    for (const key of required) {
      if (!fieldValues[key].trim()) {
        newErrors[key] = true;
        valid = false;
      }
    }
    setErrors(newErrors);
    return valid;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    setErrors({});
    setStep((s) => s - 1);
  };

  const clearFieldError = (key: string) => {
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleCreate = async (startNow: boolean) => {
    if (!canSubmit || isCreating) return;
    setIsCreating(true);
    try {
      let tripId: number | null = null;

      if (startNow) {
        const newTrip = await withRetry(() =>
          createTrip({
            trip_name: displayName,
            status: "active",
            started_at: new Date().toISOString(),
          }),
        );
        tripId = newTrip.id;
      }

      const shipmentInput: Record<string, unknown> = {
        shipment_name: displayName,
        cargo_category: productId,
        cargo_kg: totalCargoKg,
        duration_hours: Number(durationHours),
        target_temp_min_c: profile.tempMinC,
        target_temp_max_c: profile.tempMaxC,
        origin_location: originLocation || null,
        destination_location: destinationLocation || null,
        notes: notes || null,
        is_planned: !startNow,
        status: startNow ? "active" : "planned",
        recommended_ice_kg: finalIceCalc.recommendedIceKg,
        ice_remaining_kg: finalIceCalc.recommendedIceKg,
        melt_rate_kg_per_hr: finalIceCalc.meltRateKgPerHr,
        safe_duration_hours: finalIceCalc.safeDurationHours,
        ice_type: selectedIceTypeKey || null,
        hs_code: hsCode || null,
        supplier_name: supplierName || null,
        schedule: scheduleDate?.toISOString() || null,
        units_pallets: containerCount ? Math.round(Number(containerCount)) : null,
      };
      if (tripId !== null) {
        shipmentInput.trip_id = tripId;
      }
      await withRetry(() => createShipment(shipmentInput as any));

      setStep(1);
      setErrors({});
      setProductId(PRODUCT_CATEGORIES[0].id);
      setShipmentName("");
      setWeightPerContainer("");
      setContainerCount("");
      setDurationHours("");
      setOriginLocation("");
      setDestinationLocation("");
      setOriginCoords(null);
      setDestCoords(null);
      setIsComputingRoute(false);
      setRouteError(false);
      setRoutingMode(getDefaultRoutingMode());
      setNotes("");
      setHsCode("");
      setSupplierName("");
      setScheduleDate(null);
      setContainerCount("");
      setSelectedIceTypeKey(null);
      setIsCreating(false);

      router.replace("/(tabs)/shipments");
    } catch (e: unknown) {
      const msg = getUserNetworkErrorMessage(e);
      console.error("handleCreate:", msg, "| raw:", String(e ?? ""));
      Alert.alert(isNetworkError(e) ? "No Internet Connection" : "Error", msg);
      setIsCreating(false);
    }
  };

  const inputStyle = (fieldKey?: string) => ({
    fontSize: inputSize,
    backgroundColor: "#f4f8fa",
    borderWidth: fieldKey && errors[fieldKey] ? 2 : 1,
    borderColor: fieldKey && errors[fieldKey] ? "#ef4444" : "#e8eef3",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: isTablet ? 14 : 12,
    color: "#0b2540",
  });

  const requiredLabel = (title: string) => (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Text
        style={{
          fontSize: labelSize,
          fontWeight: "600",
          color: "#0b2540",
          marginBottom: 10,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {title}
      </Text>
      <Text style={{ color: "#ef4444", marginLeft: 2, marginBottom: 10, fontWeight: "700" }}> *</Text>
    </View>
  );

  const optionalLabel = (title: string) => (
    <Text
      style={{
        fontSize: labelSize,
        fontWeight: "600",
        color: "#0b2540",
        marginBottom: 10,
        textTransform: "uppercase",
        letterSpacing: 0.5,
      }}
    >
      {title}
    </Text>
  );

  const fieldLabel = (title: string) => (
    <Text
      style={{
        fontSize: labelSize,
        color: "#587a94",
        marginBottom: 6,
        fontWeight: "500",
      }}
    >
      {title}
    </Text>
  );

  const errorText = (fieldKey: string) =>
    errors[fieldKey] ? (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
        <AlertCircle size={12} color="#ef4444" strokeWidth={2} />
        <Text style={{ fontSize: 11, color: "#ef4444", fontWeight: "500" }}>
          Required
        </Text>
      </View>
    ) : null;

  const renderStepIndicator = () => (
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 4 }}>
      {STEPS.map((s, i) => (
        <View key={s.num} style={{ flexDirection: "row", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : 0 }}>
          <View style={{ alignItems: "center" }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: step >= s.num ? "#1a8ad4" : "#e8eef3",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: step >= s.num ? "#fff" : "#9bb4c7",
                  fontWeight: "700",
                  fontSize: 14,
                }}
              >
                {s.num}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 10,
                color: step >= s.num ? "#1a8ad4" : "#9bb4c7",
                marginTop: 4,
                fontWeight: "500",
                textAlign: "center",
              }}
            >
              {s.label}
            </Text>
          </View>
          {i < STEPS.length - 1 && (
            <View
              style={{
                flex: 1,
                height: 2,
                backgroundColor: step > s.num ? "#1a8ad4" : "#e8eef3",
                marginHorizontal: 8,
                marginBottom: 18,
              }}
            />
          )}
        </View>
      ))}
    </View>
  );

  return (
    <View style={{ gap: 24 }}>
      {renderStepIndicator()}

      {/* Step 1: Product Details */}
      {step === 1 && (
        <View style={{ gap: 20 }}>
          <View>
            {requiredLabel("Shipment Name")}
            <TextInput
              value={shipmentName}
              onChangeText={(v) => { setShipmentName(v); clearFieldError("shipmentName"); }}
              placeholder="Enter shipment name"
              placeholderTextColor={errors.shipmentName ? "#fca5a5" : "#9bb4c7"}
              style={inputStyle("shipmentName")}
            />
            {errorText("shipmentName")}
          </View>

          <View>
            {optionalLabel("Cargo Type")}
            <CargoCategoryPicker
              categories={PRODUCT_CATEGORIES}
              selectedId={productId}
              onSelect={(id) => setProductId(id)}
            />
          </View>

          <View>
            {optionalLabel("Storage Profile")}
            <TempRangeCard
              profile={{
                label: profile.label,
                minTemp: profile.tempMinC,
                maxTemp: profile.tempMaxC,
                meltFactor: profile.iceFactor,
                description: profile.note,
              }}
            />
          </View>

          <ContainerRecommendationCard
            container={PRODUCT_CATEGORIES.find((p) => p.id === productId)!.container}
            profile={profile.key}
          />
        </View>
      )}

      {/* Step 2: Route & Schedule */}
      {step === 2 && (
        <View style={{ gap: 20 }}>
          <View>
            {requiredLabel("Route")}
            <View style={{ gap: 12 }}>
              <View>
                {fieldLabel("Origin")}
                <LocationAutocomplete
                  value={originLocation}
                  onValueChange={(v) => { setOriginLocation(v); setOriginCoords(null); clearFieldError("originLocation"); }}
                  onLocationSelect={(feature: PhotonFeature) => {
                    const [lng, lat] = feature.geometry.coordinates;
                    setOriginCoords({ lat, lng });
                  }}
                  placeholder={errors.originLocation ? "Required — city or location" : "City or location"}
                />
                {errorText("originLocation")}
              </View>
              <View>
                {fieldLabel("Destination")}
                <LocationAutocomplete
                  value={destinationLocation}
                  onValueChange={(v) => { setDestinationLocation(v); setDestCoords(null); clearFieldError("destinationLocation"); }}
                  onLocationSelect={(feature: PhotonFeature) => {
                    const [lng, lat] = feature.geometry.coordinates;
                    setDestCoords({ lat, lng });
                  }}
                  placeholder={errors.destinationLocation ? "Required — city or location" : "City or location"}
                />
                {errorText("destinationLocation")}
              </View>
              {originCoords && destCoords && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    backgroundColor: routeError ? "#fef2f2" : isComputingRoute ? "#f0f9ff" : "#f0fdf4",
                    borderRadius: 10,
                    padding: 10,
                    borderWidth: 1,
                    borderColor: routeError ? "#fecaca" : isComputingRoute ? "#bae6fd" : "#bbf7d0",
                  }}
                >
                  {routeError ? (
                    <>
                      <AlertCircle size={14} color="#dc2626" strokeWidth={2} />
                      <Text style={{ fontSize: labelSize, color: "#dc2626", fontWeight: "500", flex: 1 }}>
                        Could not compute route. Enter duration manually.
                      </Text>
                    </>
                  ) : isComputingRoute ? (
                    <Text style={{ fontSize: labelSize, color: "#0369a1", fontWeight: "500" }}>
                      Calculating travel time...
                    </Text>
                  ) : (
                    (() => {
                      const totalMins = Math.round(Number(durationHours) * 60);
                      const h = Math.floor(totalMins / 60);
                      const m = totalMins % 60;
                      const formatted = h > 0 ? `${h}h ${m}m` : `${m}m`;
                      return (
                        <Text style={{ fontSize: labelSize, color: "#166534", fontWeight: "500" }}>
                          Estimated travel: {formatted}
                        </Text>
                      );
                    })()
                  )}
                </View>
              )}
            </View>
          </View>

          <View>
            {optionalLabel("Travel Mode")}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {getRoutingModes().map((m) => {
                const active = routingMode === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => setRoutingMode(m.id)}
                    activeOpacity={0.7}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: active ? "#1a8ad4" : "#f4f8fa",
                      borderWidth: 1,
                      borderColor: active ? "#1a8ad4" : "#e8eef3",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: labelSize * 0.85,
                        fontWeight: active ? "700" : "500",
                        color: active ? "#fff" : "#587a94",
                      }}
                    >
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View>
            {optionalLabel("Schedule")}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.75}
                style={[inputStyle(), { flex: 1, justifyContent: "center" }]}
              >
                <Text
                  style={{
                    fontSize: inputSize,
                    color: scheduleDate ? "#0b2540" : "#9bb4c7",
                  }}
                >
                  {scheduleDate
                    ? scheduleDate.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "Select date..."}
                </Text>
              </TouchableOpacity>
              {scheduleDate && (
                <TouchableOpacity
                  onPress={() => setScheduleDate(null)}
                  activeOpacity={0.75}
                  style={{
                    width: 48,
                    borderRadius: 12,
                    backgroundColor: "#fee2e2",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 16, color: "#ef4444", fontWeight: "600" }}>
                    ✕
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <SchedulePicker
              visible={showDatePicker}
              selected={scheduleDate}
              onSelect={setScheduleDate}
              onClose={() => setShowDatePicker(false)}
            />
          </View>

          <View>
            {optionalLabel("Customs & Supplier")}
            <View style={{ gap: 12 }}>
              <View>
                {fieldLabel("HS Code / Classification")}
                <TextInput
                  value={hsCode}
                  onChangeText={setHsCode}
                  placeholder="e.g. 0201.10"
                  placeholderTextColor="#9bb4c7"
                  style={inputStyle()}
                />
              </View>
              <View>
                {fieldLabel("Supplier / Producer Name")}
                <TextInput
                  value={supplierName}
                  onChangeText={setSupplierName}
                  placeholder="Supplier name"
                  placeholderTextColor="#9bb4c7"
                  style={inputStyle()}
                />
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Step 3: Quantity & Temperature */}
      {step === 3 && (
        <View style={{ gap: 20 }}>
          <View>
            {requiredLabel("Cargo Details")}
            <View className="flex-row gap-3">
              <View className="flex-1">
                {fieldLabel("Weight per container (kg)")}
                <TextInput
                  value={weightPerContainer}
                  onChangeText={(v) => { setWeightPerContainer(v); clearFieldError("weightPerContainer"); }}
                  keyboardType="decimal-pad"
                  placeholder={errors.weightPerContainer ? "Required" : "0"}
                  placeholderTextColor={errors.weightPerContainer ? "#fca5a5" : "#9bb4c7"}
                  style={inputStyle("weightPerContainer")}
                />
                {errorText("weightPerContainer")}
              </View>
              <View className="flex-1">
                {fieldLabel("Containers")}
                <TextInput
                  value={containerCount}
                  onChangeText={(v) => { setContainerCount(v.replace(/\D/g, "")); clearFieldError("containerCount"); }}
                  keyboardType="number-pad"
                  placeholder={errors.containerCount ? "Required" : "0"}
                  placeholderTextColor={errors.containerCount ? "#fca5a5" : "#9bb4c7"}
                  style={inputStyle("containerCount")}
                />
                {errorText("containerCount")}
              </View>
            </View>
            {totalCargoKg > 0 && (
              <Text
                style={{
                  fontSize: labelSize,
                  color: "#1a8ad4",
                  fontWeight: "600",
                  marginTop: 6,
                }}
              >
                Total weight: {totalCargoKg.toLocaleString()} kg
              </Text>
            )}
            <View style={{ marginTop: 16 }}>
              {fieldLabel("Duration (hrs)")}
              <TextInput
                value={durationHours}
                onChangeText={(v) => { setDurationHours(v); clearFieldError("durationHours"); }}
                keyboardType="decimal-pad"
                placeholder={errors.durationHours ? "Required" : "0"}
                placeholderTextColor={errors.durationHours ? "#fca5a5" : "#9bb4c7"}
                style={inputStyle("durationHours")}
              />
              {errorText("durationHours")}
            </View>
          </View>

          <View>
            {optionalLabel("Storage Profile")}
            <TempRangeCard
              profile={{
                label: profile.label,
                minTemp: profile.tempMinC,
                maxTemp: profile.tempMaxC,
                meltFactor: profile.iceFactor,
                description: profile.note,
              }}
            />
          </View>

          {selectedIceTypeKey == null && totalCargoKg > 0 && Number(durationHours) > 0 && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                backgroundColor: "#fef3c7",
                borderRadius: 10,
                padding: 12,
                borderWidth: 1,
                borderColor: "#fcd34d",
              }}
            >
              <AlertCircle size={16} color="#d97706" strokeWidth={2} />
              <Text style={{ fontSize: labelSize, color: "#92400e", fontWeight: "500", flex: 1 }}>
                Select an ice type below to calculate the exact amount needed for your shipment.
              </Text>
            </View>
          )}

          <CalculationResult
            recommendedIceKg={calc.recommendedIceKg}
            meltRateKgPerHr={calc.meltRateKgPerHr}
            safeDurationHours={calc.safeDurationHours}
            iceDistribution={iceDistribution}
            selectedIceTypeKey={selectedIceTypeKey}
            onSelectIceType={setSelectedIceTypeKey}
          />

          <View>
            {optionalLabel("Notes")}
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional notes..."
              placeholderTextColor="#9bb4c7"
              multiline
              numberOfLines={3}
              style={[inputStyle(), { minHeight: 80, textAlignVertical: "top" }]}
            />
          </View>
        </View>
      )}

      {/* Navigation */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        {step > 1 && (
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.85}
            style={{
              flex: step < 3 ? 1 : 0,
              paddingVertical: 14,
              borderRadius: 12,
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: "#e8eef3",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingHorizontal: step < 3 ? 0 : 20,
            }}
          >
            <ChevronLeft size={16} color="#0b2540" strokeWidth={2} />
            <Text style={{ fontSize: labelSize, fontWeight: "600", color: "#0b2540" }}>
              Back
            </Text>
          </TouchableOpacity>
        )}
        {step < 3 ? (
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.85}
            style={{
              flex: 1,
              paddingVertical: 14,
              borderRadius: 12,
              backgroundColor: "#0b2540",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Text style={{ fontSize: labelSize, fontWeight: "600", color: "#fff" }}>
              Next
            </Text>
            <ChevronRight size={16} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1 }}>
            <CreateButtons canSubmit={canSubmit} loading={isCreating} onCreate={handleCreate} />
          </View>
        )}
      </View>
    </View>
  );
}
